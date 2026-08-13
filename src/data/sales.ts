import "server-only";

import { and, count, desc, eq, gte, ilike, max, or, sum, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { businesses, customers, motorcycleImages, motorcycleReservations, motorcycleSales, motorcycleServiceRecords, motorcycles } from "@/db/schema";
import { DomainError } from "@/domain/errors";
import { assertMotorcycleCanBeReserved, assertMotorcycleCanBeSold, warrantyExpiry, type ReservationInput, type SaleInput } from "@/domain/sales";
import type { ServiceRecordInput } from "@/domain/service-record";

export async function reserveMotorcycle(input: { businessId: string; motorcycleId: string; reservation: ReservationInput }) {
  return db.transaction(async (transaction) => {
    const [motorcycle] = await transaction.select().from(motorcycles).where(and(eq(motorcycles.id, input.motorcycleId), eq(motorcycles.businessId, input.businessId))).for("update").limit(1);
    if (!motorcycle) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
    assertMotorcycleCanBeReserved(motorcycle.status);
    const [reservation] = await transaction.insert(motorcycleReservations).values({ businessId: input.businessId, motorcycleId: input.motorcycleId, customerName: input.reservation.customerName, phone: input.reservation.phone, expiresAt: input.reservation.expiresAt, notes: input.reservation.notes }).returning();
    await transaction.update(motorcycles).set({ status: "RESERVED", updatedAt: new Date() }).where(eq(motorcycles.id, input.motorcycleId));
    return reservation!;
  });
}

export async function cancelMotorcycleReservation(input: { businessId: string; motorcycleId: string }) {
  return db.transaction(async (transaction) => {
    const [motorcycle] = await transaction.select().from(motorcycles).where(and(eq(motorcycles.id, input.motorcycleId), eq(motorcycles.businessId, input.businessId))).for("update").limit(1);
    if (!motorcycle) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
    if (motorcycle.status !== "RESERVED") throw new DomainError("Motorcycle does not have an active reservation.", "INVALID_STATE");
    const [reservation] = await transaction.select().from(motorcycleReservations).where(and(eq(motorcycleReservations.businessId, input.businessId), eq(motorcycleReservations.motorcycleId, input.motorcycleId), eq(motorcycleReservations.status, "ACTIVE"))).orderBy(desc(motorcycleReservations.reservedAt)).limit(1);
    if (!reservation) throw new DomainError("Active reservation not found.", "NOT_FOUND");
    await transaction.update(motorcycleReservations).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(motorcycleReservations.id, reservation.id));
    await transaction.update(motorcycles).set({ status: "AVAILABLE", updatedAt: new Date() }).where(eq(motorcycles.id, input.motorcycleId));
    return reservation;
  });
}

export async function completeMotorcycleSale(input: { businessId: string; motorcycleId: string; createdByUserId: string; sale: SaleInput }) {
  return db.transaction(async (transaction) => {
    const [motorcycle] = await transaction.select().from(motorcycles).where(and(eq(motorcycles.id, input.motorcycleId), eq(motorcycles.businessId, input.businessId))).for("update").limit(1);
    if (!motorcycle) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
    const [existingSale] = await transaction.select().from(motorcycleSales).where(and(eq(motorcycleSales.businessId, input.businessId), eq(motorcycleSales.motorcycleId, input.motorcycleId))).limit(1);
    if (existingSale) return existingSale;
    assertMotorcycleCanBeSold(motorcycle.status);
    if (!motorcycle.price) throw new DomainError("Listed price is required before completing a sale.", "INVALID_STATE");

    let customerId = input.sale.existingCustomerId;
    if (customerId) {
      const [customer] = await transaction.select({ id: customers.id }).from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, input.businessId))).limit(1);
      if (!customer) throw new DomainError("Customer not found.", "NOT_FOUND");
    } else if (input.sale.newCustomer) {
      const [customer] = await transaction.insert(customers).values({ businessId: input.businessId, ...input.sale.newCustomer }).returning({ id: customers.id });
      customerId = customer!.id;
    }

    const soldAt = new Date();
    const [sale] = await transaction.insert(motorcycleSales).values({ businessId: input.businessId, motorcycleId: input.motorcycleId, customerId, listedPrice: motorcycle.price, sellingPrice: input.sale.sellingPrice.toFixed(2), currency: motorcycle.currency, paymentMethod: input.sale.paymentMethod, soldAt, warrantyExpiresAt: warrantyExpiry(soldAt, input.sale.warrantyMonths ?? 0), warrantyTerms: input.sale.warrantyTerms, notes: input.sale.notes, createdByUserId: input.createdByUserId }).returning();
    await transaction.update(motorcycles).set({ status: "SOLD", updatedAt: new Date() }).where(eq(motorcycles.id, input.motorcycleId));
    await transaction.update(motorcycleReservations).set({ status: "COMPLETED", customerId: customerId ?? null, updatedAt: new Date() }).where(and(eq(motorcycleReservations.businessId, input.businessId), eq(motorcycleReservations.motorcycleId, input.motorcycleId), eq(motorcycleReservations.status, "ACTIVE")));
    return sale!;
  });
}

export async function getMotorcycleCommerce(motorcycleId: string, businessId: string) {
  const [reservation] = await db.select().from(motorcycleReservations).where(and(eq(motorcycleReservations.businessId, businessId), eq(motorcycleReservations.motorcycleId, motorcycleId), eq(motorcycleReservations.status, "ACTIVE"))).orderBy(desc(motorcycleReservations.reservedAt)).limit(1);
  const [sale] = await db.select({ sale: motorcycleSales, customer: customers }).from(motorcycleSales).leftJoin(customers, eq(motorcycleSales.customerId, customers.id)).where(and(eq(motorcycleSales.businessId, businessId), eq(motorcycleSales.motorcycleId, motorcycleId))).limit(1);
  return { reservation: reservation ?? null, sale: sale ?? null };
}

export async function listCustomers(businessId: string, search?: string) {
  const searchCondition = search ? or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`)) : undefined;
  return db.select({ customer: customers, purchaseCount: count(motorcycleSales.id), mostRecentPurchase: max(motorcycleSales.soldAt) }).from(customers).leftJoin(motorcycleSales, eq(customers.id, motorcycleSales.customerId)).where(searchCondition ? and(eq(customers.businessId, businessId), searchCondition) : eq(customers.businessId, businessId)).groupBy(customers.id).orderBy(desc(max(motorcycleSales.soldAt)), customers.name);
}

export async function listCustomerOptions(businessId: string) {
  return db.select().from(customers).where(eq(customers.businessId, businessId)).orderBy(customers.name);
}

export async function getCustomerDetail(customerId: string, businessId: string) {
  const [customer] = await db.select().from(customers).where(and(eq(customers.id, customerId), eq(customers.businessId, businessId))).limit(1);
  if (!customer) throw new DomainError("Customer not found.", "NOT_FOUND");
  const purchases = await db.select({ sale: motorcycleSales, motorcycle: motorcycles, coverUrl: motorcycleImages.url }).from(motorcycleSales).innerJoin(motorcycles, eq(motorcycleSales.motorcycleId, motorcycles.id)).leftJoin(motorcycleImages, and(eq(motorcycleImages.motorcycleId, motorcycles.id), eq(motorcycleImages.sortOrder, 0))).where(and(eq(motorcycleSales.businessId, businessId), eq(motorcycleSales.customerId, customerId))).orderBy(desc(motorcycleSales.soldAt));
  const reservations = await db.select({ reservation: motorcycleReservations, motorcycle: motorcycles }).from(motorcycleReservations).innerJoin(motorcycles, eq(motorcycleReservations.motorcycleId, motorcycles.id)).where(and(eq(motorcycleReservations.businessId, businessId), eq(motorcycleReservations.customerId, customerId))).orderBy(desc(motorcycleReservations.reservedAt));
  return { customer, purchases, reservations };
}

export async function listSales(businessId: string) {
  return db.select({ sale: motorcycleSales, motorcycle: motorcycles, customer: customers, coverUrl: motorcycleImages.url }).from(motorcycleSales).innerJoin(motorcycles, eq(motorcycleSales.motorcycleId, motorcycles.id)).leftJoin(customers, eq(motorcycleSales.customerId, customers.id)).leftJoin(motorcycleImages, and(eq(motorcycleImages.motorcycleId, motorcycles.id), eq(motorcycleImages.sortOrder, 0))).where(eq(motorcycleSales.businessId, businessId)).orderBy(desc(motorcycleSales.soldAt));
}

async function getReceiptDetail(condition: SQL<unknown>) {
  const [receipt] = await db.select({ sale: motorcycleSales, motorcycle: motorcycles, customer: customers, business: businesses, coverUrl: motorcycleImages.url })
    .from(motorcycleSales)
    .innerJoin(motorcycles, eq(motorcycleSales.motorcycleId, motorcycles.id))
    .innerJoin(businesses, eq(motorcycleSales.businessId, businesses.id))
    .leftJoin(customers, eq(motorcycleSales.customerId, customers.id))
    .leftJoin(motorcycleImages, and(eq(motorcycleImages.motorcycleId, motorcycles.id), eq(motorcycleImages.sortOrder, 0)))
    .where(condition)
    .limit(1);
  if (!receipt) throw new DomainError("Receipt not found.", "NOT_FOUND");
  const serviceRecords = await db.select().from(motorcycleServiceRecords).where(eq(motorcycleServiceRecords.saleId, receipt.sale.id)).orderBy(desc(motorcycleServiceRecords.servicedAt));
  return { ...receipt, serviceRecords };
}

export function getSaleReceiptById(saleId: string, businessId: string) {
  return getReceiptDetail(and(eq(motorcycleSales.id, saleId), eq(motorcycleSales.businessId, businessId))!);
}

export function getPublicSaleReceipt(receiptAccessToken: string) {
  return getReceiptDetail(eq(motorcycleSales.receiptAccessToken, receiptAccessToken));
}

export async function addMotorcycleServiceRecord(input: { businessId: string; saleId: string; createdByUserId: string; record: ServiceRecordInput }) {
  return db.transaction(async (transaction) => {
    const [sale] = await transaction.select().from(motorcycleSales).where(and(eq(motorcycleSales.id, input.saleId), eq(motorcycleSales.businessId, input.businessId))).limit(1);
    if (!sale) throw new DomainError("Receipt not found.", "NOT_FOUND");
    const [record] = await transaction.insert(motorcycleServiceRecords).values({
      businessId: input.businessId,
      motorcycleId: sale.motorcycleId,
      saleId: sale.id,
      createdByUserId: input.createdByUserId,
      type: input.record.type,
      title: input.record.title,
      description: input.record.description,
      odometer: input.record.odometer,
      cost: input.record.cost?.toFixed(2),
      currency: input.record.currency,
      servicedAt: input.record.servicedAt,
      nextServiceAt: input.record.nextServiceAt,
    }).returning();
    if (!record) throw new Error("Service record creation did not return a row.");
    return { record, receiptAccessToken: sale.receiptAccessToken };
  });
}

export async function getMonthlySalesSummary(businessId: string, now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const totals = await db.select({ currency: motorcycleSales.currency, soldCount: count(motorcycleSales.id), salesValue: sum(motorcycleSales.sellingPrice) }).from(motorcycleSales).where(and(eq(motorcycleSales.businessId, businessId), gte(motorcycleSales.soldAt, monthStart))).groupBy(motorcycleSales.currency);
  const recentSales = await db.select({ sale: motorcycleSales, motorcycle: motorcycles, customer: customers }).from(motorcycleSales).innerJoin(motorcycles, eq(motorcycleSales.motorcycleId, motorcycles.id)).leftJoin(customers, eq(motorcycleSales.customerId, customers.id)).where(eq(motorcycleSales.businessId, businessId)).orderBy(desc(motorcycleSales.soldAt)).limit(5);
  return { soldCount: totals.reduce((total, row) => total + row.soldCount, 0), totals, recentSales };
}

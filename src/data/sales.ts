import "server-only";

import { and, count, desc, eq, gte, ilike, max, or, sum } from "drizzle-orm";

import { db } from "@/db";
import { customers, motorcycleImages, motorcycleReservations, motorcycles, motorcycleSales } from "@/db/schema";
import { DomainError } from "@/domain/errors";
import { assertMotorcycleCanBeReserved, assertMotorcycleCanBeSold, type ReservationInput, type SaleInput } from "@/domain/sales";

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

    const [sale] = await transaction.insert(motorcycleSales).values({ businessId: input.businessId, motorcycleId: input.motorcycleId, customerId, listedPrice: motorcycle.price, sellingPrice: input.sale.sellingPrice.toFixed(2), currency: motorcycle.currency, paymentMethod: input.sale.paymentMethod, notes: input.sale.notes, createdByUserId: input.createdByUserId }).returning();
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

export async function getMonthlySalesSummary(businessId: string, now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const totals = await db.select({ currency: motorcycleSales.currency, soldCount: count(motorcycleSales.id), salesValue: sum(motorcycleSales.sellingPrice) }).from(motorcycleSales).where(and(eq(motorcycleSales.businessId, businessId), gte(motorcycleSales.soldAt, monthStart))).groupBy(motorcycleSales.currency);
  const recentSales = await db.select({ sale: motorcycleSales, motorcycle: motorcycles, customer: customers }).from(motorcycleSales).innerJoin(motorcycles, eq(motorcycleSales.motorcycleId, motorcycles.id)).leftJoin(customers, eq(motorcycleSales.customerId, customers.id)).where(eq(motorcycleSales.businessId, businessId)).orderBy(desc(motorcycleSales.soldAt)).limit(5);
  return { soldCount: totals.reduce((total, row) => total + row.soldCount, 0), totals, recentSales };
}

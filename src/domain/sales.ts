import { z } from "zod";

import { normalizeCambodianPhone, parseCustomerInput } from "@/domain/customer";
import { DomainError } from "@/domain/errors";

export const paymentMethods = ["CASH", "KHQR", "BANK_TRANSFER", "OTHER"] as const;

const optionalText = z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().max(2_000).optional());

const reservationSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required.").max(200),
  phone: z.string().transform(normalizeCambodianPhone),
  expiresAt: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.date().optional()),
  notes: optionalText,
});

const saleSchema = z.object({
  existingCustomerId: z.preprocess((value) => value === "" || value === null ? undefined : value, z.uuid().optional()),
  name: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  telegramUsername: optionalText,
  sellingPrice: z.coerce.number().positive("Selling price must be greater than zero.").max(100_000_000),
  paymentMethod: z.enum(paymentMethods),
  notes: optionalText,
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type SaleInput = z.infer<typeof saleSchema> & { newCustomer?: ReturnType<typeof parseCustomerInput> };

export function parseReservationInput(value: unknown): ReservationInput {
  const result = reservationSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid reservation details.", "INVALID_INPUT");
  return result.data;
}

export function parseSaleInput(value: unknown): SaleInput {
  const result = saleSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid sale details.", "INVALID_INPUT");
  if (result.data.existingCustomerId) return result.data;
  return { ...result.data, newCustomer: parseCustomerInput(result.data) };
}

export function assertMotorcycleCanBeReserved(status: string) {
  if (status !== "AVAILABLE") throw new DomainError("Only available motorcycles can be reserved.", "INVALID_STATE");
}

export function assertMotorcycleCanBeSold(status: string) {
  if (status === "SOLD") throw new DomainError("Motorcycle is already sold.", "INVALID_STATE");
  if (status !== "AVAILABLE" && status !== "RESERVED") throw new DomainError("Only available or reserved motorcycles can be sold.", "INVALID_STATE");
}

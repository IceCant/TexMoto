import { z } from "zod";

import { DomainError } from "@/domain/errors";

export const serviceRecordTypes = ["MAINTENANCE", "REPAIR", "WARRANTY", "INSPECTION"] as const;

const optionalText = z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().max(2_000).optional());
const optionalDate = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.date().optional());
const optionalNumber = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().nonnegative().optional());

const serviceRecordSchema = z.object({
  type: z.enum(serviceRecordTypes),
  title: z.string().trim().min(2, "Service title is required.").max(200),
  description: optionalText,
  odometer: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().int().nonnegative().max(10_000_000).optional()),
  cost: optionalNumber,
  currency: z.enum(["USD", "KHR"]),
  servicedAt: z.coerce.date(),
  nextServiceAt: optionalDate,
});

export type ServiceRecordInput = z.infer<typeof serviceRecordSchema>;

export function parseServiceRecordInput(value: unknown): ServiceRecordInput {
  const result = serviceRecordSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid service record.", "INVALID_INPUT");
  if (result.data.nextServiceAt && result.data.nextServiceAt < result.data.servicedAt) {
    throw new DomainError("Next service date cannot be before the service date.", "INVALID_INPUT");
  }
  return result.data;
}

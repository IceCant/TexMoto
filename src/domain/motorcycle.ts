import { z } from "zod";

import { DomainError } from "@/domain/errors";

export const conditions = ["NEW", "USED"] as const;
export const statuses = ["DRAFT", "AVAILABLE", "RESERVED", "SOLD", "HIDDEN"] as const;
export const currencies = ["USD", "KHR"] as const;

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().max(500).optional());
const optionalInteger = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().nonnegative().optional(),
);

export const motorcycleDraftSchema = z.object({
  brand: optionalText,
  model: optionalText,
  variant: optionalText,
  year: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1900).max(2100).optional()),
  condition: z.preprocess(emptyToUndefined, z.enum(conditions).optional()),
  color: optionalText,
  engineCc: optionalInteger,
  transmission: optionalText,
  mileage: optionalInteger,
  price: z.preprocess(emptyToUndefined, z.coerce.number().positive().max(100_000_000).optional()),
  currency: z.enum(currencies).default("USD"),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5_000).optional()),
  plateNumber: optionalText,
  frameNumber: optionalText,
  engineNumber: optionalText,
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(5_000).optional()),
});

export type MotorcycleDraftInput = z.infer<typeof motorcycleDraftSchema>;

export function parseMotorcycleDraft(input: unknown): MotorcycleDraftInput {
  const result = motorcycleDraftSchema.safeParse(input);
  if (!result.success) {
    throw new DomainError(result.error.issues[0]?.message ?? "Invalid motorcycle details.", "INVALID_INPUT");
  }
  return result.data;
}

export function assertMotorcycleCanBePublished(
  motorcycle: MotorcycleDraftInput,
  imageCount: number,
): asserts motorcycle is MotorcycleDraftInput & {
  brand: string;
  model: string;
  year: number;
  condition: (typeof conditions)[number];
  price: number;
} {
  if (imageCount < 1) throw new DomainError("Add at least one photo before publishing.", "INVALID_STATE");
  if (!motorcycle.brand) throw new DomainError("Brand is required to publish.", "INVALID_STATE");
  if (!motorcycle.model) throw new DomainError("Model is required to publish.", "INVALID_STATE");
  if (!motorcycle.year) throw new DomainError("A valid year is required to publish.", "INVALID_STATE");
  if (!motorcycle.condition) throw new DomainError("Condition is required to publish.", "INVALID_STATE");
  if (!motorcycle.price || motorcycle.price <= 0) {
    throw new DomainError("Price must be greater than zero to publish.", "INVALID_STATE");
  }
}

export function nextPublicationState(
  motorcycle: MotorcycleDraftInput,
  imageCount: number,
  now = new Date(),
) {
  assertMotorcycleCanBePublished(motorcycle, imageCount);
  return { status: "AVAILABLE" as const, publishedAt: now };
}

export function isPubliclyAvailable(status: (typeof statuses)[number]) {
  return status === "AVAILABLE";
}

export function normalizeImageOrder<T extends { sortOrder: number }>(images: T[]) {
  return [...images]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image, sortOrder) => ({ ...image, sortOrder }));
}


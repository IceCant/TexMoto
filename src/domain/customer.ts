import { z } from "zod";

import { DomainError } from "@/domain/errors";

function optionalText(max: number) {
  return z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().max(max).optional());
}

export function normalizeCambodianPhone(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!compact) throw new DomainError("Phone is required.", "INVALID_INPUT");
  if (!/^(?:\+?855|0)\d{8,9}$/.test(compact)) throw new DomainError("Enter a valid Cambodian phone number.", "INVALID_INPUT");
  return compact.startsWith("+855") ? `0${compact.slice(4)}` : compact.startsWith("855") ? `0${compact.slice(3)}` : compact;
}

const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required.").max(200),
  phone: z.string().transform(normalizeCambodianPhone),
  telegramUsername: optionalText(200),
  address: optionalText(500),
  notes: optionalText(2_000),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export function parseCustomerInput(value: unknown): CustomerInput {
  const result = customerSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid customer details.", "INVALID_INPUT");
  return result.data;
}

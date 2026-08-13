import { z } from "zod";

import { DomainError } from "@/domain/errors";

export function parseReceiptIdentifier(value: unknown) {
  const result = z.uuid().safeParse(value);
  if (!result.success) throw new DomainError("Receipt not found.", "NOT_FOUND");
  return result.data;
}

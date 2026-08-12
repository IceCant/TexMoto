import { DomainError } from "@/domain/errors";

export function assertMotorcycleBelongsToBusiness(
  motorcycle: { businessId: string } | undefined,
  businessId: string,
) {
  if (!motorcycle) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
  if (motorcycle.businessId !== businessId) {
    throw new DomainError("You cannot access another shop's motorcycle.", "FORBIDDEN");
  }
}


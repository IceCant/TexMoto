import { describe, expect, it } from "vitest";

import { normalizeCambodianPhone } from "@/domain/customer";
import { assertMotorcycleCanBeReserved, assertMotorcycleCanBeSold, parseSaleInput, warrantyExpiry } from "@/domain/sales";

describe("reservation and sale rules", () => {
  it("normalizes common Cambodian phone formatting", () => expect(normalizeCambodianPhone("+855 12 345 678")).toBe("012345678"));
  it("only reserves available inventory", () => expect(() => assertMotorcycleCanBeReserved("RESERVED")).toThrow("Only available"));
  it("prevents selling a sold motorcycle", () => expect(() => assertMotorcycleCanBeSold("SOLD")).toThrow("already sold"));
  it("parses money without floating point arithmetic in persistence", () => expect(parseSaleInput({ name: "Sokha", phone: "012345678", sellingPrice: "2280.00", paymentMethod: "KHQR" }).sellingPrice).toBe(2280));
  it("calculates a warranty end date from the sale date", () => expect(warrantyExpiry(new Date("2026-08-12T00:00:00Z"), 12)?.toISOString()).toBe("2027-08-12T00:00:00.000Z"));
});

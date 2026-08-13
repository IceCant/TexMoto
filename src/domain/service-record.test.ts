import { describe, expect, it } from "vitest";

import { parseServiceRecordInput } from "@/domain/service-record";

describe("service record boundaries", () => {
  it("parses a maintenance record", () => {
    const record = parseServiceRecordInput({ type: "MAINTENANCE", title: "Oil change", odometer: "12000", cost: "15", currency: "USD", servicedAt: "2026-08-12" });
    expect(record.odometer).toBe(12_000);
    expect(record.cost).toBe(15);
  });

  it("rejects a next service date before the completed service", () => {
    expect(() => parseServiceRecordInput({ type: "MAINTENANCE", title: "Oil change", currency: "USD", servicedAt: "2026-08-12", nextServiceAt: "2026-08-01" })).toThrow("cannot be before");
  });
});

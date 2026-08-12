import { describe, expect, it } from "vitest";

import { DomainError } from "@/domain/errors";
import { assertMotorcycleBelongsToBusiness } from "@/domain/ownership";

describe("business ownership isolation", () => {
  it("accepts a motorcycle owned by the session business", () => {
    expect(() => assertMotorcycleBelongsToBusiness({ businessId: "shop-a" }, "shop-a")).not.toThrow();
  });

  it("rejects another business motorcycle", () => {
    expect(() => assertMotorcycleBelongsToBusiness({ businessId: "shop-b" }, "shop-a")).toThrow(DomainError);
  });
});


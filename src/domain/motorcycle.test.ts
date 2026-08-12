import { describe, expect, it } from "vitest";

import { DomainError } from "@/domain/errors";
import {
  assertMotorcycleCanBePublished,
  isPubliclyAvailable,
  nextPublicationState,
  normalizeImageOrder,
  parseMotorcycleDraft,
} from "@/domain/motorcycle";
import { slugify } from "@/domain/slug";

const validMotorcycle = parseMotorcycleDraft({
  brand: "Honda",
  model: "Dream 125",
  year: "2024",
  condition: "USED",
  price: "2350",
  currency: "USD",
});

describe("motorcycle publishing", () => {
  it("allows incomplete drafts", () => {
    expect(parseMotorcycleDraft({ currency: "USD" })).toEqual({ currency: "USD" });
  });

  it("fails loudly when an incomplete motorcycle is published", () => {
    expect(() => assertMotorcycleCanBePublished(parseMotorcycleDraft({ currency: "USD" }), 0)).toThrow(
      DomainError,
    );
  });

  it("publishes a complete motorcycle", () => {
    expect(nextPublicationState(validMotorcycle, 2, new Date("2026-01-01"))).toEqual({
      status: "AVAILABLE",
      publishedAt: new Date("2026-01-01"),
    });
  });
});

describe("public availability", () => {
  it.each(["DRAFT", "HIDDEN", "RESERVED", "SOLD"] as const)("does not expose %s motorcycles", (status) => {
    expect(isPubliclyAvailable(status)).toBe(false);
  });

  it("exposes available motorcycles", () => {
    expect(isPubliclyAvailable("AVAILABLE")).toBe(true);
  });
});

describe("stable lookup helpers", () => {
  it("normalizes slugs", () => expect(slugify("  Honda Dream 125! ")).toBe("honda-dream-125"));

  it("normalizes image ordering without mutating input", () => {
    const images = [{ id: "b", sortOrder: 9 }, { id: "a", sortOrder: 2 }];
    expect(normalizeImageOrder(images)).toEqual([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    expect(images[0].sortOrder).toBe(9);
  });
});


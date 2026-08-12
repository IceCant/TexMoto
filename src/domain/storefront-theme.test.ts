import { describe, expect, it } from "vitest";

import { parseStorefrontTheme, storefrontThemeAttribute } from "@/domain/storefront-theme";

describe("storefront theme", () => {
  it.each(["MARKETPLACE", "EDITORIAL", "LOCAL"] as const)("parses %s", (theme) => {
    expect(parseStorefrontTheme(theme)).toBe(theme);
  });

  it("rejects unsupported values at the boundary", () => {
    expect(() => parseStorefrontTheme("NEON")).toThrow("not supported");
  });

  it("maps stored values to CSS attributes", () => {
    expect(storefrontThemeAttribute("EDITORIAL")).toBe("editorial");
  });
});

import { describe, expect, it } from "vitest";

import { buildTelegramMotorcycleCaption } from "@/domain/telegram";

const motorcycle = { brand: "Honda", model: "Dream 125", year: 2024, condition: "USED" as const, color: null, mileage: null, engineCc: 125, description: null, price: "2350.00", currency: "USD" as const, slug: "honda-dream" };
const business = { name: "Sokha Moto", phone: "012345678", slug: "sokha-moto" };

describe("Telegram caption", () => {
  it("uses the stable public URL", () => {
    expect(buildTelegramMotorcycleCaption({ motorcycle, business, publicOrigin: "https://texmoto.test", mode: "EN" })).toContain("https://texmoto.test/sokha-moto/moto/honda-dream");
  });

  it("omits missing optional values", () => {
    const caption = buildTelegramMotorcycleCaption({ motorcycle, business, publicOrigin: "https://texmoto.test", mode: "EN" });
    expect(caption).not.toContain("null");
    expect(caption).not.toContain("undefined");
    expect(caption).not.toContain("🎨");
    expect(caption).not.toContain("🛣");
  });
});

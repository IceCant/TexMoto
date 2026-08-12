import { describe, expect, it } from "vitest";

import { parseCaptionTemplate, renderCaptionTemplate } from "@/domain/social-caption";

const motorcycle = { brand: "Honda", model: "Dream 125", year: 2024, condition: "USED" as const, color: null, mileage: 12_000, engineCc: 125, description: null, price: "2350.00", currency: "USD" as const, slug: "honda-dream" };
const business = { name: "Sokha Moto", phone: "012345678", slug: "sokha-moto" };

describe("Social caption templates", () => {
  it("renders trusted motorcycle, shop, and listing values", () => {
    const caption = renderCaptionTemplate({ template: "🏍 {name} · {year}\n💰 {price}\n📍 {shopName}\n{listingUrl}", motorcycle, business, publicOrigin: "https://texmoto.test" });
    expect(caption).toContain("Honda Dream 125 · 2024");
    expect(caption).toContain("$2,350.00");
    expect(caption).toContain("Sokha Moto");
    expect(caption).toContain("https://texmoto.test/sokha-moto/moto/honda-dream");
  });

  it("removes a line when its optional value is missing", () => {
    const caption = renderCaptionTemplate({ template: "{name}\n🎨 {color}\n📝 {description}\n{phone}", motorcycle, business, publicOrigin: "https://texmoto.test" });
    expect(caption).toBe("Honda Dream 125\n\n012345678");
  });

  it("rejects unknown placeholders at the settings boundary", () => {
    expect(() => parseCaptionTemplate("Price: {prcie}")).toThrow("Unknown caption placeholder {prcie}");
  });

  it("uses an empty value to restore the default caption", () => {
    expect(parseCaptionTemplate("   ")).toBeUndefined();
  });
});

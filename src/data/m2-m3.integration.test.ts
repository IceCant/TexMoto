import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";

import { db, sql } from "@/db/connection";
import { businesses, customers, motorcycleImages, motorcycleReservations, motorcycles, motorcycleSales, publications, users } from "@/db/schema";
import { getFacebookIntegrationSummary, publishMotorcycleToFacebook, saveFacebookIntegration } from "@/data/facebook";
import { addMotorcycleServiceRecord, completeMotorcycleSale, getPublicSaleReceipt, getSaleReceiptById, reserveMotorcycle } from "@/data/sales";
import { publishMotorcycleToEnabledChannels } from "@/data/social-publishing";
import { getTelegramIntegrationSummary, publishMotorcycleToTelegram, saveTelegramIntegration } from "@/data/telegram";
import { setFacebookPublisherForTests } from "@/integrations/facebook";
import { FacebookProviderError, type FacebookPublisher } from "@/integrations/facebook/types";
import { setTelegramPublisherForTests } from "@/integrations/telegram";
import { TelegramProviderError, type TelegramPublisher } from "@/integrations/telegram/types";

const suffix = crypto.randomUUID().slice(0, 8);
let shopA = "";
let shopB = "";
let ownerA = "";
let availableMoto = "";
let draftMoto = "";
let publicationCalls = 0;
let facebookPublicationCalls = 0;

const successProvider: TelegramPublisher = {
  async testConnection() {},
  async publishMotorcycle() { publicationCalls += 1; return { externalPostId: "101", externalUrl: "https://t.me/demo/101" }; },
};

const successFacebookProvider: FacebookPublisher = {
  async testConnection() { return { pageName: "Demo Page" }; },
  async publishMotorcycle() { facebookPublicationCalls += 1; return { externalPostId: "page_202", externalUrl: "https://facebook.test/post/202" }; },
};

beforeAll(async () => {
  process.env.INTEGRATION_ENCRYPTION_KEY = "integration-test-key-with-at-least-32-characters";
  const [a, b] = await db.insert(businesses).values([{ name: "Test A", slug: `test-a-${suffix}` }, { name: "Test B", slug: `test-b-${suffix}` }]).returning();
  shopA = a!.id; shopB = b!.id;
  const [owner] = await db.insert(users).values({ businessId: shopA, name: "Owner", email: `owner-${suffix}@test.local`, passwordHash: await hash("test-password", 4), role: "OWNER" }).returning();
  ownerA = owner!.id;
  const [available, draft] = await db.insert(motorcycles).values([
    { businessId: shopA, slug: `available-${suffix}`, brand: "Honda", model: "Dream", year: 2024, condition: "USED", price: "2350.00", status: "AVAILABLE", publishedAt: new Date() },
    { businessId: shopA, slug: `draft-${suffix}`, status: "DRAFT" },
  ]).returning();
  availableMoto = available!.id; draftMoto = draft!.id;
  await db.insert(motorcycleImages).values({ motorcycleId: availableMoto, url: "/motorcycles/honda-dream-125-studio.jpg", sortOrder: 0 });
  await saveTelegramIntegration({ businessId: shopA, botToken: "123456789:abcdefghijklmnopqrstuvwxyz", channelId: "@demo", channelUsername: "demo", isEnabled: true });
  await saveFacebookIntegration({ businessId: shopA, pageAccessToken: "facebook-test-page-access-token", pageId: "123456789", pageName: "Demo Page", isEnabled: true });
});

afterAll(async () => {
  setTelegramPublisherForTests(undefined);
  setFacebookPublisherForTests(undefined);
  await db.delete(businesses).where(eq(businesses.id, shopA));
  await db.delete(businesses).where(eq(businesses.id, shopB));
  await sql.end();
});

describe.sequential("M2 database behavior", () => {
  it("keeps settings tenant-scoped and never returns the token", async () => {
    expect(await getTelegramIntegrationSummary(shopB)).toBeNull();
    const summary = await getTelegramIntegrationSummary(shopA);
    expect(summary).not.toHaveProperty("botTokenEncrypted");
    expect(summary).not.toHaveProperty("botToken");
    expect(await getFacebookIntegrationSummary(shopB)).toBeNull();
    const facebookSummary = await getFacebookIntegrationSummary(shopA);
    expect(facebookSummary).not.toHaveProperty("pageAccessTokenEncrypted");
    expect(facebookSummary).not.toHaveProperty("pageAccessToken");
  });

  it("rejects another business motorcycle", async () => {
    setTelegramPublisherForTests(successProvider);
    await expect(publishMotorcycleToTelegram({ motorcycleId: availableMoto, businessId: shopB, publicOrigin: "https://texmoto.test" })).rejects.toThrow("not found");
  });

  it("rejects non-available inventory", async () => {
    await expect(publishMotorcycleToTelegram({ motorcycleId: draftMoto, businessId: shopA, publicOrigin: "https://texmoto.test" })).rejects.toThrow("Only available");
  });

  it("rejects missing Telegram configuration", async () => {
    const [otherMoto] = await db.insert(motorcycles).values({ businessId: shopB, slug: `other-${suffix}`, brand: "Honda", model: "Wave", year: 2024, condition: "NEW", price: "2000", status: "AVAILABLE" }).returning();
    await expect(publishMotorcycleToTelegram({ motorcycleId: otherMoto!.id, businessId: shopB, publicOrigin: "https://texmoto.test" })).rejects.toThrow("not configured");
  });

  it("creates one published record and duplicate requests do not repost", async () => {
    setTelegramPublisherForTests(successProvider);
    const first = await publishMotorcycleToTelegram({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    const second = await publishMotorcycleToTelegram({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    expect(first.status).toBe("PUBLISHED");
    expect(second.id).toBe(first.id);
    expect(publicationCalls).toBe(1);
  });

  it("persists failure and retry updates the same record", async () => {
    await db.delete(publications).where(eq(publications.motorcycleId, availableMoto));
    setTelegramPublisherForTests({ async testConnection() {}, async publishMotorcycle() { throw new TelegramProviderError("Bot cannot post to this channel.", "CHANNEL_ACCESS"); } });
    await expect(publishMotorcycleToTelegram({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" })).rejects.toThrow("Bot cannot post");
    const [failed] = await db.select().from(publications).where(eq(publications.motorcycleId, availableMoto));
    expect(failed?.status).toBe("FAILED");
    setTelegramPublisherForTests(successProvider);
    const retried = await publishMotorcycleToTelegram({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    expect(retried.id).toBe(failed!.id);
    expect(retried.status).toBe("PUBLISHED");
  });

  it("publishes to Facebook once and duplicate requests do not repost", async () => {
    setFacebookPublisherForTests(successFacebookProvider);
    const first = await publishMotorcycleToFacebook({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    const second = await publishMotorcycleToFacebook({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    expect(first.status).toBe("PUBLISHED");
    expect(second.id).toBe(first.id);
    expect(facebookPublicationCalls).toBe(1);
  });

  it("persists a Facebook failure and retries the same record", async () => {
    await db.delete(publications).where(and(eq(publications.motorcycleId, availableMoto), eq(publications.channel, "FACEBOOK")));
    setFacebookPublisherForTests({ async testConnection() { return {}; }, async publishMotorcycle() { throw new FacebookProviderError("Facebook Page authentication failed.", "AUTH"); } });
    await expect(publishMotorcycleToFacebook({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" })).rejects.toThrow("authentication failed");
    const [failed] = await db.select().from(publications).where(and(eq(publications.motorcycleId, availableMoto), eq(publications.channel, "FACEBOOK")));
    expect(failed?.status).toBe("FAILED");
    setFacebookPublisherForTests(successFacebookProvider);
    const retried = await publishMotorcycleToFacebook({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    expect(retried.id).toBe(failed!.id);
    expect(retried.status).toBe("PUBLISHED");
  });

  it("fans out enabled channels and isolates provider failures", async () => {
    await db.delete(publications).where(eq(publications.motorcycleId, availableMoto));
    setTelegramPublisherForTests(successProvider);
    setFacebookPublisherForTests({ async testConnection() { return {}; }, async publishMotorcycle() { throw new FacebookProviderError("Facebook is unavailable.", "NETWORK"); } });
    const results = await publishMotorcycleToEnabledChannels({ motorcycleId: availableMoto, businessId: shopA, publicOrigin: "https://texmoto.test" });
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
    const rows = await db.select().from(publications).where(eq(publications.motorcycleId, availableMoto));
    expect(rows.find((row) => row.channel === "TELEGRAM")?.status).toBe("PUBLISHED");
    expect(rows.find((row) => row.channel === "FACEBOOK")?.status).toBe("FAILED");
  });
});

describe.sequential("M3 database behavior", () => {
  it("reserves, sells transactionally, and double-submit returns one sale", async () => {
    await reserveMotorcycle({ businessId: shopA, motorcycleId: availableMoto, reservation: { customerName: "Sokha", phone: "012345678" } });
    const first = await completeMotorcycleSale({ businessId: shopA, motorcycleId: availableMoto, createdByUserId: ownerA, sale: { name: "Sokha", phone: "012345678", sellingPrice: 2280, paymentMethod: "KHQR", newCustomer: { name: "Sokha", phone: "012345678" } } });
    const [motorcycle] = await db.select().from(motorcycles).where(eq(motorcycles.id, availableMoto));
    const [reservation] = await db.select().from(motorcycleReservations).where(eq(motorcycleReservations.motorcycleId, availableMoto));
    expect(motorcycle?.status).toBe("SOLD");
    expect(reservation?.status).toBe("COMPLETED");
    const duplicate = await completeMotorcycleSale({ businessId: shopA, motorcycleId: availableMoto, createdByUserId: ownerA, sale: { existingCustomerId: first.customerId!, name: "", phone: "", sellingPrice: 2280, paymentMethod: "KHQR" } });
    expect(duplicate.id).toBe(first.id);
    expect((await db.select().from(motorcycleSales).where(eq(motorcycleSales.motorcycleId, availableMoto))).length).toBe(1);
    expect((await db.select().from(customers).where(and(eq(customers.businessId, shopA), eq(customers.id, first.customerId!)))).length).toBe(1);
  });

  it("keeps receipt management tenant-scoped while the private token opens customer history", async () => {
    const [sale] = await db.select().from(motorcycleSales).where(eq(motorcycleSales.motorcycleId, availableMoto));
    expect(sale).toBeDefined();
    await expect(getSaleReceiptById(sale!.id, shopB)).rejects.toThrow("Receipt not found");
    const publicReceipt = await getPublicSaleReceipt(sale!.receiptAccessToken);
    expect(publicReceipt.motorcycle.id).toBe(availableMoto);
    await addMotorcycleServiceRecord({ businessId: shopA, saleId: sale!.id, createdByUserId: ownerA, record: { type: "MAINTENANCE", title: "Oil change", currency: "USD", servicedAt: new Date("2026-08-12") } });
    expect((await getPublicSaleReceipt(sale!.receiptAccessToken)).serviceRecords).toHaveLength(1);
  });
});

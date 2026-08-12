import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, publications, telegramIntegrations } from "@/db/schema";
import { getAdminMotorcycleById } from "@/data/motorcycles";
import { DomainError } from "@/domain/errors";
import { assertTelegramPublishable, buildTelegramMotorcycleCaption } from "@/domain/telegram";
import { getTelegramPublisher } from "@/integrations/telegram";
import { TelegramProviderError } from "@/integrations/telegram/types";
import { decryptSecret, encryptSecret } from "@/security/secrets";

export async function getTelegramIntegrationSummary(businessId: string) {
  const [integration] = await db.select({ id: telegramIntegrations.id, channelId: telegramIntegrations.channelId, channelUsername: telegramIntegrations.channelUsername, isEnabled: telegramIntegrations.isEnabled, updatedAt: telegramIntegrations.updatedAt }).from(telegramIntegrations).where(eq(telegramIntegrations.businessId, businessId)).limit(1);
  return integration ?? null;
}

async function getTelegramIntegrationWithSecret(businessId: string) {
  const [integration] = await db.select().from(telegramIntegrations).where(eq(telegramIntegrations.businessId, businessId)).limit(1);
  if (!integration) throw new DomainError("Telegram integration is not configured.", "INVALID_STATE");
  return { ...integration, botToken: decryptSecret(integration.botTokenEncrypted) };
}

export async function saveTelegramIntegration(input: { businessId: string; botToken?: string; channelId: string; channelUsername?: string; isEnabled: boolean }) {
  const [existing] = await db.select().from(telegramIntegrations).where(eq(telegramIntegrations.businessId, input.businessId)).limit(1);
  if (!existing && !input.botToken) throw new DomainError("Enter the BotFather token.", "INVALID_INPUT");
  const botTokenEncrypted = input.botToken ? encryptSecret(input.botToken) : existing!.botTokenEncrypted;
  const values = { businessId: input.businessId, botTokenEncrypted, channelId: input.channelId, channelUsername: input.channelUsername ?? null, isEnabled: input.isEnabled, updatedAt: new Date() };
  const [integration] = await db.insert(telegramIntegrations).values(values).onConflictDoUpdate({ target: telegramIntegrations.businessId, set: { botTokenEncrypted, channelId: values.channelId, channelUsername: values.channelUsername, isEnabled: values.isEnabled, updatedAt: values.updatedAt } }).returning({ id: telegramIntegrations.id, channelId: telegramIntegrations.channelId, channelUsername: telegramIntegrations.channelUsername, isEnabled: telegramIntegrations.isEnabled });
  if (!integration) throw new Error("Telegram integration save did not return a row.");
  return integration;
}

export async function testTelegramIntegration(businessId: string) {
  const integration = await getTelegramIntegrationWithSecret(businessId);
  await getTelegramPublisher().testConnection(integration);
}

export async function getMotorcycleTelegramPublication(motorcycleId: string, businessId: string) {
  const [publication] = await db.select().from(publications).where(and(eq(publications.motorcycleId, motorcycleId), eq(publications.businessId, businessId), eq(publications.channel, "TELEGRAM"))).limit(1);
  return publication ?? null;
}

function publicImageUrl(origin: string, imageUrl: string) {
  return new URL(imageUrl, origin).toString();
}

export async function publishMotorcycleToTelegram(input: { motorcycleId: string; businessId: string; publicOrigin: string }) {
  const [motorcycle, integration, [business]] = await Promise.all([
    getAdminMotorcycleById(input.motorcycleId, input.businessId),
    getTelegramIntegrationWithSecret(input.businessId),
    db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1),
  ]);
  assertTelegramPublishable(motorcycle);
  if (!integration.isEnabled) throw new DomainError("Enable Telegram before publishing.", "INVALID_STATE");
  if (!business) throw new DomainError("Shop not found.", "NOT_FOUND");

  const [inserted] = await db.insert(publications).values({ businessId: input.businessId, motorcycleId: input.motorcycleId, channel: "TELEGRAM", status: "PENDING", lastAttemptAt: new Date() }).onConflictDoNothing({ target: [publications.businessId, publications.motorcycleId, publications.channel] }).returning();
  let publication = inserted;
  if (!publication) {
    const existing = await getMotorcycleTelegramPublication(input.motorcycleId, input.businessId);
    if (!existing) throw new Error("Publication record could not be loaded.");
    if (existing.status === "PUBLISHED" && existing.externalPostId) return existing;
    if (existing.status === "PENDING") throw new DomainError("Telegram publishing is already in progress.", "INVALID_STATE");
    const [claimedRetry] = await db.update(publications).set({ status: "PENDING", lastAttemptAt: new Date(), lastErrorCode: null, lastErrorMessage: null, updatedAt: new Date() }).where(and(eq(publications.id, existing.id), eq(publications.status, "FAILED"))).returning();
    if (!claimedRetry) throw new DomainError("Telegram publishing is already in progress.", "INVALID_STATE");
    publication = claimedRetry;
  }

  try {
    const result = await getTelegramPublisher().publishMotorcycle({
      botToken: integration.botToken,
      channelId: integration.channelId,
      channelUsername: integration.channelUsername,
      caption: buildTelegramMotorcycleCaption({ motorcycle, business, publicOrigin: input.publicOrigin }),
      imageUrls: motorcycle.images.map((image) => publicImageUrl(input.publicOrigin, image.url)),
    });
    const [published] = await db.update(publications).set({ status: "PUBLISHED", externalPostId: result.externalPostId, externalUrl: result.externalUrl ?? null, publishedAt: new Date(), lastErrorCode: null, lastErrorMessage: null, updatedAt: new Date() }).where(eq(publications.id, publication.id)).returning();
    return published!;
  } catch (error) {
    const providerError = error instanceof TelegramProviderError ? error : new TelegramProviderError("Telegram publishing failed. You can retry.", "UNKNOWN");
    await db.update(publications).set({ status: "FAILED", lastErrorCode: providerError.safeCode, lastErrorMessage: providerError.message, updatedAt: new Date() }).where(eq(publications.id, publication.id));
    throw new DomainError(providerError.message, "INVALID_STATE");
  }
}

import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, facebookIntegrations, publications } from "@/db/schema";
import { getAdminMotorcycleById } from "@/data/motorcycles";
import { assertFacebookPublishable, buildFacebookMotorcycleCaption } from "@/domain/facebook";
import { DomainError } from "@/domain/errors";
import { getFacebookPublisher } from "@/integrations/facebook";
import { FacebookProviderError } from "@/integrations/facebook/types";
import { decryptSecret, encryptSecret } from "@/security/secrets";

export async function getFacebookIntegrationSummary(businessId: string) {
  const [integration] = await db.select({ id: facebookIntegrations.id, pageId: facebookIntegrations.pageId, pageName: facebookIntegrations.pageName, captionTemplate: facebookIntegrations.captionTemplate, isEnabled: facebookIntegrations.isEnabled, updatedAt: facebookIntegrations.updatedAt }).from(facebookIntegrations).where(eq(facebookIntegrations.businessId, businessId)).limit(1);
  return integration ?? null;
}

async function getFacebookIntegrationWithSecret(businessId: string) {
  const [integration] = await db.select().from(facebookIntegrations).where(eq(facebookIntegrations.businessId, businessId)).limit(1);
  if (!integration) throw new DomainError("Facebook integration is not configured.", "INVALID_STATE");
  return { ...integration, pageAccessToken: decryptSecret(integration.pageAccessTokenEncrypted) };
}

export async function saveFacebookIntegration(input: { businessId: string; pageAccessToken?: string; pageId: string; pageName?: string; captionTemplate?: string; isEnabled: boolean }) {
  const [existing] = await db.select().from(facebookIntegrations).where(eq(facebookIntegrations.businessId, input.businessId)).limit(1);
  if (!existing && !input.pageAccessToken) throw new DomainError("Enter a Page access token.", "INVALID_INPUT");
  const pageAccessTokenEncrypted = input.pageAccessToken ? encryptSecret(input.pageAccessToken) : existing!.pageAccessTokenEncrypted;
  const values = { businessId: input.businessId, pageAccessTokenEncrypted, pageId: input.pageId, pageName: input.pageName ?? null, captionTemplate: input.captionTemplate ?? null, isEnabled: input.isEnabled, updatedAt: new Date() };
  const [integration] = await db.insert(facebookIntegrations).values(values).onConflictDoUpdate({ target: facebookIntegrations.businessId, set: { pageAccessTokenEncrypted, pageId: values.pageId, pageName: values.pageName, captionTemplate: values.captionTemplate, isEnabled: values.isEnabled, updatedAt: values.updatedAt } }).returning({ id: facebookIntegrations.id, pageId: facebookIntegrations.pageId, pageName: facebookIntegrations.pageName, captionTemplate: facebookIntegrations.captionTemplate, isEnabled: facebookIntegrations.isEnabled });
  if (!integration) throw new Error("Facebook integration save did not return a row.");
  return integration;
}

export async function testFacebookIntegration(businessId: string) {
  const integration = await getFacebookIntegrationWithSecret(businessId);
  const result = await getFacebookPublisher().testConnection(integration);
  if (!result.pageName || result.pageName === integration.pageName) return;
  await db.update(facebookIntegrations).set({ pageName: result.pageName, updatedAt: new Date() }).where(eq(facebookIntegrations.id, integration.id));
}

export async function getMotorcycleFacebookPublication(motorcycleId: string, businessId: string) {
  const [publication] = await db.select().from(publications).where(and(eq(publications.motorcycleId, motorcycleId), eq(publications.businessId, businessId), eq(publications.channel, "FACEBOOK"))).limit(1);
  return publication ?? null;
}

function publicImageUrl(origin: string, imageUrl: string) {
  return new URL(imageUrl, origin).toString();
}

export async function publishMotorcycleToFacebook(input: { motorcycleId: string; businessId: string; publicOrigin: string }) {
  const [motorcycle, integration, [business]] = await Promise.all([
    getAdminMotorcycleById(input.motorcycleId, input.businessId),
    getFacebookIntegrationWithSecret(input.businessId),
    db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1),
  ]);
  assertFacebookPublishable(motorcycle);
  if (!integration.isEnabled) throw new DomainError("Enable Facebook before publishing.", "INVALID_STATE");
  if (!business) throw new DomainError("Shop not found.", "NOT_FOUND");
  const message = buildFacebookMotorcycleCaption({ motorcycle, business, publicOrigin: input.publicOrigin, template: integration.captionTemplate });

  const [inserted] = await db.insert(publications).values({ businessId: input.businessId, motorcycleId: input.motorcycleId, channel: "FACEBOOK", status: "PENDING", lastAttemptAt: new Date() }).onConflictDoNothing({ target: [publications.businessId, publications.motorcycleId, publications.channel] }).returning();
  let publication = inserted;
  if (!publication) {
    const existing = await getMotorcycleFacebookPublication(input.motorcycleId, input.businessId);
    if (!existing) throw new Error("Facebook publication record could not be loaded.");
    if (existing.status === "PUBLISHED" && existing.externalPostId) return existing;
    if (existing.status === "PENDING") throw new DomainError("Facebook publishing is already in progress.", "INVALID_STATE");
    const [claimedRetry] = await db.update(publications).set({ status: "PENDING", lastAttemptAt: new Date(), lastErrorCode: null, lastErrorMessage: null, updatedAt: new Date() }).where(and(eq(publications.id, existing.id), eq(publications.status, "FAILED"))).returning();
    if (!claimedRetry) throw new DomainError("Facebook publishing is already in progress.", "INVALID_STATE");
    publication = claimedRetry;
  }

  try {
    const result = await getFacebookPublisher().publishMotorcycle({
      pageAccessToken: integration.pageAccessToken,
      pageId: integration.pageId,
      message,
      imageUrls: motorcycle.images.map((image) => publicImageUrl(input.publicOrigin, image.url)),
    });
    const [published] = await db.update(publications).set({ status: "PUBLISHED", externalPostId: result.externalPostId, externalUrl: result.externalUrl ?? null, publishedAt: new Date(), lastErrorCode: null, lastErrorMessage: null, updatedAt: new Date() }).where(eq(publications.id, publication.id)).returning();
    if (!published) throw new Error("Facebook publication update did not return a row.");
    return published;
  } catch (error) {
    const providerError = error instanceof FacebookProviderError ? error : new FacebookProviderError("Facebook publishing failed. You can retry.", "UNKNOWN");
    await db.update(publications).set({ status: "FAILED", lastErrorCode: providerError.safeCode, lastErrorMessage: providerError.message, updatedAt: new Date() }).where(eq(publications.id, publication.id));
    throw new DomainError(providerError.message, "INVALID_STATE");
  }
}

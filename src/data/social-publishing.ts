import "server-only";

import { getFacebookIntegrationSummary, publishMotorcycleToFacebook } from "@/data/facebook";
import { getTelegramIntegrationSummary, publishMotorcycleToTelegram } from "@/data/telegram";

type SocialPublishInput = { motorcycleId: string; businessId: string; publicOrigin: string };

export async function publishMotorcycleToEnabledChannels(input: SocialPublishInput) {
  const [telegram, facebook] = await Promise.all([
    getTelegramIntegrationSummary(input.businessId),
    getFacebookIntegrationSummary(input.businessId),
  ]);
  const publications: Promise<unknown>[] = [];
  if (telegram?.isEnabled) publications.push(publishMotorcycleToTelegram(input));
  if (facebook?.isEnabled) publications.push(publishMotorcycleToFacebook(input));
  if (publications.length === 0) return [];
  return Promise.allSettled(publications);
}

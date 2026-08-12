import { z } from "zod";

import type { Business, Motorcycle, MotorcycleImage } from "@/db/schema";
import { DomainError } from "@/domain/errors";
import { assertCaptionLength, parseCaptionTemplate, renderCaptionTemplate } from "@/domain/social-caption";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export const telegramCaptionModes = ["EN", "KM", "BILINGUAL"] as const;

const telegramSettingsSchema = z.object({
  botToken: z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().trim().min(20, "Enter the BotFather token.").optional()),
  channelId: z.string().trim().min(2, "Channel ID or username is required.").max(200),
  captionTemplate: z.unknown().optional(),
  isEnabled: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()),
});

export function parseTelegramSettings(value: unknown) {
  const result = telegramSettingsSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid Telegram settings.", "INVALID_INPUT");
  const channelUsername = result.data.channelId.startsWith("@") ? result.data.channelId.slice(1) : undefined;
  return { ...result.data, captionTemplate: parseCaptionTemplate(result.data.captionTemplate), channelUsername };
}

type CaptionMotorcycle = Pick<Motorcycle, "brand" | "model" | "year" | "condition" | "color" | "mileage" | "engineCc" | "description" | "price" | "currency" | "slug">;
type CaptionBusiness = Pick<Business, "name" | "phone" | "slug">;

function englishDetails(motorcycle: CaptionMotorcycle) {
  return [
    `🏍 ${displayMotorcycleName(motorcycle.brand, motorcycle.model)}${motorcycle.year ? ` ${motorcycle.year}` : ""}`,
    motorcycle.price ? `💰 ${formatPrice(motorcycle.price, motorcycle.currency)}` : null,
    motorcycle.condition ? `${motorcycle.condition === "NEW" ? "✨ New" : "✅ Used"}` : null,
    motorcycle.color ? `🎨 ${motorcycle.color}` : null,
    motorcycle.mileage !== null ? `🛣 ${motorcycle.mileage.toLocaleString()} km` : null,
    motorcycle.engineCc !== null ? `⚙️ ${motorcycle.engineCc}cc` : null,
  ].filter(Boolean).join("\n");
}

function khmerDetails(motorcycle: CaptionMotorcycle) {
  return [
    `🏍 ${displayMotorcycleName(motorcycle.brand, motorcycle.model)}${motorcycle.year ? ` ${motorcycle.year}` : ""}`,
    motorcycle.price ? `💰 តម្លៃ ${formatPrice(motorcycle.price, motorcycle.currency)}` : null,
    motorcycle.condition ? `${motorcycle.condition === "NEW" ? "✨ ម៉ូតូថ្មី" : "✅ ម៉ូតូមួយទឹក"}` : null,
    motorcycle.color ? `🎨 ពណ៌ ${motorcycle.color}` : null,
    motorcycle.mileage !== null ? `🛣 ចម្ងាយ ${motorcycle.mileage.toLocaleString()} km` : null,
    motorcycle.engineCc !== null ? `⚙️ ម៉ាស៊ីន ${motorcycle.engineCc}cc` : null,
  ].filter(Boolean).join("\n");
}

export function buildTelegramMotorcycleCaption(input: {
  motorcycle: CaptionMotorcycle;
  business: CaptionBusiness;
  publicOrigin: string;
  mode?: (typeof telegramCaptionModes)[number];
  template?: string | null;
  captionLimit?: { channel: "Telegram" | "Facebook"; maximumLength: number };
}) {
  const captionLimit = input.captionLimit ?? { channel: "Telegram" as const, maximumLength: 1_024 };
  if (input.template) {
    const caption = renderCaptionTemplate({ ...input, template: input.template });
    assertCaptionLength(caption, captionLimit.channel, captionLimit.maximumLength);
    return caption;
  }
  const mode = input.mode ?? "BILINGUAL";
  const details = mode === "EN" ? englishDetails(input.motorcycle) : mode === "KM" ? khmerDetails(input.motorcycle) : `${khmerDetails(input.motorcycle)}\n\n${englishDetails(input.motorcycle)}`;
  const listingUrl = new URL(`/${input.business.slug}/moto/${input.motorcycle.slug}`, input.publicOrigin).toString();
  const caption = [details, input.motorcycle.description?.trim() || null, `📍 ${input.business.name}`, input.business.phone ? `📞 ${input.business.phone}` : null, `ព័ត៌មានលម្អិត / Details:\n${listingUrl}`].filter(Boolean).join("\n\n");
  assertCaptionLength(caption, captionLimit.channel, captionLimit.maximumLength);
  return caption;
}

export function assertTelegramPublishable(motorcycle: Motorcycle & { images: MotorcycleImage[] }) {
  if (motorcycle.status !== "AVAILABLE") throw new DomainError("Only available motorcycles can be published to Telegram.", "INVALID_STATE");
  if (motorcycle.images.length < 1) throw new DomainError("Add at least one photo before publishing to Telegram.", "INVALID_STATE");
  if (!motorcycle.brand || !motorcycle.model || !motorcycle.year || !motorcycle.condition || !motorcycle.price || Number(motorcycle.price) <= 0) {
    throw new DomainError("Complete the website listing before publishing to Telegram.", "INVALID_STATE");
  }
}

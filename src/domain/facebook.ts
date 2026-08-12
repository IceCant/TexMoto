import { z } from "zod";

import type { Business, Motorcycle, MotorcycleImage } from "@/db/schema";
import { DomainError } from "@/domain/errors";
import { parseCaptionTemplate } from "@/domain/social-caption";
import { buildTelegramMotorcycleCaption } from "@/domain/telegram";

const facebookSettingsSchema = z.object({
  pageAccessToken: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.string().trim().min(20, "Enter a valid Page access token.").optional(),
  ),
  pageId: z.string().trim().regex(/^\d+$/, "Page ID must contain numbers only."),
  pageName: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.string().trim().max(200).optional(),
  ),
  captionTemplate: z.unknown().optional(),
  isEnabled: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()),
});

export function parseFacebookSettings(value: unknown) {
  const result = facebookSettingsSchema.safeParse(value);
  if (!result.success) throw new DomainError(result.error.issues[0]?.message ?? "Invalid Facebook settings.", "INVALID_INPUT");
  return { ...result.data, captionTemplate: parseCaptionTemplate(result.data.captionTemplate) };
}

export function parseGraphApiVersion(value: string | undefined) {
  const result = z.string().regex(/^v\d+\.\d+$/, "META_GRAPH_API_VERSION must look like vXX.X.").safeParse(value);
  if (!result.success) throw new DomainError("Set META_GRAPH_API_VERSION to the version shown in your Meta app dashboard.", "INVALID_STATE");
  return result.data;
}

type PublishableMotorcycle = Motorcycle & { images: MotorcycleImage[] };

export function assertFacebookPublishable(motorcycle: PublishableMotorcycle) {
  if (motorcycle.status !== "AVAILABLE") throw new DomainError("Only available motorcycles can be published to Facebook.", "INVALID_STATE");
  if (motorcycle.images.length < 1) throw new DomainError("Add at least one photo before publishing to Facebook.", "INVALID_STATE");
  if (!motorcycle.brand || !motorcycle.model || !motorcycle.year || !motorcycle.condition || !motorcycle.price || Number(motorcycle.price) <= 0) {
    throw new DomainError("Complete the website listing before publishing to Facebook.", "INVALID_STATE");
  }
}

export function buildFacebookMotorcycleCaption(input: {
  motorcycle: PublishableMotorcycle;
  business: Business;
  publicOrigin: string;
  template?: string | null;
}) {
  return buildTelegramMotorcycleCaption({ ...input, template: input.template, captionLimit: { channel: "Facebook", maximumLength: 5_000 } });
}

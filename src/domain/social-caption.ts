import type { Business, Motorcycle } from "@/db/schema";
import { DomainError } from "@/domain/errors";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export const socialCaptionPlaceholders = [
  "{name}",
  "{brand}",
  "{model}",
  "{year}",
  "{price}",
  "{condition}",
  "{color}",
  "{mileage}",
  "{engineCc}",
  "{description}",
  "{shopName}",
  "{phone}",
  "{listingUrl}",
] as const;

type CaptionPlaceholder = (typeof socialCaptionPlaceholders)[number];
type CaptionMotorcycle = Pick<Motorcycle, "brand" | "model" | "year" | "condition" | "color" | "mileage" | "engineCc" | "description" | "price" | "currency" | "slug">;
type CaptionBusiness = Pick<Business, "name" | "phone" | "slug">;

const supportedPlaceholders = new Set<string>(socialCaptionPlaceholders);
const placeholderPattern = /\{[^{}]+\}/g;

export function parseCaptionTemplate(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw new DomainError("Caption template must be text.", "INVALID_INPUT");

  const template = value.trim();
  if (!template) return undefined;
  if (template.length > 4_000) throw new DomainError("Caption template must be 4,000 characters or fewer.", "INVALID_INPUT");

  const unknownPlaceholder = template.match(placeholderPattern)?.find((placeholder) => !supportedPlaceholders.has(placeholder));
  if (unknownPlaceholder) throw new DomainError(`Unknown caption placeholder ${unknownPlaceholder}. Choose one from the list below the caption field.`, "INVALID_INPUT");
  return template;
}

function captionValues(motorcycle: CaptionMotorcycle, business: CaptionBusiness, publicOrigin: string): Record<CaptionPlaceholder, string> {
  return {
    "{name}": displayMotorcycleName(motorcycle.brand, motorcycle.model),
    "{brand}": motorcycle.brand ?? "",
    "{model}": motorcycle.model ?? "",
    "{year}": motorcycle.year?.toString() ?? "",
    "{price}": motorcycle.price ? formatPrice(motorcycle.price, motorcycle.currency) : "",
    "{condition}": motorcycle.condition === "NEW" ? "New" : motorcycle.condition === "USED" ? "Used" : "",
    "{color}": motorcycle.color ?? "",
    "{mileage}": motorcycle.mileage === null ? "" : `${motorcycle.mileage.toLocaleString()} km`,
    "{engineCc}": motorcycle.engineCc === null ? "" : `${motorcycle.engineCc}cc`,
    "{description}": motorcycle.description?.trim() ?? "",
    "{shopName}": business.name,
    "{phone}": business.phone ?? "",
    "{listingUrl}": new URL(`/${business.slug}/moto/${motorcycle.slug}`, publicOrigin).toString(),
  };
}

export function renderCaptionTemplate(input: {
  template: string;
  motorcycle: CaptionMotorcycle;
  business: CaptionBusiness;
  publicOrigin: string;
}) {
  const template = parseCaptionTemplate(input.template);
  if (!template) throw new DomainError("Caption template cannot be empty.", "INVALID_INPUT");

  const values = captionValues(input.motorcycle, input.business, input.publicOrigin);
  const renderedLines = template.split(/\r?\n/).map((line) => {
    const linePlaceholders = line.match(placeholderPattern) ?? [];
    if (linePlaceholders.some((placeholder) => !values[placeholder as CaptionPlaceholder])) return "";
    return line.replace(placeholderPattern, (placeholder) => values[placeholder as CaptionPlaceholder]).trimEnd();
  });
  const caption = renderedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!caption) throw new DomainError("Caption template produced an empty post.", "INVALID_INPUT");
  return caption;
}

export function assertCaptionLength(caption: string, channel: "Telegram" | "Facebook", maximumLength: number) {
  if (caption.length <= maximumLength) return;
  throw new DomainError(`${channel} caption is too long (${caption.length}/${maximumLength} characters). Shorten the caption template or motorcycle description.`, "INVALID_INPUT");
}

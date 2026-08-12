import { DomainError } from "@/domain/errors";

export const storefrontThemes = ["MARKETPLACE", "EDITORIAL", "LOCAL"] as const;

export type StorefrontTheme = (typeof storefrontThemes)[number];

export function parseStorefrontTheme(value: unknown): StorefrontTheme {
  if (typeof value !== "string") {
    throw new DomainError("Choose a storefront style.", "INVALID_INPUT");
  }

  const theme = storefrontThemes.find((candidate) => candidate === value);
  if (!theme) throw new DomainError("That storefront style is not supported.", "INVALID_INPUT");
  return theme;
}

export function storefrontThemeAttribute(theme: StorefrontTheme) {
  return theme.toLowerCase();
}

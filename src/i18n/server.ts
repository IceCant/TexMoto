import "server-only";

import { cookies } from "next/headers";

import { getDictionary, type Locale } from "@/i18n/dictionaries";

export async function getLocale(): Promise<Locale> {
  return (await cookies()).get("texmoto_locale")?.value === "km" ? "km" : "en";
}

export async function getTranslations() {
  return getDictionary(await getLocale());
}


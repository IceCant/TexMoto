"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteCurrentSession, requireSession } from "@/auth/session";
import { updateBusinessStorefrontTheme } from "@/data/motorcycles";
import { parseStorefrontTheme } from "@/domain/storefront-theme";

export async function logoutAction() {
  await deleteCurrentSession();
  redirect("/login");
}

export async function setLocaleAction(formData: FormData) {
  const locale = formData.get("locale") === "km" ? "km" : "en";
  (await cookies()).set("texmoto_locale", locale, { path: "/", sameSite: "lax", maxAge: 31_536_000 });
}

export async function setStorefrontThemeAction(formData: FormData) {
  const session = await requireSession();
  const storefrontTheme = parseStorefrontTheme(formData.get("storefrontTheme"));
  await updateBusinessStorefrontTheme(session.businessId, storefrontTheme);
  revalidatePath(`/${session.businessSlug}`);
  revalidatePath(`/${session.businessSlug}/moto/[motorcycleSlug]`, "page");
  redirect("/admin/settings?style=saved");
}

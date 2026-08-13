"use server";

import { cookies } from "next/headers";

export async function setLocaleAction(formData: FormData) {
  const locale = formData.get("locale") === "km" ? "km" : "en";
  (await cookies()).set("texmoto_locale", locale, { path: "/", sameSite: "lax", maxAge: 31_536_000 });
}

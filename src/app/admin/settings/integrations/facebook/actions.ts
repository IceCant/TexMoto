"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/auth/session";
import { saveFacebookIntegration, testFacebookIntegration } from "@/data/facebook";
import { parseFacebookSettings } from "@/domain/facebook";
import { DomainError } from "@/domain/errors";
import { FacebookProviderError } from "@/integrations/facebook/types";

export type FacebookSettingsState = { error?: string; success?: string };

function safeMessage(error: unknown) {
  if (error instanceof DomainError || error instanceof FacebookProviderError) return error.message;
  return "Facebook could not be reached. Check the configuration and retry.";
}

export async function saveFacebookSettingsAction(_state: FacebookSettingsState, formData: FormData): Promise<FacebookSettingsState> {
  const session = await requireSession();
  if (session.role !== "OWNER") return { error: "Only a shop owner can change Facebook settings." };
  try {
    const settings = parseFacebookSettings({ pageAccessToken: formData.get("pageAccessToken"), pageId: formData.get("pageId"), pageName: formData.get("pageName"), isEnabled: formData.get("isEnabled") });
    await saveFacebookIntegration({ businessId: session.businessId, ...settings });
  } catch (error) { return { error: safeMessage(error) }; }
  revalidatePath("/admin/settings/integrations/facebook");
  redirect("/admin/settings/integrations/facebook?saved=1");
}

export async function testFacebookConnectionAction(): Promise<FacebookSettingsState> {
  const session = await requireSession();
  if (session.role !== "OWNER") return { error: "Only a shop owner can test Facebook settings." };
  try {
    await testFacebookIntegration(session.businessId);
    return { success: "Facebook Page connection successful." };
  } catch (error) { return { error: safeMessage(error) }; }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/auth/session";
import { saveTelegramIntegration, testTelegramIntegration } from "@/data/telegram";
import { DomainError } from "@/domain/errors";
import { parseTelegramSettings } from "@/domain/telegram";

export type TelegramSettingsState = { error?: string; success?: string };

function safeMessage(error: unknown) {
  if (error instanceof DomainError) return error.message;
  if (error instanceof Error && error.name === "TelegramProviderError") return error.message;
  return "Telegram could not be reached. Check the configuration and retry.";
}

export async function saveTelegramSettingsAction(_state: TelegramSettingsState, formData: FormData): Promise<TelegramSettingsState> {
  const session = await requireSession();
  if (session.role !== "OWNER") return { error: "Only a shop owner can change Telegram settings." };
  try {
    const settings = parseTelegramSettings({ botToken: formData.get("botToken"), channelId: formData.get("channelId"), isEnabled: formData.get("isEnabled") });
    await saveTelegramIntegration({ businessId: session.businessId, ...settings });
  } catch (error) { return { error: safeMessage(error) }; }
  revalidatePath("/admin/settings/integrations/telegram");
  redirect("/admin/settings/integrations/telegram?saved=1");
}

export async function testTelegramConnectionAction(): Promise<TelegramSettingsState> {
  const session = await requireSession();
  if (session.role !== "OWNER") return { error: "Only a shop owner can test Telegram settings." };
  try {
    await testTelegramIntegration(session.businessId);
    return { success: "Telegram connection successful." };
  } catch (error) { return { error: safeMessage(error) }; }
}

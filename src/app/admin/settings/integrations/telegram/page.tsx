import Link from "next/link";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { TelegramSettingsForm } from "@/app/admin/settings/integrations/telegram/telegram-settings-form";
import { getTelegramIntegrationSummary } from "@/data/telegram";

export const metadata = { title: "Telegram integration" };

export default async function TelegramSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [session, query] = await Promise.all([requirePageSession(), searchParams]);
  const integration = await getTelegramIntegrationSummary(session.businessId);
  return <div className="mx-auto max-w-2xl"><Link href="/admin/settings" className="admin-back"><IconArrowLeft size={18} /> Settings</Link>{query.saved === "1" ? <p className="settings-success"><IconCheck size={19} /> Telegram configuration saved.</p> : null}<TelegramSettingsForm integration={integration} /></div>;
}

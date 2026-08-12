import Link from "next/link";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

import { FacebookSettingsForm } from "@/app/admin/settings/integrations/facebook/facebook-settings-form";
import { requirePageSession } from "@/auth/page-session";
import { getFacebookIntegrationSummary } from "@/data/facebook";

export const metadata = { title: "Facebook integration" };

export default async function FacebookSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [session, query] = await Promise.all([requirePageSession(), searchParams]);
  const integration = await getFacebookIntegrationSummary(session.businessId);
  return <div className="mx-auto max-w-2xl"><Link href="/admin/settings" className="admin-back"><IconArrowLeft size={18} /> Settings</Link>{query.saved === "1" ? <p className="settings-success"><IconCheck size={19} /> Facebook configuration saved.</p> : null}<FacebookSettingsForm integration={integration} /></div>;
}

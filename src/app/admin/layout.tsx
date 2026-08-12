import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { getCurrentSession } from "@/auth/session";
import { Logo } from "@/components/logo";
import { AdminNavigation } from "@/components/admin-navigation";
import { getTranslations } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const t = await getTranslations();
  return (
    <div className="min-h-dvh pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#e5e1d7] bg-[#f7f5ef]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo href="/admin" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{session.businessName}</p>
              <p className="text-xs text-[#68736c]">{session.userName}</p>
            </div>
            <form action={logoutAction}>
              <button aria-label="Log out" className="grid size-11 place-items-center rounded-xl border border-[#e5e1d7] bg-white"><LogOut size={18} /></button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <AdminNavigation labels={{ home: t["nav.home"], motorcycles: t["nav.motorcycles"], add: t["nav.add"], settings: t["nav.settings"] }} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

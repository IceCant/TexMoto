import Link from "next/link";
import { redirect } from "next/navigation";
import { Bike, CirclePlus, House, LogOut, Receipt, Settings, Users } from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { getCurrentSession } from "@/auth/session";
import { Logo } from "@/components/logo";
import { getTranslations } from "@/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const t = await getTranslations();
  const navigation = [
    { href: "/admin", label: t["nav.home"], icon: House },
    { href: "/admin/motorcycles", label: t["nav.motorcycles"], icon: Bike },
    { href: "/admin/customers", label: "Customers", icon: Users, desktopOnly: true },
    { href: "/admin/sales", label: "Sales", icon: Receipt, desktopOnly: true },
    { href: "/admin/motorcycles/new", label: t["nav.add"], icon: CirclePlus, primary: true },
    { href: "/admin/settings", label: t["nav.settings"], icon: Settings },
  ];

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
        <aside className="hidden w-60 shrink-0 px-4 py-8 lg:block">
          <nav className="space-y-2">
            {navigation.map(({ href, label, icon: Icon, primary }) => (
              <Link key={href} href={href} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 font-bold ${primary ? "bg-[#d75d2a] text-white" : "hover:bg-white"}`}>
                <Icon size={19} /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-9">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#e5e1d7] bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {navigation.filter(({ desktopOnly }) => !desktopOnly).map(({ href, label, icon: Icon, primary }) => (
          <Link key={href} href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${primary ? "text-[#d75d2a]" : "text-[#4b5750]"}`}>
            <Icon size={primary ? 26 : 22} strokeWidth={primary ? 2.6 : 2} /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

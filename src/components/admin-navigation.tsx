"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, CirclePlus, House, Receipt, Settings, Users, type LucideIcon } from "lucide-react";

type NavigationItem = { href: string; label: string; icon: LucideIcon; mobile?: boolean };

export function AdminNavigation({ labels }: { labels: { home: string; motorcycles: string; customers: string; sales: string; add: string; settings: string } }) {
  const pathname = usePathname();
  const navigation: NavigationItem[] = [
    { href: "/admin", label: labels.home, icon: House, mobile: true },
    { href: "/admin/motorcycles", label: labels.motorcycles, icon: Bike, mobile: true },
    { href: "/admin/customers", label: labels.customers, icon: Users },
    { href: "/admin/sales", label: labels.sales, icon: Receipt },
    { href: "/admin/settings", label: labels.settings, icon: Settings, mobile: true },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === href;
    if (href === "/admin/motorcycles" && pathname === "/admin/motorcycles/new") return false;
    return pathname.startsWith(href);
  }

  return <>
    <aside className="admin-sidebar hidden w-60 shrink-0 px-4 py-8 lg:block">
      <nav aria-label="Admin navigation">
        {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={isActive(href) ? "is-active" : ""}><Icon size={19} /> {label}</Link>)}
      </nav>
    </aside>
    <nav className="admin-mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Admin navigation">
      {navigation.filter(({ mobile }) => mobile).slice(0, 2).map(({ href, label, icon: Icon }) => <MobileLink key={href} href={href} label={label} icon={Icon} active={isActive(href)} />)}
      <MobileLink href="/admin/motorcycles/new" label={labels.add} icon={CirclePlus} active={pathname === "/admin/motorcycles/new"} primary />
      {navigation.filter(({ href }) => href === "/admin/settings").map(({ href, label, icon: Icon }) => <MobileLink key={href} href={href} label={label} icon={Icon} active={isActive(href)} />)}
    </nav>
  </>;
}

function MobileLink({ href, label, icon: Icon, active, primary }: { href: string; label: string; icon: LucideIcon; active: boolean; primary?: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`${active ? "is-active" : ""} ${primary ? "is-primary" : ""}`}><span><Icon size={primary ? 25 : 21} strokeWidth={primary ? 2.4 : 2} /></span>{label}</Link>;
}

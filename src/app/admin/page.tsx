import Link from "next/link";
import { Bike, CirclePlus, DollarSign, Tag, Trophy } from "lucide-react";

import { requirePageSession } from "@/auth/page-session";
import { AdminMotorcycleCard } from "@/components/admin-motorcycle-card";
import { getDashboardData } from "@/data/motorcycles";
import { getMonthlySalesSummary } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requirePageSession();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const [{ counts, recent }, sales] = await Promise.all([getDashboardData(session.businessId), getMonthlySalesSummary(session.businessId)]);
  const stats = [
    { label: t["dashboard.available"], value: counts.AVAILABLE ?? 0, icon: Tag, color: "text-emerald-700 bg-emerald-50" },
    { label: t["dashboard.reserved"], value: counts.RESERVED ?? 0, icon: Bike, color: "text-amber-700 bg-amber-50" },
    { label: t["dashboard.soldMonth"], value: sales.soldCount, icon: Trophy, color: "text-blue-700 bg-blue-50" },
    { label: t["dashboard.salesMonth"], value: sales.totals.length > 0 ? sales.totals.map((total) => formatPrice(total.salesValue, total.currency)).join(" · ") : formatPrice("0", "USD"), icon: DollarSign, color: "text-violet-700 bg-violet-50" },
  ];
  return (
    <div>
      <div className="dashboard-title-row">
        <div><p className="eyebrow">{session.businessName}</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{t["dashboard.overview"]}</h1></div>
        <Link href="/admin/motorcycles/new" className="button-primary dashboard-add-button"><CirclePlus size={19} /> {t["motorcycle.add"]}</Link>
      </div>
      <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="card p-4 sm:p-5" key={label}><span className={`grid size-9 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-medium text-[#68736c]">{label}</p></div>
        ))}
      </section>
      {sales.recentSales.length > 0 ? <section className="mt-9"><div className="flex items-end justify-between"><div><p className="eyebrow">{t["dashboard.sales"]}</p><h2 className="mt-1 text-xl font-black">{t["dashboard.recentSales"]}</h2></div><Link href="/admin/sales" className="text-sm font-bold text-[var(--primary)]">{t["common.viewAll"]}</Link></div><div className="dashboard-sales card mt-4">{sales.recentSales.map(({ sale, motorcycle, customer }) => <Link href={`/admin/sales/${sale.id}/receipt`} key={sale.id}><div><strong>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</strong><small>{customer?.name ?? t["common.buyer"]} · {sale.soldAt.toLocaleDateString(locale === "km" ? "km-KH" : "en-GB", { day: "numeric", month: "short" })}</small></div><b>{formatPrice(sale.sellingPrice, sale.currency)}</b></Link>)}</div></section> : null}
      <section className="mt-9">
        <div className="flex items-end justify-between"><div><p className="eyebrow">{t["dashboard.inventory"]}</p><h2 className="mt-1 text-xl font-black">{t["dashboard.recentlyAdded"]}</h2></div><Link href="/admin/motorcycles" className="text-sm font-bold text-[var(--primary)]">{t["common.viewAll"]}</Link></div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {recent.length > 0 ? recent.map((motorcycle) => <AdminMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={session.businessSlug} />) : <div className="card col-span-full p-8 text-center"><p className="font-bold">{t["dashboard.noMotorcycles"]}</p><p className="mt-1 text-sm text-[#68736c]">{t["dashboard.addFirst"]}</p></div>}
        </div>
      </section>
    </div>
  );
}

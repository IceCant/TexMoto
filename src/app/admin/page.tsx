import Link from "next/link";
import { Bike, CirclePlus, DollarSign, Tag, Trophy } from "lucide-react";

import { requirePageSession } from "@/auth/page-session";
import { AdminMotorcycleCard } from "@/components/admin-motorcycle-card";
import { getDashboardData } from "@/data/motorcycles";
import { getMonthlySalesSummary } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const session = await requirePageSession();
  const [{ counts, recent }, sales] = await Promise.all([getDashboardData(session.businessId), getMonthlySalesSummary(session.businessId)]);
  const stats = [
    { label: "Available", value: counts.AVAILABLE ?? 0, icon: Tag, color: "text-emerald-700 bg-emerald-50" },
    { label: "Reserved", value: counts.RESERVED ?? 0, icon: Bike, color: "text-amber-700 bg-amber-50" },
    { label: "Sold this month", value: sales.soldCount, icon: Trophy, color: "text-blue-700 bg-blue-50" },
    { label: "Sales this month", value: sales.totals.length > 0 ? sales.totals.map((total) => formatPrice(total.salesValue, total.currency)).join(" · ") : formatPrice("0", "USD"), icon: DollarSign, color: "text-violet-700 bg-violet-50" },
  ];
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div><p className="eyebrow">{session.businessName}</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Shop overview</h1></div>
        <Link href="/admin/motorcycles/new" className="button-primary hidden sm:inline-flex"><CirclePlus size={19} /> Add motorcycle</Link>
      </div>
      <Link href="/admin/motorcycles/new" className="button-primary mt-5 w-full sm:hidden"><CirclePlus size={19} /> Add motorcycle</Link>
      <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="card p-4 sm:p-5" key={label}><span className={`grid size-9 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-medium text-[#68736c]">{label}</p></div>
        ))}
      </section>
      {sales.recentSales.length > 0 ? <section className="mt-9"><div className="flex items-end justify-between"><div><p className="eyebrow">Sales</p><h2 className="mt-1 text-xl font-black">Recent sales</h2></div><Link href="/admin/sales" className="text-sm font-bold text-[#d75d2a]">View all</Link></div><div className="dashboard-sales card mt-4">{sales.recentSales.map(({ sale, motorcycle, customer }) => <Link href={`/admin/motorcycles/${motorcycle.id}`} key={sale.id}><div><strong>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</strong><small>{customer?.name ?? "Buyer"} · {sale.soldAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small></div><b>{formatPrice(sale.sellingPrice, sale.currency)}</b></Link>)}</div></section> : null}
      <section className="mt-9">
        <div className="flex items-end justify-between"><div><p className="eyebrow">Inventory</p><h2 className="mt-1 text-xl font-black">Recently added</h2></div><Link href="/admin/motorcycles" className="text-sm font-bold text-[#d75d2a]">View all</Link></div>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {recent.length > 0 ? recent.map((motorcycle) => <AdminMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={session.businessSlug} />) : <div className="card col-span-full p-8 text-center"><p className="font-bold">No motorcycles yet</p><p className="mt-1 text-sm text-[#68736c]">Add your first motorcycle to get started.</p></div>}
        </div>
      </section>
    </div>
  );
}

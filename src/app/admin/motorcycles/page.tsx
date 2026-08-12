import Link from "next/link";
import { CirclePlus, Search } from "lucide-react";

import { requirePageSession } from "@/auth/page-session";
import { AdminMotorcycleCard } from "@/components/admin-motorcycle-card";
import { listAdminMotorcycles } from "@/data/motorcycles";

export const metadata = { title: "Motorcycles" };

export default async function MotorcyclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePageSession();
  const params = await searchParams;
  const getParam = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const filters = { search: getParam("search"), status: getParam("status"), brand: getParam("brand"), condition: getParam("condition") };
  const [motorcycles, allMotorcycles] = await Promise.all([
    listAdminMotorcycles(session.businessId, filters),
    listAdminMotorcycles(session.businessId),
  ]);
  const brands = [...new Set(allMotorcycles.map((motorcycle) => motorcycle.brand).filter(Boolean))].sort();
  return (
    <div>
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Inventory</p><h1 className="mt-1 text-3xl font-black tracking-tight">Motorcycles</h1></div><Link href="/admin/motorcycles/new" className="button-primary"><CirclePlus size={18} /><span className="hidden sm:inline">Add motorcycle</span></Link></div>
      <form className="card mt-6 grid gap-3 p-3 sm:grid-cols-4" action="/admin/motorcycles">
        <label className="relative sm:col-span-2"><Search className="absolute left-3 top-3.5 text-[#68736c]" size={18} /><input className="field pl-10" name="search" placeholder="Search brand or model" defaultValue={filters.search} /></label>
        <select className="field" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option><option value="AVAILABLE">Available</option><option value="DRAFT">Draft</option><option value="RESERVED">Reserved</option><option value="SOLD">Sold</option><option value="HIDDEN">Hidden</option></select>
        <select className="field" name="condition" defaultValue={filters.condition ?? ""}><option value="">Any condition</option><option value="NEW">New</option><option value="USED">Used</option></select>
        <select className="field sm:col-span-2" name="brand" defaultValue={filters.brand ?? ""}><option value="">All brands</option>{brands.map((brand) => <option key={brand!}>{brand}</option>)}</select>
        <button className="button-secondary sm:col-span-2">Apply filters</button>
      </form>
      <p className="mt-5 text-sm font-medium text-[#68736c]">{motorcycles.length} motorcycle{motorcycles.length === 1 ? "" : "s"}</p>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {motorcycles.map((motorcycle) => <AdminMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={session.businessSlug} />)}
        {motorcycles.length === 0 ? <div className="card col-span-full p-10 text-center"><p className="font-black">No matching motorcycles</p><p className="mt-1 text-sm text-[#68736c]">Try clearing a filter or add a new motorcycle.</p></div> : null}
      </div>
    </div>
  );
}

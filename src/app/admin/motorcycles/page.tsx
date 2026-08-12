import Link from "next/link";
import { CirclePlus, Search, SlidersHorizontal, X } from "lucide-react";

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
  const hasFilters = Boolean(filters.search || filters.status || filters.brand || filters.condition);
  return (
    <div>
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Inventory</p><h1 className="mt-1 text-3xl font-black tracking-tight">Motorcycles</h1></div><Link href="/admin/motorcycles/new" className="button-primary"><CirclePlus size={18} /><span className="hidden sm:inline">Add motorcycle</span></Link></div>
      <form className="card inventory-filters mt-6" action="/admin/motorcycles">
        <div className="inventory-search"><Search size={18} /><label className="sr-only" htmlFor="inventory-search">Search inventory</label><input id="inventory-search" name="search" placeholder="Search brand or model" defaultValue={filters.search} /></div>
        <div className="inventory-filter-grid">
          <label><span>Status</span><select className="field" name="status" defaultValue={filters.status ?? ""}><option value="">All statuses</option><option value="AVAILABLE">Available</option><option value="DRAFT">Draft</option><option value="RESERVED">Reserved</option><option value="SOLD">Sold</option><option value="HIDDEN">Hidden</option></select></label>
          <label><span>Condition</span><select className="field" name="condition" defaultValue={filters.condition ?? ""}><option value="">Any condition</option><option value="NEW">New</option><option value="USED">Used</option></select></label>
          <label><span>Brand</span><select className="field" name="brand" defaultValue={filters.brand ?? ""}><option value="">All brands</option>{brands.map((brand) => <option key={brand!}>{brand}</option>)}</select></label>
          <button className="button-primary"><SlidersHorizontal size={17} /> Apply</button>
        </div>
      </form>
      <div className="inventory-results"><p>{motorcycles.length} motorcycle{motorcycles.length === 1 ? "" : "s"}</p>{hasFilters ? <Link href="/admin/motorcycles"><X size={15} /> Clear filters</Link> : null}</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {motorcycles.map((motorcycle) => <AdminMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={session.businessSlug} />)}
        {motorcycles.length === 0 ? <div className="card col-span-full p-10 text-center"><p className="font-black">No matching motorcycles</p><p className="mt-1 text-sm text-[#68736c]">Try clearing a filter or add a new motorcycle.</p></div> : null}
      </div>
    </div>
  );
}

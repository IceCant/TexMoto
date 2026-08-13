import Link from "next/link";
import { CirclePlus, Search, SlidersHorizontal, X } from "lucide-react";

import { requirePageSession } from "@/auth/page-session";
import { AdminMotorcycleCard } from "@/components/admin-motorcycle-card";
import { listAdminMotorcycles } from "@/data/motorcycles";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Motorcycles" };

export default async function MotorcyclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePageSession();
  const t = getDictionary(await getLocale());
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
      <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">{t["dashboard.inventory"]}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{t["inventory.title"]}</h1></div><Link href="/admin/motorcycles/new" className="button-primary"><CirclePlus size={18} /><span className="hidden sm:inline">{t["motorcycle.add"]}</span></Link></div>
      <form className="card inventory-filters mt-6" action="/admin/motorcycles">
        <div className="inventory-search"><Search size={18} /><label className="sr-only" htmlFor="inventory-search">{t["common.search"]}</label><input id="inventory-search" name="search" placeholder={t["inventory.searchPlaceholder"]} defaultValue={filters.search} /></div>
        <div className="inventory-filter-grid">
          <label><span>{t["inventory.status"]}</span><select className="field" name="status" defaultValue={filters.status ?? ""}><option value="">{t["inventory.allStatuses"]}</option><option value="AVAILABLE">{t["motorcycle.status.available"]}</option><option value="DRAFT">{t["motorcycle.status.draft"]}</option><option value="RESERVED">{t["motorcycle.status.reserved"]}</option><option value="SOLD">{t["motorcycle.status.sold"]}</option><option value="HIDDEN">{t["motorcycle.status.hidden"]}</option></select></label>
          <label><span>{t["inventory.condition"]}</span><select className="field" name="condition" defaultValue={filters.condition ?? ""}><option value="">{t["inventory.anyCondition"]}</option><option value="NEW">{t["form.new"]}</option><option value="USED">{t["form.used"]}</option></select></label>
          <label><span>{t["inventory.brand"]}</span><select className="field" name="brand" defaultValue={filters.brand ?? ""}><option value="">{t["inventory.allBrands"]}</option>{brands.map((brand) => <option key={brand!}>{brand}</option>)}</select></label>
          <button className="button-primary"><SlidersHorizontal size={17} /> {t["inventory.apply"]}</button>
        </div>
      </form>
      <div className="inventory-results"><p>{motorcycles.length} {t["inventory.result"]}</p>{hasFilters ? <Link href="/admin/motorcycles"><X size={15} /> {t["inventory.clear"]}</Link> : null}</div>
      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {motorcycles.map((motorcycle) => <AdminMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={session.businessSlug} />)}
        {motorcycles.length === 0 ? <div className="card col-span-full p-10 text-center"><p className="font-black">{t["inventory.noMatch"]}</p><p className="mt-1 text-sm text-[#68736c]">{t["inventory.noMatchHint"]}</p></div> : null}
      </div>
    </div>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import { IconMapPin, IconPhone, IconSearch } from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { PublicMotorcycleCard } from "@/components/public-motorcycle-card";
import { getPublicBusiness, listPublicMotorcycles } from "@/data/motorcycles";
import { DomainError } from "@/domain/errors";
import { storefrontThemeAttribute } from "@/domain/storefront-theme";

export default async function StorefrontPage({ params, searchParams }: { params: Promise<{ businessSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const getParam = (key: string) => typeof query[key] === "string" ? query[key] : undefined;
  let business;
  try { business = await getPublicBusiness(businessSlug); } catch (error) { if (error instanceof DomainError && error.code === "NOT_FOUND") notFound(); throw error; }
  const filters = { search: getParam("search"), brand: getParam("brand"), condition: getParam("condition") };
  const [motorcycles, allMotorcycles] = await Promise.all([listPublicMotorcycles(business.id, filters), listPublicMotorcycles(business.id)]);
  const brands = [...new Set(allMotorcycles.map((motorcycle) => motorcycle.brand).filter(Boolean))].sort();

  return (
    <div className="storefront-shell" data-style={storefrontThemeAttribute(business.storefrontTheme)}>
      <header className="public-site-header">
        <div className="public-header-inner">
          <Logo href={`/${business.slug}`} />
          <div className="public-header-actions">
            {business.phone ? <a className="public-call-button" aria-label="Call shop" href={`tel:${business.phone}`}><IconPhone size={20} stroke={1.8} /><span>Call</span></a> : null}
          </div>
        </div>
      </header>

      <section className="public-shop-intro">
        <div className="public-shop-mark">
          {business.logoUrl ? <Image src={business.logoUrl} alt="" width={72} height={72} /> : business.name.slice(0, 2).toUpperCase()}
        </div>
        <div><p>Motorcycles for sale</p><h1>{business.name}</h1>{business.address ? <span><IconMapPin size={17} stroke={1.8} /> {business.address}</span> : null}</div>
      </section>

      <main className="public-main">
        <section className="storefront-hero">
          <div className="storefront-hero-copy"><p>Available in Phnom Penh</p><h2>Find your next motorcycle</h2></div>
          <form className="storefront-search" action={`/${business.slug}`}>
            <label className="storefront-search-field"><IconSearch size={23} stroke={1.7} /><input name="search" placeholder="Search motorcycles" defaultValue={filters.search} /></label>
            <div className="storefront-filters">
              <select name="brand" aria-label="Brand" defaultValue={filters.brand ?? ""}><option value="">All brands</option>{brands.map((brand) => <option key={brand!}>{brand}</option>)}</select>
              <select name="condition" aria-label="Condition" defaultValue={filters.condition ?? ""}><option value="">New & used</option><option value="NEW">New</option><option value="USED">Used</option></select>
              <button>Search</button>
            </div>
          </form>
        </section>

        <section className="inventory-section">
          <div className="inventory-heading"><div><p>Motorcycles for sale</p><h2>Available now</h2></div><span>{motorcycles.length} found</span></div>
          <div className="public-inventory">{motorcycles.map((motorcycle, index) => <PublicMotorcycleCard key={motorcycle.id} motorcycle={motorcycle} businessSlug={business.slug} eager={index === 0} />)}</div>
          {motorcycles.length === 0 ? <div className="public-empty"><h3>No motorcycles found</h3><p>Try another search or check back soon.</p></div> : null}
        </section>
      </main>
    </div>
  );
}

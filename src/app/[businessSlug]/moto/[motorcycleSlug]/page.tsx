import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconArrowLeft, IconBrandFacebook, IconMapPin, IconMessageCircle, IconPhone } from "@tabler/icons-react";
import { notFound } from "next/navigation";

import { ImageGallery } from "@/components/image-gallery";
import { getPublicBusiness, getPublicMotorcycleListing } from "@/data/motorcycles";
import { DomainError } from "@/domain/errors";
import { storefrontThemeAttribute } from "@/domain/storefront-theme";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

type DetailParams = Promise<{ businessSlug: string; motorcycleSlug: string }>;

export async function generateMetadata({ params }: { params: DetailParams }): Promise<Metadata> {
  const { businessSlug, motorcycleSlug } = await params;
  try {
    const motorcycle = await getPublicMotorcycleListing(businessSlug, motorcycleSlug);
    const title = `${displayMotorcycleName(motorcycle.brand, motorcycle.model)} ${motorcycle.year ?? ""}`.trim();
    return { title, description: motorcycle.description ?? `${title} for sale`, openGraph: { images: motorcycle.images[0] ? [motorcycle.images[0].url] : [] } };
  } catch { return { title: "Listing" }; }
}

function contactUrl(value: string, type: "telegram" | "facebook") {
  if (/^https?:\/\//.test(value)) return value;
  const cleaned = value.replace(/^@/, "");
  return type === "telegram" ? `https://t.me/${cleaned}` : `https://facebook.com/${cleaned}`;
}

export default async function PublicMotorcyclePage({ params }: { params: DetailParams }) {
  const { businessSlug, motorcycleSlug } = await params;
  let business;
  let motorcycle;
  try {
    [business, motorcycle] = await Promise.all([getPublicBusiness(businessSlug), getPublicMotorcycleListing(businessSlug, motorcycleSlug)]);
  } catch (error) { if (error instanceof DomainError && error.code === "NOT_FOUND") notFound(); throw error; }
  const title = displayMotorcycleName(motorcycle.brand, motorcycle.model);
  const specifications = [
    ["Year", motorcycle.year], ["Condition", motorcycle.condition === "NEW" ? "New" : "Used"], ["Color", motorcycle.color],
    ["Engine", motorcycle.engineCc ? `${motorcycle.engineCc} cc` : null], ["Transmission", motorcycle.transmission],
    ["Mileage", motorcycle.mileage === null ? null : `${motorcycle.mileage.toLocaleString()} km`], ["Variant", motorcycle.variant],
  ].filter((entry) => entry[1] !== null && entry[1] !== undefined);

  return (
    <div className="listing-shell" data-style={storefrontThemeAttribute(business.storefrontTheme)}>
      <header className="listing-header"><div><Link href={`/${business.slug}`}><IconArrowLeft size={20} /> Back to {business.name}</Link><div className="listing-header-actions">{business.logoUrl ? <Image src={business.logoUrl} alt="" width={40} height={40} /> : null}</div></div></header>
      <main className="listing-main">
        <ImageGallery images={motorcycle.images} title={title} />
        <article className="listing-copy">
          {motorcycle.status !== "AVAILABLE" ? <div className={`public-status-notice status-${motorcycle.status.toLowerCase()}`}><strong>{motorcycle.status === "RESERVED" ? "Reserved" : "Sold"}</strong><span>{motorcycle.status === "RESERVED" ? "This motorcycle is currently reserved." : "This motorcycle has been sold."}</span></div> : null}
          <span className={`condition-chip-static condition-${motorcycle.condition?.toLowerCase()}`}>{motorcycle.condition === "NEW" ? "New" : "Used"}</span>
          <p className="listing-brand">{motorcycle.brand}</p>
          <h1>{motorcycle.model || title}</h1>
          <p className="listing-year">{motorcycle.year}</p>
          <p className="listing-price">{formatPrice(motorcycle.price, motorcycle.currency)}</p>
          {motorcycle.status === "AVAILABLE" ? <div className="listing-contact-grid">
            {business.phone ? <a className="button-primary" href={`tel:${business.phone}`}><IconPhone size={19} /> Call shop</a> : null}
            {business.telegram ? <a className="button-secondary" href={contactUrl(business.telegram, "telegram")} target="_blank"><IconMessageCircle size={19} /> Telegram</a> : null}
            {business.facebook ? <a className="button-secondary is-wide" href={contactUrl(business.facebook, "facebook")} target="_blank"><IconBrandFacebook size={19} /> Facebook / Messenger</a> : null}
          </div> : null}
          {specifications.length > 0 ? <section className="listing-specs"><h2>Motorcycle details</h2><dl>{specifications.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section> : null}
          {motorcycle.description ? <section className="listing-description"><h2>About this motorcycle</h2><p>{motorcycle.description}</p></section> : null}
          {business.address ? <p className="listing-location"><IconMapPin size={19} /> {business.address}</p> : null}
        </article>
      </main>
      {motorcycle.status === "AVAILABLE" ? <div className="listing-mobile-contact">
        {business.phone ? <a className="button-primary" href={`tel:${business.phone}`}><IconPhone size={19} /> Call</a> : <span />}
        {business.telegram ? <a className="button-secondary" href={contactUrl(business.telegram, "telegram")} target="_blank"><IconMessageCircle size={19} /> Telegram</a> : business.facebook ? <a className="button-secondary" href={contactUrl(business.facebook, "facebook")} target="_blank"><IconBrandFacebook size={19} /> Message</a> : null}
      </div> : null}
    </div>
  );
}

import Image from "next/image";
import { IconBike, IconCalendarCheck, IconCheck, IconClock, IconMapPin, IconPhone, IconReceipt, IconShieldCheck, IconTool } from "@tabler/icons-react";

import type { getPublicSaleReceipt } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";
import type { Locale, TranslationDictionary } from "@/i18n/dictionaries";

type ReceiptDetail = Awaited<ReturnType<typeof getPublicSaleReceipt>>;

function longDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === "km" ? "km-KH" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function ReceiptDocument({ receipt, locale, t }: { receipt: ReceiptDetail; locale: Locale; t: TranslationDictionary }) {
  const warrantyActive = receipt.sale.warrantyExpiresAt ? receipt.sale.warrantyExpiresAt >= new Date() : false;
  return (
    <article className="receipt-document card">
      <header className="receipt-brand-row">
        <div className="receipt-shop-mark">{receipt.business.logoUrl ? <Image src={receipt.business.logoUrl} alt="" width={52} height={52} /> : receipt.business.name.slice(0, 2).toUpperCase()}</div>
        <div><p>{t["receipt.official"]}</p><h1>{receipt.business.name}</h1></div>
        <span><IconReceipt size={18} /> #{receipt.sale.id.slice(0, 8).toUpperCase()}</span>
      </header>

      <section className="receipt-hero">
        <div className="receipt-bike-image">{receipt.coverUrl ? <Image src={receipt.coverUrl} alt="" fill sizes="160px" /> : <IconBike size={34} />}</div>
        <div><p>{t["receipt.motorcycle"]}</p><h2>{displayMotorcycleName(receipt.motorcycle.brand, receipt.motorcycle.model)}</h2><span>{[receipt.motorcycle.year, receipt.motorcycle.color, receipt.motorcycle.engineCc ? `${receipt.motorcycle.engineCc}cc` : null].filter(Boolean).join(" · ")}</span></div>
        <strong>{formatPrice(receipt.sale.sellingPrice, receipt.sale.currency)}</strong>
      </section>

      <dl className="receipt-details">
        <div><dt>{t["common.buyer"]}</dt><dd>{receipt.customer?.name ?? "—"}</dd></div>
        <div><dt>{t["common.phone"]}</dt><dd>{receipt.customer?.phone ?? "—"}</dd></div>
        <div><dt>{t["receipt.purchaseDate"]}</dt><dd>{longDate(receipt.sale.soldAt, locale)}</dd></div>
        <div><dt>{t["receipt.payment"]}</dt><dd>{receipt.sale.paymentMethod.replaceAll("_", " ")}</dd></div>
        <div><dt>{t["receipt.listedPrice"]}</dt><dd>{formatPrice(receipt.sale.listedPrice, receipt.sale.currency)}</dd></div>
        <div><dt>{t["receipt.salePrice"]}</dt><dd>{formatPrice(receipt.sale.sellingPrice, receipt.sale.currency)}</dd></div>
      </dl>

      <section className={`warranty-card ${warrantyActive ? "is-active" : ""}`}>
        <span><IconShieldCheck size={24} /></span>
        <div><p>{t["receipt.warranty"]}</p><h3>{receipt.sale.warrantyExpiresAt ? warrantyActive ? t["receipt.active"] : t["receipt.expired"] : t["receipt.noWarranty"]}</h3><small>{receipt.sale.warrantyExpiresAt ? `${warrantyActive ? t["receipt.coverageUntil"] : t["receipt.coverageEnded"]} ${longDate(receipt.sale.warrantyExpiresAt, locale)}` : t["receipt.warrantyContact"]}</small>{receipt.sale.warrantyTerms ? <em>{receipt.sale.warrantyTerms}</em> : null}</div>
        {warrantyActive ? <IconCheck size={20} /> : null}
      </section>

      <section className="service-history">
        <div className="receipt-section-heading"><span><IconTool size={20} /></span><div><p>{t["receipt.serviceBook"]}</p><h2>{t["receipt.serviceHistory"]}</h2></div></div>
        {receipt.serviceRecords.map((record) => <div className="service-record" key={record.id}><span className={`service-record-icon type-${record.type.toLowerCase()}`}><IconTool size={18} /></span><div><div className="service-record-title"><h3>{record.title}</h3><b>{record.type}</b></div><p>{longDate(record.servicedAt, locale)}{record.odometer !== null ? ` · ${record.odometer.toLocaleString()} km` : ""}{record.cost ? ` · ${formatPrice(record.cost, record.currency)}` : ""}</p>{record.description ? <small>{record.description}</small> : null}{record.nextServiceAt ? <em><IconClock size={14} /> {t["receipt.nextService"]}: {longDate(record.nextServiceAt, locale)}</em> : null}</div></div>)}
        {receipt.serviceRecords.length === 0 ? <div className="service-empty"><IconCalendarCheck size={25} /><strong>{t["receipt.noService"]}</strong><p>{t["receipt.noServiceHint"]}</p></div> : null}
      </section>

      <footer className="receipt-footer"><div>{receipt.business.phone ? <a href={`tel:${receipt.business.phone}`}><IconPhone size={15} /> {receipt.business.phone}</a> : null}{receipt.business.address ? <span><IconMapPin size={15} /> {receipt.business.address}</span> : null}</div><p>{t["receipt.privateBook"]}</p></footer>
    </article>
  );
}

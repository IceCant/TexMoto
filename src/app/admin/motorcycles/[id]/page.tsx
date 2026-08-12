import Link from "next/link";
import { IconArrowLeft, IconArrowUpRight, IconBrandFacebook, IconBrandTelegram, IconCheck, IconClock, IconExternalLink, IconPhone, IconReceipt, IconWorld } from "@tabler/icons-react";

import { cancelReservationAction, completeSaleAction, publishFacebookAction, publishTelegramAction, reserveMotorcycleAction } from "@/app/admin/motorcycles/[id]/commerce-actions";
import { changeStatusAction, updateMotorcycleAction } from "@/app/admin/motorcycles/actions";
import { requirePageSession } from "@/auth/page-session";
import { FacebookPublishButton, ReserveForm, SaleForm, TelegramPublishButton } from "@/components/commerce-forms";
import { MotorcycleForm } from "@/components/motorcycle-form";
import { StatusBadge } from "@/components/status-badge";
import { getAdminMotorcycleById } from "@/data/motorcycles";
import { getMotorcycleCommerce, listCustomerOptions } from "@/data/sales";
import { getMotorcycleTelegramPublication, getTelegramIntegrationSummary } from "@/data/telegram";
import { getFacebookIntegrationSummary, getMotorcycleFacebookPublication } from "@/data/facebook";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export default async function MotorcycleDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requirePageSession();
  const { id } = await params;
  const query = await searchParams;
  const [motorcycle, telegram, telegramIntegration, facebook, facebookIntegration, commerce, customerOptions] = await Promise.all([getAdminMotorcycleById(id, session.businessId), getMotorcycleTelegramPublication(id, session.businessId), getTelegramIntegrationSummary(session.businessId), getMotorcycleFacebookPublication(id, session.businessId), getFacebookIntegrationSummary(session.businessId), getMotorcycleCommerce(id, session.businessId), listCustomerOptions(session.businessId)]);
  const updateAction = updateMotorcycleAction.bind(null, motorcycle.id);
  const showSuccess = query.created === "1" || query.updated === "1" || query.telegram === "published" || query.facebook === "published" || query.reserved === "1" || query.sold === "1" || query.reservation === "cancelled";
  const listingUrl = `/${session.businessSlug}/moto/${motorcycle.slug}`;

  return <div>
    <div className="mx-auto mb-5 max-w-3xl">
      <Link href="/admin/motorcycles" className="admin-back"><IconArrowLeft size={18} /> Motorcycles</Link>
      {showSuccess ? <div className="settings-success"><IconCheck size={19} /> Changes saved successfully.</div> : null}
      <div className="motorcycle-title-row"><div><h1>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</h1><div><StatusBadge status={motorcycle.status} /></div></div>{["AVAILABLE", "RESERVED", "SOLD"].includes(motorcycle.status) ? <Link target="_blank" href={listingUrl} className="button-secondary"><span className="hidden sm:inline">Open listing</span><IconArrowUpRight size={18} /></Link> : null}</div>

      <section className="publication-panel card">
        <div className="publication-heading"><div><p className="eyebrow">Publishing</p><h2>Channels</h2></div><div className="publication-links">{telegram?.externalUrl ? <a href={telegram.externalUrl} target="_blank">Telegram <IconExternalLink size={15} /></a> : null}{facebook?.externalUrl ? <a href={facebook.externalUrl} target="_blank">Facebook <IconExternalLink size={15} /></a> : null}</div></div>
        <div className="publication-row"><span className="publication-icon website"><IconWorld size={19} /></span><div><strong>Website</strong><small>{["AVAILABLE", "RESERVED", "SOLD"].includes(motorcycle.status) ? "Published" : "Not published"}</small></div><b className={["AVAILABLE", "RESERVED", "SOLD"].includes(motorcycle.status) ? "is-good" : ""}>{["AVAILABLE", "RESERVED", "SOLD"].includes(motorcycle.status) ? "✓" : "—"}</b></div>
        <div className="publication-row"><span className="publication-icon telegram"><IconBrandTelegram size={19} /></span><div><strong>Telegram</strong><small>{telegram?.status === "PUBLISHED" ? "Published" : telegram?.status === "PENDING" ? "Publishing…" : telegram?.status === "FAILED" ? "Failed" : telegramIntegration?.isEnabled ? "Ready for automatic publishing" : "Not configured"}</small>{telegram?.lastErrorMessage ? <em>{telegram.lastErrorMessage}</em> : null}</div><b className={telegram?.status === "PUBLISHED" ? "is-good" : telegram?.status === "FAILED" ? "is-bad" : ""}>{telegram?.status === "PUBLISHED" ? "✓" : telegram?.status === "FAILED" ? "!" : "—"}</b></div>
        {motorcycle.status === "AVAILABLE" && telegramIntegration?.isEnabled && telegram?.status !== "PUBLISHED" && telegram?.status !== "PENDING" ? <TelegramPublishButton action={publishTelegramAction.bind(null, motorcycle.id)} retry={telegram?.status === "FAILED"} /> : null}
        {!telegramIntegration ? <Link className="publication-setup" href="/admin/settings/integrations/telegram">Configure Telegram publishing</Link> : null}
        <div className="publication-row"><span className="publication-icon facebook"><IconBrandFacebook size={19} /></span><div><strong>Facebook Page</strong><small>{facebook?.status === "PUBLISHED" ? "Published" : facebook?.status === "PENDING" ? "Publishing…" : facebook?.status === "FAILED" ? "Failed" : facebookIntegration?.isEnabled ? "Ready for automatic publishing" : "Not configured"}</small>{facebook?.lastErrorMessage ? <em>{facebook.lastErrorMessage}</em> : null}</div><b className={facebook?.status === "PUBLISHED" ? "is-good" : facebook?.status === "FAILED" ? "is-bad" : ""}>{facebook?.status === "PUBLISHED" ? "✓" : facebook?.status === "FAILED" ? "!" : "—"}</b></div>
        {motorcycle.status === "AVAILABLE" && facebookIntegration?.isEnabled && facebook?.status !== "PUBLISHED" && facebook?.status !== "PENDING" ? <FacebookPublishButton action={publishFacebookAction.bind(null, motorcycle.id)} retry={facebook?.status === "FAILED"} /> : null}
        {!facebookIntegration ? <Link className="publication-setup" href="/admin/settings/integrations/facebook">Configure Facebook publishing</Link> : null}
      </section>

      <section className="commerce-panel">
        {motorcycle.status === "AVAILABLE" ? <div className="commerce-actions"><ReserveForm action={reserveMotorcycleAction.bind(null, id)} /><SaleForm action={completeSaleAction.bind(null, id)} listedPrice={motorcycle.price ?? ""} currency={motorcycle.currency} customers={customerOptions} /><StatusButton id={id} status="HIDDEN" label="Hide" /></div> : null}
        {motorcycle.status === "RESERVED" ? <><div className="reservation-summary card"><span><IconClock size={20} /></span><div><p>Reserved for</p><h3>{commerce.reservation?.customerName}</h3><a href={`tel:${commerce.reservation?.phone}`}><IconPhone size={15} /> {commerce.reservation?.phone}</a></div></div><div className="commerce-actions"><SaleForm action={completeSaleAction.bind(null, id)} listedPrice={motorcycle.price ?? ""} currency={motorcycle.currency} customers={customerOptions} /><form action={cancelReservationAction.bind(null, id)}><button className="button-secondary">Cancel reservation</button></form></div></> : null}
        {motorcycle.status === "SOLD" && commerce.sale ? <div className="sale-summary card"><div className="sale-summary-title"><IconReceipt size={21} /><div><p>Sold</p><h2>{commerce.sale.customer?.name ?? "Buyer not recorded"}</h2>{commerce.sale.customer?.phone ? <a href={`tel:${commerce.sale.customer.phone}`}>{commerce.sale.customer.phone}</a> : null}</div></div><dl><div><dt>Listed price</dt><dd>{formatPrice(commerce.sale.sale.listedPrice, commerce.sale.sale.currency)}</dd></div><div><dt>Selling price</dt><dd>{formatPrice(commerce.sale.sale.sellingPrice, commerce.sale.sale.currency)}</dd></div><div><dt>Sold</dt><dd>{commerce.sale.sale.soldAt.toLocaleDateString("en-GB")}</dd></div><div><dt>Payment</dt><dd>{commerce.sale.sale.paymentMethod.replace("_", " ")}</dd></div></dl>{commerce.sale.customer ? <Link href={`/admin/customers/${commerce.sale.customer.id}`}>View customer</Link> : null}</div> : null}
      </section>
    </div>
    {motorcycle.status !== "SOLD" ? <MotorcycleForm action={updateAction} motorcycle={motorcycle} /> : null}
  </div>;
}

function StatusButton({ id, status, label }: { id: string; status: "AVAILABLE" | "HIDDEN"; label: string }) {
  return <form action={changeStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button className="button-secondary">{label}</button></form>;
}

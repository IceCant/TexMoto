import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { IconArrowLeft, IconExternalLink, IconQrcode } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { ServiceRecordForm } from "@/app/admin/sales/[id]/receipt/service-record-form";
import { ReceiptActions } from "@/components/receipt-actions";
import { ReceiptDocument } from "@/components/receipt-document";
import { getSaleReceiptById } from "@/data/sales";
import { DomainError } from "@/domain/errors";
import { parseReceiptIdentifier } from "@/domain/receipt";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Sales receipt" };

async function loadReceipt(idValue: string, businessId: string) {
  try {
    return await getSaleReceiptById(parseReceiptIdentifier(idValue), businessId);
  } catch (error) {
    if (error instanceof DomainError) notFound();
    throw error;
  }
}

export default async function AdminReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageSession();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { id: idValue } = await params;
  const receipt = await loadReceipt(idValue, session.businessId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const receiptUrl = new URL(`/receipt/${receipt.sale.receiptAccessToken}`, appUrl).toString();
  const qrCode = await QRCode.toDataURL(receiptUrl, { errorCorrectionLevel: "M", margin: 2, width: 360, color: { dark: "#12203a", light: "#ffffff" } });
  const isLocalUrl = new URL(receiptUrl).hostname === "localhost";
  const actionLabels = { share: t["receipt.share"], print: t["receipt.print"], sms: t["receipt.sms"], whatsapp: t["receipt.whatsapp"], telegram: t["receipt.telegram"], message: t["receipt.title"] };
  return <div className="receipt-admin-page"><Link href="/admin/sales" className="admin-back no-print"><IconArrowLeft size={18} /> {t["sales.title"]}</Link><div className="receipt-admin-toolbar no-print"><div><p className="eyebrow">{t["receipt.customerHandoff"]}</p><h1>{t["receipt.title"]}</h1><p>{t["receipt.handoffHint"]}</p></div><ReceiptActions receiptUrl={receiptUrl} customerPhone={receipt.customer?.phone ?? null} labels={actionLabels} compact /></div><section className="receipt-scan-card card no-print"><Image src={qrCode} alt="QR code to open the customer receipt" width={180} height={180} unoptimized /><div><span><IconQrcode size={20} /></span><h2>{t["receipt.scan"]}</h2><p>{t["receipt.scanHint"]}</p><a href={receiptUrl} target="_blank">{t["receipt.openCustomer"]} <IconExternalLink size={15} /></a>{isLocalUrl ? <small>{t["receipt.localHint"]}</small> : null}</div></section><ReceiptDocument receipt={receipt} locale={locale} t={t} /><div className="no-print"><ServiceRecordForm saleId={receipt.sale.id} today={new Date().toISOString().slice(0, 10)} t={t} /></div></div>;
}

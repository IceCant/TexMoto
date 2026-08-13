import { notFound } from "next/navigation";

import { Logo } from "@/components/logo";
import { ReceiptActions } from "@/components/receipt-actions";
import { ReceiptDocument } from "@/components/receipt-document";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getPublicSaleReceipt } from "@/data/sales";
import { DomainError } from "@/domain/errors";
import { parseReceiptIdentifier } from "@/domain/receipt";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Motorcycle receipt", robots: { index: false, follow: false } };

async function loadReceipt(tokenValue: string) {
  try {
    const token = parseReceiptIdentifier(tokenValue);
    return { token, receipt: await getPublicSaleReceipt(token) };
  } catch (error) {
    if (error instanceof DomainError) notFound();
    throw error;
  }
}

export default async function PublicReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: tokenValue } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { token, receipt } = await loadReceipt(tokenValue);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const receiptUrl = new URL(`/receipt/${token}`, appUrl).toString();
  const actionLabels = { share: t["receipt.share"], print: t["receipt.print"], sms: t["receipt.sms"], whatsapp: t["receipt.whatsapp"], telegram: t["receipt.telegram"], message: t["receipt.title"] };
  return <main className="public-receipt-page"><header className="public-receipt-header no-print"><Logo href={`/${receipt.business.slug}`} /><div><LocaleSwitcher locale={locale} compact /><span>{t["receipt.private"]}</span></div></header><div className="public-receipt-intro no-print"><p className="eyebrow">{t["receipt.yourMotorcycle"]}</p><h1>{t["receipt.title"]}</h1><p>{t["receipt.customerHint"]}</p><ReceiptActions receiptUrl={receiptUrl} customerPhone={receipt.customer?.phone ?? null} labels={actionLabels} /></div><ReceiptDocument receipt={receipt} locale={locale} t={t} /><p className="receipt-privacy no-print">{t["receipt.privacy"]}</p></main>;
}

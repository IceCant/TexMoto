"use client";

import { IconBrandTelegram, IconBrandWhatsapp, IconMessage, IconPrinter, IconShare3 } from "@tabler/icons-react";

function cambodianWhatsAppNumber(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `855${digits.slice(1)}`;
  return digits;
}

type ReceiptActionLabels = { share: string; print: string; sms: string; whatsapp: string; telegram: string; message: string };

export function ReceiptActions({ receiptUrl, customerPhone, labels, compact = false }: { receiptUrl: string; customerPhone: string | null; labels: ReceiptActionLabels; compact?: boolean }) {
  const message = `${labels.message}: ${receiptUrl}`;
  const whatsappNumber = cambodianWhatsAppNumber(customerPhone);

  async function shareReceipt() {
    if (navigator.share) {
      await navigator.share({ title: "Motorcycle receipt", text: "Your motorcycle receipt, warranty, and service history", url: receiptUrl });
      return;
    }
    await navigator.clipboard.writeText(receiptUrl);
    window.alert("Receipt link copied.");
  }

  return (
    <div className={compact ? "receipt-actions is-compact" : "receipt-actions"}>
      <button className="button-primary" type="button" onClick={shareReceipt}><IconShare3 size={18} /> {labels.share}</button>
      <button className="button-secondary" type="button" onClick={() => window.print()}><IconPrinter size={18} /> {labels.print}</button>
      {customerPhone ? <a className="button-secondary" href={`sms:${customerPhone}?body=${encodeURIComponent(message)}`}><IconMessage size={18} /> {labels.sms}</a> : null}
      {whatsappNumber ? <a className="button-secondary" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} target="_blank"><IconBrandWhatsapp size={18} /> {labels.whatsapp}</a> : null}
      <a className="button-secondary" href={`https://t.me/share/url?url=${encodeURIComponent(receiptUrl)}&text=${encodeURIComponent(labels.message)}`} target="_blank"><IconBrandTelegram size={18} /> {labels.telegram}</a>
    </div>
  );
}

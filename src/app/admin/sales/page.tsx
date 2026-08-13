import Image from "next/image";
import Link from "next/link";
import { IconBike, IconReceipt } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { listSales } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const session = await requirePageSession();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const rows = await listSales(session.businessId);
  return <div className="max-w-4xl"><p className="eyebrow">{t["sales.history"]}</p><h1 className="admin-page-title">{t["sales.title"]}</h1><p className="admin-page-subtitle">{t["sales.subtitle"]}</p><div className="sales-list">{rows.map(({ sale, motorcycle, customer, coverUrl }) => <Link className="sales-card card" href={`/admin/sales/${sale.id}/receipt`} key={sale.id}>{coverUrl ? <Image src={coverUrl} alt="" width={112} height={84} /> : <span className="purchase-placeholder"><IconBike /></span>}<div><h2>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</h2><p>{customer?.name ?? t["common.buyer"]} · {sale.soldAt.toLocaleDateString(locale === "km" ? "km-KH" : "en-GB")}</p><small><IconReceipt size={13} /> {t["sales.openReceipt"]}</small></div><strong>{formatPrice(sale.sellingPrice, sale.currency)}</strong></Link>)}{rows.length === 0 ? <div className="card empty-state"><IconReceipt size={28} /><h2>{t["sales.empty"]}</h2><p>{t["sales.emptyHint"]}</p></div> : null}</div></div>;
}

import Image from "next/image";
import Link from "next/link";
import { IconBike, IconReceipt } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { listSales } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const session = await requirePageSession();
  const rows = await listSales(session.businessId);
  return <div className="max-w-4xl"><p className="eyebrow">History</p><h1 className="admin-page-title">Sales</h1><p className="admin-page-subtitle">Completed motorcycle sales and buyer records.</p><div className="sales-list">{rows.map(({ sale, motorcycle, customer, coverUrl }) => <Link className="sales-card card" href={`/admin/motorcycles/${motorcycle.id}`} key={sale.id}>{coverUrl ? <Image src={coverUrl} alt="" width={112} height={84} /> : <span className="purchase-placeholder"><IconBike /></span>}<div><h2>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</h2><p>{customer?.name ?? "Buyer not recorded"} · {sale.soldAt.toLocaleDateString("en-GB")}</p><small>{sale.paymentMethod.replace("_", " ")}</small></div><strong>{formatPrice(sale.sellingPrice, sale.currency)}</strong></Link>)}{rows.length === 0 ? <div className="card empty-state"><IconReceipt size={28} /><h2>No sales yet</h2><p>Completed motorcycle sales appear here.</p></div> : null}</div></div>;
}

import Image from "next/image";
import Link from "next/link";
import { IconArrowLeft, IconBike, IconPhone } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { getCustomerDetail } from "@/data/sales";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePageSession();
  const { id } = await params;
  const { customer, purchases, reservations } = await getCustomerDetail(id, session.businessId);
  return <div className="max-w-3xl"><Link href="/admin/customers" className="admin-back"><IconArrowLeft size={18} /> Customers</Link><section className="customer-profile card"><div className="customer-avatar">{customer.name.slice(0, 2).toUpperCase()}</div><div><h1>{customer.name}</h1><a href={`tel:${customer.phone}`}><IconPhone size={16} /> {customer.phone}</a>{customer.telegramUsername ? <p>@{customer.telegramUsername.replace(/^@/, "")}</p> : null}</div></section><section className="customer-history"><div><p className="eyebrow">Ownership</p><h2>Motorcycles purchased</h2></div>{purchases.map(({ sale, motorcycle, coverUrl }) => <Link className="purchase-card card" href={`/admin/sales/${sale.id}/receipt`} key={sale.id}>{coverUrl ? <Image src={coverUrl} alt="" width={112} height={84} /> : <span className="purchase-placeholder"><IconBike /></span>}<div><h3>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</h3><p>{motorcycle.year} · Purchased {sale.soldAt.toLocaleDateString("en-GB")}</p><strong>{formatPrice(sale.sellingPrice, sale.currency)}</strong><small>Receipt, warranty & service history</small></div></Link>)}{purchases.length === 0 ? <p className="muted-copy">No purchases yet.</p> : null}</section>{reservations.length > 0 ? <section className="customer-history"><h2>Reservation history</h2>{reservations.map(({ reservation, motorcycle }) => <div className="reservation-history card" key={reservation.id}><div><strong>{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</strong><small>{reservation.reservedAt.toLocaleDateString("en-GB")}</small></div><span>{reservation.status}</span></div>)}</section> : null}{customer.notes ? <section className="card customer-notes"><h2>Notes</h2><p>{customer.notes}</p></section> : null}</div>;
}

import Link from "next/link";
import { IconChevronRight, IconSearch, IconUsers } from "@tabler/icons-react";

import { requirePageSession } from "@/auth/page-session";
import { listCustomers } from "@/data/sales";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const [session, query] = await Promise.all([requirePageSession(), searchParams]);
  const rows = await listCustomers(session.businessId, query.search);
  return <div className="max-w-3xl"><p className="eyebrow">People</p><h1 className="admin-page-title">Customers</h1><p className="admin-page-subtitle">Buyers and their motorcycle history.</p><form className="admin-search"><IconSearch size={19} /><input name="search" placeholder="Search name or phone" defaultValue={query.search} /><button>Search</button></form><div className="customer-list">{rows.map(({ customer, purchaseCount, mostRecentPurchase }) => <Link className="customer-card card" href={`/admin/customers/${customer.id}`} key={customer.id}><span><IconUsers size={20} /></span><div><h2>{customer.name}</h2><p>{customer.phone}</p><small>{purchaseCount} purchased{mostRecentPurchase ? ` · latest ${new Date(mostRecentPurchase).toLocaleDateString("en-GB")}` : ""}</small></div><IconChevronRight size={20} /></Link>)}{rows.length === 0 ? <div className="card empty-state"><IconUsers size={28} /><h2>No customers found</h2><p>Customers appear here when you complete a sale.</p></div> : null}</div></div>;
}

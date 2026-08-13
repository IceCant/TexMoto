"use client";

import { useActionState, useState } from "react";
import { IconBrandFacebook, IconBrandTelegram, IconCalendar, IconCash, IconChevronDown, IconUser } from "@tabler/icons-react";

import type { Customer } from "@/db/schema";
import type { CommerceActionState } from "@/app/admin/motorcycles/[id]/commerce-actions";

const initialState: CommerceActionState = {};

export function TelegramPublishButton({ action, retry }: { action: (state: CommerceActionState) => Promise<CommerceActionState>; retry?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction}>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}<button className="button-primary w-full" disabled={pending}><IconBrandTelegram size={19} /> {pending ? "Publishing…" : retry ? "Retry Telegram" : "Publish to Telegram"}</button></form>;
}

export function FacebookPublishButton({ action, retry }: { action: (state: CommerceActionState) => Promise<CommerceActionState>; retry?: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction}>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}<button className="button-primary w-full" disabled={pending}><IconBrandFacebook size={19} /> {pending ? "Publishing…" : retry ? "Retry Facebook" : "Publish to Facebook"}</button></form>;
}

export function ReserveForm({ action }: { action: (state: CommerceActionState, formData: FormData) => Promise<CommerceActionState> }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  if (!open) return <button className="button-secondary" onClick={() => setOpen(true)}><IconCalendar size={18} /> Reserve</button>;
  return <form action={formAction} className="commerce-form card"><div className="commerce-form-heading"><h3>Reserve motorcycle</h3><button type="button" onClick={() => setOpen(false)}>Cancel</button></div>{state.error ? <p className="form-error">{state.error}</p> : null}<div className="form-grid"><label><span>Name</span><input className="field" name="customerName" required /></label><label><span>Phone</span><input className="field" name="phone" inputMode="tel" required /></label><label><span>Expires (optional)</span><input className="field" name="expiresAt" type="datetime-local" /></label><label><span>Notes (optional)</span><input className="field" name="notes" /></label></div><button className="button-primary" disabled={pending}>{pending ? "Reserving…" : "Confirm reservation"}</button></form>;
}

export function SaleForm({ action, listedPrice, currency, customers }: { action: (state: CommerceActionState, formData: FormData) => Promise<CommerceActionState>; listedPrice: string; currency: string; customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [useExisting, setUseExisting] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  if (!open) return <button className="button-primary" onClick={() => setOpen(true)}><IconCash size={18} /> Complete sale</button>;
  return <form action={formAction} className="commerce-form card"><div className="commerce-form-heading"><div><p>Mark as sold</p><h3>Complete sale</h3></div><button type="button" onClick={() => setOpen(false)}>Cancel</button></div>{state.error ? <p className="form-error">{state.error}</p> : null}<div className="sale-listed"><span>Listed price</span><strong>{listedPrice} {currency}</strong></div><div className="buyer-toggle"><button type="button" className={!useExisting ? "is-active" : ""} onClick={() => setUseExisting(false)}>+ New customer</button><button type="button" className={useExisting ? "is-active" : ""} onClick={() => setUseExisting(true)}>Existing customer</button></div>{useExisting ? <label><span>Customer</span><div className="select-wrap"><select className="field" name="existingCustomerId" required><option value="">Choose customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select><IconChevronDown size={18} /></div></label> : <div className="form-grid"><label><span>Name</span><input className="field" name="name" required /></label><label><span>Phone</span><input className="field" name="phone" inputMode="tel" required /></label><label className="full"><span>Telegram (optional)</span><input className="field" name="telegramUsername" /></label></div>}<div className="form-grid"><label><span>Selling price</span><input className="field" name="sellingPrice" type="number" min="0.01" step="0.01" defaultValue={listedPrice} required /></label><label><span>Payment</span><select className="field" name="paymentMethod" defaultValue="CASH"><option value="CASH">Cash</option><option value="KHQR">KHQR</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></label><label><span>Warranty</span><select className="field" name="warrantyMonths" defaultValue="0"><option value="0">No warranty</option><option value="1">1 month</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="24">24 months</option></select></label><label><span>Warranty terms <small>(optional)</small></span><input className="field" name="warrantyTerms" placeholder="Engine and gearbox only" /></label><label className="full"><span>Internal sale notes <small>(optional)</small></span><textarea className="field" name="notes" rows={3} /></label></div><button className="button-primary" disabled={pending}><IconUser size={18} /> {pending ? "Completing…" : "Complete sale & create receipt"}</button></form>;
}

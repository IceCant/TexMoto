"use client";

import { useActionState } from "react";
import { IconPlus, IconTool } from "@tabler/icons-react";

import { addServiceRecordAction, type ServiceRecordActionState } from "@/app/admin/sales/[id]/receipt/actions";
import type { TranslationDictionary } from "@/i18n/dictionaries";

const initialState: ServiceRecordActionState = {};

export function ServiceRecordForm({ saleId, today, t }: { saleId: string; today: string; t: TranslationDictionary }) {
  const [state, action, pending] = useActionState(addServiceRecordAction.bind(null, saleId), initialState);
  return (
    <details className="service-admin card" open={Boolean(state.error)}>
      <summary><span><IconPlus size={18} /></span><div><strong>{t["service.add"]}</strong><small>{t["service.addHint"]}</small></div></summary>
      <form action={action} className="service-form">
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
        <div className="form-grid">
          <label><span>{t["service.type"]}</span><select className="field" name="type" defaultValue="MAINTENANCE"><option value="MAINTENANCE">{t["service.maintenance"]}</option><option value="REPAIR">{t["service.repair"]}</option><option value="WARRANTY">{t["service.warranty"]}</option><option value="INSPECTION">{t["service.inspection"]}</option></select></label>
          <label><span>{t["service.date"]}</span><input className="field" type="date" name="servicedAt" defaultValue={today} required /></label>
          <label className="full"><span>{t["service.title"]}</span><input className="field" name="title" placeholder={t["service.titlePlaceholder"]} required /></label>
          <label><span>{t["service.odometer"]} <small>({t["common.optional"]})</small></span><input className="field" type="number" min="0" name="odometer" inputMode="numeric" placeholder="12000" /></label>
          <label><span>{t["service.next"]} <small>({t["common.optional"]})</small></span><input className="field" type="date" name="nextServiceAt" /></label>
          <label><span>{t["service.cost"]} <small>({t["common.optional"]})</small></span><input className="field" type="number" min="0" step="0.01" name="cost" inputMode="decimal" /></label>
          <label><span>{t["common.currency"]}</span><select className="field" name="currency" defaultValue="USD"><option value="USD">USD</option><option value="KHR">KHR</option></select></label>
          <label className="full"><span>{t["service.notes"]} <small>({t["common.optional"]})</small></span><textarea className="field" name="description" rows={3} placeholder={t["service.notesPlaceholder"]} /></label>
        </div>
        <button className="button-primary" disabled={pending}><IconTool size={18} /> {pending ? t["common.saving"] : t["service.save"]}</button>
      </form>
    </details>
  );
}

"use client";

import { useActionState } from "react";
import { IconBrandFacebook, IconPlugConnected, IconShieldLock } from "@tabler/icons-react";

import { saveFacebookSettingsAction, testFacebookConnectionAction, type FacebookSettingsState } from "@/app/admin/settings/integrations/facebook/actions";
import { CaptionTemplateField } from "@/components/caption-template-field";

const initialState: FacebookSettingsState = {};

export function FacebookSettingsForm({ integration }: { integration: { pageId: string; pageName: string | null; captionTemplate: string | null; isEnabled: boolean } | null }) {
  const [saveState, saveAction, isSaving] = useActionState(saveFacebookSettingsAction, initialState);
  const [testState, testAction, isTesting] = useActionState(testFacebookConnectionAction, initialState);
  return (
    <div className="card integration-card">
      <div className="integration-heading"><span className="facebook"><IconBrandFacebook size={24} /></span><div><h1>Facebook Page</h1><p>Automatically publish available motorcycles to your shop Page.</p></div></div>
      <div className="integration-security"><IconShieldLock size={19} /><p>Your Page token is encrypted before storage and is never shown again.</p></div>
      {(saveState.error || testState.error) ? <p className="form-error" role="alert">{saveState.error || testState.error}</p> : null}
      {testState.success ? <p className="form-success" role="status">{testState.success}</p> : null}
      <form action={saveAction} className="integration-form">
        <label><span>Page access token</span><input className="field" name="pageAccessToken" type="password" autoComplete="new-password" placeholder={integration ? "Leave blank to keep the saved token" : "Paste the Page access token"} required={!integration} /></label>
        <label><span>Facebook Page ID</span><input className="field" name="pageId" inputMode="numeric" defaultValue={integration?.pageId} placeholder="123456789012345" required /></label>
        <label><span>Page name <small>(optional)</small></span><input className="field" name="pageName" defaultValue={integration?.pageName ?? ""} placeholder="Sokha Moto" /></label>
        <CaptionTemplateField defaultValue={integration?.captionTemplate} />
        <label className="integration-toggle"><input name="isEnabled" type="checkbox" defaultChecked={integration?.isEnabled} /><span><strong>Automatically publish to Facebook</strong><small>Posts when a motorcycle becomes available on the website.</small></span></label>
        <button className="button-primary" disabled={isSaving}>{isSaving ? "Saving…" : "Save configuration"}</button>
      </form>
      {integration ? <form action={testAction} className="integration-test"><button className="button-secondary" disabled={isTesting}><IconPlugConnected size={19} /> {isTesting ? "Testing…" : "Test connection"}</button></form> : null}
    </div>
  );
}

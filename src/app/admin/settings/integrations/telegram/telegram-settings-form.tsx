"use client";

import { useActionState } from "react";
import { IconBrandTelegram, IconPlugConnected, IconShieldLock } from "@tabler/icons-react";

import { saveTelegramSettingsAction, testTelegramConnectionAction, type TelegramSettingsState } from "@/app/admin/settings/integrations/telegram/actions";
import { CaptionTemplateField } from "@/components/caption-template-field";

const initialState: TelegramSettingsState = {};

export function TelegramSettingsForm({ integration }: { integration: { channelId: string; captionTemplate: string | null; isEnabled: boolean } | null }) {
  const [saveState, saveAction, isSaving] = useActionState(saveTelegramSettingsAction, initialState);
  const [testState, testAction, isTesting] = useActionState(testTelegramConnectionAction, initialState);
  return (
    <div className="card integration-card">
      <div className="integration-heading"><span><IconBrandTelegram size={24} /></span><div><h1>Telegram channel</h1><p>Publish available motorcycles directly to your shop channel.</p></div></div>
      <div className="integration-security"><IconShieldLock size={19} /><p>Your bot token is encrypted before storage and is never shown again.</p></div>
      {(saveState.error || testState.error) ? <p className="form-error" role="alert">{saveState.error || testState.error}</p> : null}
      {testState.success ? <p className="form-success" role="status">{testState.success}</p> : null}
      <form action={saveAction} className="integration-form">
        <label><span>Bot token</span><input className="field" name="botToken" type="password" autoComplete="new-password" placeholder={integration ? "Leave blank to keep the saved token" : "123456:ABC..."} required={!integration} /></label>
        <label><span>Channel ID or username</span><input className="field" name="channelId" defaultValue={integration?.channelId} placeholder="@texmoto or -100..." required /></label>
        <CaptionTemplateField defaultValue={integration?.captionTemplate} />
        <label className="integration-toggle"><input name="isEnabled" type="checkbox" defaultChecked={integration?.isEnabled} /><span><strong>Automatically publish to Telegram</strong><small>Posts when a motorcycle becomes available on the website.</small></span></label>
        <button className="button-primary" disabled={isSaving}>{isSaving ? "Saving…" : "Save configuration"}</button>
      </form>
      {integration ? <form action={testAction} className="integration-test"><button className="button-secondary" disabled={isTesting}><IconPlugConnected size={19} /> {isTesting ? "Testing…" : "Test connection"}</button></form> : null}
    </div>
  );
}

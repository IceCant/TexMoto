import Link from "next/link";
import {
  IconBolt,
  IconBuildingStore,
  IconCheck,
  IconExternalLink,
  IconLanguage,
  IconLayoutGrid,
  IconNews,
  IconBrandTelegram,
  IconBrandFacebook,
  IconChevronRight,
} from "@tabler/icons-react";

import { setStorefrontThemeAction } from "@/app/admin/actions";
import { setLocaleAction } from "@/i18n/actions";
import { requirePageSession } from "@/auth/page-session";
import type { StorefrontTheme } from "@/domain/storefront-theme";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getFacebookIntegrationSummary } from "@/data/facebook";
import { getTelegramIntegrationSummary } from "@/data/telegram";

export const metadata = { title: "Settings" };

const themeOptions: Array<{
  value: StorefrontTheme;
  name: string;
  description: string;
  strengths: string;
  icon: typeof IconLayoutGrid;
}> = [
  {
    value: "MARKETPLACE",
    name: "Blue marketplace",
    description: "Bold search-led storefront with clear inventory rows.",
    strengths: "Best all-round choice",
    icon: IconLayoutGrid,
  },
  {
    value: "EDITORIAL",
    name: "Editorial garage",
    description: "Premium image-led layout with a quieter, refined feel.",
    strengths: "Best for curated stock",
    icon: IconNews,
  },
  {
    value: "LOCAL",
    name: "Fast local dealer",
    description: "Compact cards and quick scanning for everyday buyers.",
    strengths: "Best for larger inventory",
    icon: IconBolt,
  },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const [session, locale, query] = await Promise.all([requirePageSession(), getLocale(), searchParams]);
  const t = getDictionary(locale);
  const [telegram, facebook] = await Promise.all([getTelegramIntegrationSummary(session.businessId), getFacebookIntegrationSummary(session.businessId)]);
  const wasSaved = query.style === "saved";

  return (
    <div className="settings-page max-w-3xl">
      <div className="settings-title-row">
        <div><p className="eyebrow">{t["settings.workspace"]}</p><h1>{t["settings.title"]}</h1><p>{t["settings.subtitle"]}</p></div>
        <Link className="button-secondary settings-preview-link" href={`/${session.businessSlug}`} target="_blank"><IconExternalLink size={18} /> {t["settings.viewStorefront"]}</Link>
      </div>

      {wasSaved ? <div className="settings-success" role="status"><IconCheck size={19} /> Storefront style updated.</div> : null}

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconBuildingStore size={21} /></span><div><h2>{t["settings.shop"]}</h2><p>{t["settings.shopHint"]}</p></div></div>
        <dl className="settings-details"><div><dt>{t["settings.shopName"]}</dt><dd>{session.businessName}</dd></div><div><dt>{t["settings.publicAddress"]}</dt><dd><Link href={`/${session.businessSlug}`} target="_blank">texmoto.com/{session.businessSlug}</Link></dd></div></dl>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconBrandTelegram size={21} /></span><div><h2>{t["settings.integrations"]}</h2><p>{t["settings.integrationsHint"]}</p></div></div>
        <Link className="settings-integration-link" href="/admin/settings/integrations/telegram"><span className="settings-integration-brand"><span><IconBrandTelegram size={20} /></span><span><strong>Telegram</strong><small>{t["settings.channelPublishing"]}</small></span></span><span className={`integration-status ${telegram?.isEnabled ? "is-connected" : ""}`}>{telegram?.isEnabled ? t["settings.active"] : telegram ? t["settings.paused"] : t["settings.setup"]}</span><IconChevronRight size={18} /></Link>
        <Link className="settings-integration-link" href="/admin/settings/integrations/facebook"><span className="settings-integration-brand"><span><IconBrandFacebook size={20} /></span><span><strong>Facebook Page</strong><small>{t["settings.pagePublishing"]}</small></span></span><span className={`integration-status ${facebook?.isEnabled ? "is-connected" : ""}`}>{facebook?.isEnabled ? t["settings.active"] : facebook ? t["settings.paused"] : t["settings.setup"]}</span><IconChevronRight size={18} /></Link>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconLayoutGrid size={21} /></span><div><h2>{t["settings.style"]}</h2><p>{t["settings.styleHint"]}</p></div></div>
        <form action={setStorefrontThemeAction}>
          <fieldset className="theme-options">
            <legend className="sr-only">Storefront style</legend>
            {themeOptions.map(({ value, name, description, strengths, icon: Icon }) => (
              <label className="theme-option" key={value}>
                <input type="radio" name="storefrontTheme" value={value} defaultChecked={session.storefrontTheme === value} />
                <span className="theme-option-icon"><Icon size={22} stroke={1.8} /></span>
                <span className="theme-option-copy"><strong>{name}</strong><small>{description}</small><em>{strengths}</em></span>
                <span className="theme-option-check"><IconCheck size={17} /></span>
              </label>
            ))}
          </fieldset>
          <div className="settings-form-footer"><p>{t["settings.styleFooter"]}</p><button className="button-primary" type="submit">{t["settings.saveStyle"]}</button></div>
        </form>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconLanguage size={21} /></span><div><h2>{t["settings.language"]}</h2><p>{t["settings.languageHint"]}</p></div></div>
        <form action={setLocaleAction} className="settings-language"><button className={locale === "en" ? "button-primary" : "button-secondary"} name="locale" value="en">English</button><button className={locale === "km" ? "button-primary" : "button-secondary"} name="locale" value="km">ខ្មែរ</button></form>
      </section>
    </div>
  );
}

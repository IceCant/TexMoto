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
} from "@tabler/icons-react";

import { setLocaleAction, setStorefrontThemeAction } from "@/app/admin/actions";
import { requirePageSession } from "@/auth/page-session";
import type { StorefrontTheme } from "@/domain/storefront-theme";
import { getLocale } from "@/i18n/server";

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
  const wasSaved = query.style === "saved";

  return (
    <div className="settings-page max-w-3xl">
      <div className="settings-title-row">
        <div><p className="eyebrow">Workspace</p><h1>Settings</h1><p>Manage how your team works and how customers see your shop.</p></div>
        <Link className="button-secondary settings-preview-link" href={`/${session.businessSlug}`} target="_blank"><IconExternalLink size={18} /> View storefront</Link>
      </div>

      {wasSaved ? <div className="settings-success" role="status"><IconCheck size={19} /> Storefront style updated.</div> : null}

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconBuildingStore size={21} /></span><div><h2>Shop</h2><p>Your public business identity.</p></div></div>
        <dl className="settings-details"><div><dt>Shop name</dt><dd>{session.businessName}</dd></div><div><dt>Public address</dt><dd><Link href={`/${session.businessSlug}`} target="_blank">texmoto.com/{session.businessSlug}</Link></dd></div></dl>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconBrandTelegram size={21} /></span><div><h2>Integrations</h2><p>Connect external channels without affecting normal inventory management.</p></div></div>
        <Link className="settings-integration-link" href="/admin/settings/integrations/telegram"><span><IconBrandTelegram size={20} /><strong>Telegram</strong></span><small>Configure bot and channel publishing</small></Link>
        <Link className="settings-integration-link" href="/admin/settings/integrations/facebook"><span><IconBrandFacebook size={20} /><strong>Facebook Page</strong></span><small>Configure automatic Page publishing</small></Link>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconLayoutGrid size={21} /></span><div><h2>Storefront style</h2><p>Choose one design for every customer visiting your shop.</p></div></div>
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
          <div className="settings-form-footer"><p>The selected style also applies to motorcycle detail pages.</p><button className="button-primary" type="submit">Save storefront style</button></div>
        </form>
      </section>

      <section className="card settings-section">
        <div className="settings-section-heading"><span><IconLanguage size={21} /></span><div><h2>Language</h2><p>Choose the admin interface language for this browser.</p></div></div>
        <form action={setLocaleAction} className="settings-language"><button className={locale === "en" ? "button-primary" : "button-secondary"} name="locale" value="en">English</button><button className={locale === "km" ? "button-primary" : "button-secondary"} name="locale" value="km">ខ្មែរ</button></form>
      </section>
    </div>
  );
}

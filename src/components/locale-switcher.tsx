import { setLocaleAction } from "@/i18n/actions";
import type { Locale } from "@/i18n/dictionaries";

export function LocaleSwitcher({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return <form action={setLocaleAction} className={compact ? "locale-switcher is-compact" : "locale-switcher"} aria-label="Language"><button className={locale === "en" ? "is-active" : ""} name="locale" value="en">EN</button><button className={locale === "km" ? "is-active" : ""} name="locale" value="km">ខ្មែរ</button></form>;
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createMotorcycleAction } from "@/app/admin/motorcycles/actions";
import { MotorcycleForm } from "@/components/motorcycle-form";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocale } from "@/i18n/server";

export const metadata = { title: "Add motorcycle" };

export default async function NewMotorcyclePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return (
    <div>
      <div className="mx-auto mb-5 max-w-3xl"><Link href="/admin/motorcycles" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"><ArrowLeft size={18} /> {t["nav.motorcycles"]}</Link><h1 className="mt-2 text-3xl font-black tracking-tight">{t["motorcycle.addTitle"]}</h1><p className="mt-2 text-sm text-[#68736c]">{t["motorcycle.addHint"]}</p></div>
      <MotorcycleForm action={createMotorcycleAction} locale={locale} />
    </div>
  );
}

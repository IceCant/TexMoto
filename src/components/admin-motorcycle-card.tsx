import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { MotorcycleWithImages } from "@/data/motorcycles";
import { displayMotorcycleName, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export function AdminMotorcycleCard({ motorcycle, businessSlug }: { motorcycle: MotorcycleWithImages; businessSlug: string }) {
  return (
    <article className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-[#ece9e1] sm:h-28 sm:w-36">
        {motorcycle.images[0] ? <Image src={motorcycle.images[0].url} alt="" fill sizes="144px" className="object-cover" /> : <div className="grid h-full place-items-center text-xs font-medium text-[#68736c]">No photo</div>}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="truncate font-black">{displayMotorcycleName(motorcycle.brand, motorcycle.model)}</h3><p className="mt-1 text-sm text-[#68736c]">{motorcycle.year ?? "Year not set"}</p></div>
          <StatusBadge status={motorcycle.status} />
        </div>
        <p className="mt-3 font-black text-[#1f6b4f]">{formatPrice(motorcycle.price, motorcycle.currency)}</p>
        <div className="mt-3 flex gap-4 text-sm font-bold">
          <Link href={`/admin/motorcycles/${motorcycle.id}`}>Edit</Link>
          {motorcycle.status === "AVAILABLE" ? <Link className="inline-flex items-center gap-1 text-[#d75d2a]" href={`/${businessSlug}/moto/${motorcycle.slug}`} target="_blank">Public <ArrowUpRight size={14} /></Link> : null}
        </div>
      </div>
    </article>
  );
}


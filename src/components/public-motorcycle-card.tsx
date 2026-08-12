import Image from "next/image";
import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

import type { MotorcycleWithImages } from "@/data/motorcycles";
import { displayMotorcycleName, formatPrice } from "@/lib/format";

export function PublicMotorcycleCard({ motorcycle, businessSlug, eager = false }: { motorcycle: MotorcycleWithImages; businessSlug: string; eager?: boolean }) {
  const name = displayMotorcycleName(motorcycle.brand, motorcycle.model);
  return (
    <Link href={`/${businessSlug}/moto/${motorcycle.slug}`} className="public-moto-card">
      <div className="public-moto-image">
        {motorcycle.images[0] ? (
          <Image src={motorcycle.images[0].url} alt={name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" loading={eager ? "eager" : "lazy"} />
        ) : null}
        <span className={`condition-chip condition-${motorcycle.condition?.toLowerCase()}`}>{motorcycle.condition === "NEW" ? "New" : "Used"}</span>
      </div>
      <div className="public-moto-copy">
        <p className="moto-brand">{motorcycle.brand}</p>
        <h2>{motorcycle.model || name}</h2>
        <p className="moto-meta">{motorcycle.year}{motorcycle.color ? ` · ${motorcycle.color}` : ""}</p>
        <p className="moto-price">{formatPrice(motorcycle.price, motorcycle.currency)}</p>
        <span className="moto-details">View details <IconChevronRight size={18} stroke={1.8} /></span>
      </div>
      <IconChevronRight className="moto-chevron" size={24} stroke={1.8} />
    </Link>
  );
}

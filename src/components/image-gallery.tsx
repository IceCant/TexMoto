"use client";

import { useState } from "react";
import Image from "next/image";

import type { MotorcycleImage } from "@/db/schema";

export function ImageGallery({ images, title }: { images: MotorcycleImage[]; title: string }) {
  const [selectedId, setSelectedId] = useState(images[0]?.id);
  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  if (!selected) return <div className="listing-gallery-empty" />;
  return (
    <div className="listing-gallery">
      <div className="listing-gallery-main">
        <Image src={selected.url} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-contain" />
      </div>
      {images.length > 1 ? <div className="listing-thumbnails">{images.map((image) => <button key={image.id} type="button" onClick={() => setSelectedId(image.id)} className={image.id === selected.id ? "is-selected" : ""}><Image src={image.url} alt="" fill sizes="96px" className="object-cover" /></button>)}</div> : null}
    </div>
  );
}

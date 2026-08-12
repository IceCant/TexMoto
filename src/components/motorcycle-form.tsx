"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";

import type { MotorcycleFormState } from "@/app/admin/motorcycles/actions";
import type { MotorcycleWithImages } from "@/data/motorcycles";

type MotorcycleAction = (state: MotorcycleFormState, formData: FormData) => Promise<MotorcycleFormState>;

function SubmitButtons({ isPublished, isEditing }: { isPublished: boolean; isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-16 z-20 -mx-4 mt-8 flex gap-3 border-t border-[#e5e1d7] bg-[#f7f5ef]/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:rounded-2xl">
      <button className="button-secondary flex-1" name="intent" value="draft" disabled={pending}>
        {pending ? "Saving…" : isEditing ? "Save changes" : "Save draft"}
      </button>
      <button className="button-primary flex-1" name="intent" value="publish" disabled={pending}>
        {pending ? "Publishing…" : isPublished ? "Update listing" : "Publish"}
      </button>
    </div>
  );
}

export function MotorcycleForm({ action, motorcycle }: { action: MotorcycleAction; motorcycle?: MotorcycleWithImages }) {
  const [state, formAction] = useActionState(action, {});
  const [existingImages, setExistingImages] = useState(motorcycle?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);

  useEffect(() => () => previewUrls.forEach(URL.revokeObjectURL), [previewUrls]);

  function syncFiles(files: File[]) {
    setNewFiles(files);
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  function moveNewImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= newFiles.length) return;
    const reordered = [...newFiles];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    syncFiles(reordered);
  }

  function moveExistingImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= existingImages.length) return;
    setExistingImages((images) => {
      const reordered = [...images];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  return (
    <form action={formAction} className="mx-auto max-w-3xl">
      {existingImages.map((image) => <input key={image.id} type="hidden" name="retainedImageIds" value={image.id} />)}
      <section className="card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="eyebrow">Step 1</p><h2 className="mt-1 text-xl font-black">Photos</h2></div>
          <span className="text-xs font-medium text-[#68736c]">First photo is the cover</span>
        </div>
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8d4ca] bg-[#faf9f5] p-5 text-center hover:border-[#d75d2a]">
          <ImagePlus className="mb-2 text-[#d75d2a]" />
          <span className="font-bold">Add photos</span>
          <span className="mt-1 text-xs text-[#68736c]">Use camera or choose multiple · up to 8 MB each</span>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(event) => syncFiles([...newFiles, ...Array.from(event.target.files ?? [])])}
          />
        </label>
        {(existingImages.length > 0 || newFiles.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingImages.map((image, index) => (
              <PhotoTile
                key={image.id}
                src={image.url}
                label={index === 0 ? "Cover" : `${index + 1}`}
                onLeft={() => moveExistingImage(index, -1)}
                onRight={() => moveExistingImage(index, 1)}
                onRemove={() => setExistingImages((images) => images.filter((item) => item.id !== image.id))}
              />
            ))}
            {previewUrls.map((url, index) => (
              <PhotoTile
                key={`${newFiles[index]?.name}-${newFiles[index]?.lastModified}`}
                src={url}
                label={existingImages.length + index === 0 ? "Cover" : `${existingImages.length + index + 1}`}
                onLeft={() => moveNewImage(index, -1)}
                onRight={() => moveNewImage(index, 1)}
                onRemove={() => syncFiles(newFiles.filter((_, fileIndex) => fileIndex !== index))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card mt-4 p-4 sm:p-6">
        <p className="eyebrow">Required to publish</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Brand"><input className="field" name="brand" defaultValue={motorcycle?.brand ?? ""} placeholder="Honda" /></Field>
          <Field label="Model"><input className="field" name="model" defaultValue={motorcycle?.model ?? ""} placeholder="Dream 125" /></Field>
          <Field label="Year"><input className="field" name="year" type="number" inputMode="numeric" min="1900" max="2100" defaultValue={motorcycle?.year ?? new Date().getFullYear()} /></Field>
          <Field label="Condition">
            <div className="grid grid-cols-2 gap-2">
              {(["NEW", "USED"] as const).map((condition) => (
                <label key={condition} className="cursor-pointer">
                  <input className="peer sr-only" type="radio" name="condition" value={condition} defaultChecked={motorcycle?.condition === condition} />
                  <span className="flex min-h-12 items-center justify-center rounded-xl border border-[#d8d4ca] font-bold peer-checked:border-[#d75d2a] peer-checked:bg-orange-50 peer-checked:text-[#a43f18]">{condition === "NEW" ? "New" : "Used"}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Price">
            <div className="flex gap-2">
              <select className="field w-24 shrink-0" name="currency" defaultValue={motorcycle?.currency ?? "USD"}><option>USD</option><option>KHR</option></select>
              <input className="field price-field" name="price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={motorcycle?.price ?? ""} placeholder="2,350" />
            </div>
          </Field>
        </div>
      </section>

      <details className="card group mt-4 p-4 sm:p-6">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-black">
          More details <ChevronDown className="transition group-open:rotate-180" size={20} />
        </summary>
        <div className="mt-5 grid gap-5 border-t border-[#e5e1d7] pt-5 sm:grid-cols-2">
          <Field label="Variant"><input className="field" name="variant" defaultValue={motorcycle?.variant ?? ""} /></Field>
          <Field label="Color"><input className="field" name="color" defaultValue={motorcycle?.color ?? ""} /></Field>
          <Field label="Engine (cc)"><input className="field" name="engineCc" type="number" min="0" inputMode="numeric" defaultValue={motorcycle?.engineCc ?? ""} /></Field>
          <Field label="Transmission"><select className="field" name="transmission" defaultValue={motorcycle?.transmission ?? ""}><option value="">Select</option><option>Automatic</option><option>Semi-automatic</option><option>Manual</option></select></Field>
          <Field label="Mileage (km)"><input className="field" name="mileage" type="number" min="0" inputMode="numeric" defaultValue={motorcycle?.mileage ?? ""} /></Field>
          <Field label="Plate number"><input className="field" name="plateNumber" defaultValue={motorcycle?.plateNumber ?? ""} /></Field>
          <Field label="Frame number"><input className="field" name="frameNumber" defaultValue={motorcycle?.frameNumber ?? ""} /></Field>
          <Field label="Engine number"><input className="field" name="engineNumber" defaultValue={motorcycle?.engineNumber ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-28 resize-y" name="description" defaultValue={motorcycle?.description ?? ""} /></Field></div>
          <div className="sm:col-span-2"><Field label="Private shop notes"><textarea className="field min-h-24 resize-y" name="notes" defaultValue={motorcycle?.notes ?? ""} /></Field></div>
        </div>
      </details>

      {state.error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">{state.error}</p> : null}
      <SubmitButtons isPublished={motorcycle?.status === "AVAILABLE"} isEditing={Boolean(motorcycle)} />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="label">{label}</span>{children}</label>;
}

function PhotoTile({ src, label, onLeft, onRight, onRemove }: { src: string; label: string; onLeft: () => void; onRight: () => void; onRemove: () => void }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#ece9e1]">
      <Image src={src} alt="Motorcycle preview" fill className="object-cover" unoptimized={src.startsWith("blob:")} />
      <span className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">{label}</span>
      <div className="absolute inset-x-2 bottom-2 flex justify-between">
        <div className="flex gap-1"><button type="button" onClick={onLeft} className="grid size-9 place-items-center rounded-lg bg-white/95"><ChevronLeft size={17} /></button><button type="button" onClick={onRight} className="grid size-9 place-items-center rounded-lg bg-white/95"><ChevronRight size={17} /></button></div>
        <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-lg bg-white/95 text-red-700"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

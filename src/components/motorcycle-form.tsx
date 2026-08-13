"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Gauge, ImagePlus, Info, LockKeyhole, Trash2 } from "lucide-react";

import type { MotorcycleFormState } from "@/app/admin/motorcycles/actions";
import type { MotorcycleWithImages } from "@/data/motorcycles";
import { getDictionary, type Locale, type TranslationDictionary } from "@/i18n/dictionaries";

type MotorcycleAction = (state: MotorcycleFormState, formData: FormData) => Promise<MotorcycleFormState>;

function SubmitButtons({ isPublished, isEditing, t }: { isPublished: boolean; isEditing: boolean; t: TranslationDictionary }) {
  const { pending } = useFormStatus();
  return (
    <div className="form-action-bar sticky bottom-16 z-20 -mx-4 mt-8 border-t px-4 py-3 backdrop-blur lg:bottom-4 lg:mx-0 lg:rounded-2xl">
      <div className="form-action-copy">
        <strong>{isPublished ? t["form.readyUpdate"] : t["form.readyList"]}</strong>
        <small>{t["form.socialHint"]}</small>
      </div>
      <div className="form-action-buttons">
        <button className="button-secondary" name="intent" value="draft" disabled={pending}>
          {pending ? t["form.saving"] : isEditing ? t["form.saveChanges"] : t["motorcycle.saveDraft"]}
        </button>
        <button className="button-primary" name="intent" value="publish" disabled={pending}>
          {pending ? t["form.publishing"] : isPublished ? t["form.updateListing"] : t["form.publishListing"]}
        </button>
      </div>
    </div>
  );
}

export function MotorcycleForm({ action, motorcycle, locale = "en" }: { action: MotorcycleAction; motorcycle?: MotorcycleWithImages; locale?: Locale }) {
  const t = getDictionary(locale);
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
      <section className="card form-section p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="eyebrow">{t["form.media"]}</p><h2 className="mt-1 text-xl font-black">{t["form.photos"]}</h2></div>
          <span className="form-section-count">{existingImages.length + newFiles.length}/12</span>
        </div>
        <label className="photo-dropzone mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center">
          <span className="photo-dropzone-icon"><ImagePlus size={21} /></span>
          <span className="font-bold">{t["form.addPhotos"]}</span>
          <span className="mt-1 text-xs text-[#68736c]">{t["form.photoHint"]}</span>
          <span className="mt-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#657287] shadow-sm">JPG, PNG, WebP · 8 MB max</span>
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
                label={index === 0 ? t["form.cover"] : `${index + 1}`}
                onLeft={() => moveExistingImage(index, -1)}
                onRight={() => moveExistingImage(index, 1)}
                onRemove={() => setExistingImages((images) => images.filter((item) => item.id !== image.id))}
              />
            ))}
            {previewUrls.map((url, index) => (
              <PhotoTile
                key={`${newFiles[index]?.name}-${newFiles[index]?.lastModified}`}
                src={url}
                label={existingImages.length + index === 0 ? t["form.cover"] : `${existingImages.length + index + 1}`}
                onLeft={() => moveNewImage(index, -1)}
                onRight={() => moveNewImage(index, 1)}
                onRemove={() => syncFiles(newFiles.filter((_, fileIndex) => fileIndex !== index))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card form-section mt-4 p-4 sm:p-6">
        <div className="form-section-heading"><div><p className="eyebrow">{t["form.required"]}</p><h2>{t["form.details"]}</h2></div><span>5</span></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={t["form.brand"]} required requiredLabel={t["form.requiredMark"]}><input className="field" name="brand" autoComplete="off" defaultValue={motorcycle?.brand ?? ""} placeholder="Honda" /></Field>
          <Field label={t["form.model"]} required requiredLabel={t["form.requiredMark"]}><input className="field" name="model" autoComplete="off" defaultValue={motorcycle?.model ?? ""} placeholder="Dream 125" /></Field>
          <Field label={t["form.year"]} required requiredLabel={t["form.requiredMark"]}><input className="field" name="year" type="number" inputMode="numeric" min="1900" max="2100" defaultValue={motorcycle?.year ?? new Date().getFullYear()} /></Field>
          <Field label={t["form.condition"]} required requiredLabel={t["form.requiredMark"]}>
            <div className="grid grid-cols-2 gap-2">
              {(["NEW", "USED"] as const).map((condition) => (
                <label key={condition} className="cursor-pointer">
                  <input className="peer sr-only" type="radio" name="condition" value={condition} defaultChecked={motorcycle?.condition === condition} />
                  <span className="condition-option flex min-h-12 items-center justify-center rounded-xl border font-bold">{condition === "NEW" ? t["form.new"] : t["form.used"]}</span>
                </label>
              ))}
            </div>
          </Field>
          <fieldset className="price-fieldset sm:col-span-2">
            <legend className="label">{t["motorcycle.price"]} <span className="required-mark">{t["form.requiredMark"]}</span></legend>
            <div className="price-control">
              <select className="field currency-field" aria-label="Currency" name="currency" defaultValue={motorcycle?.currency ?? "USD"}><option>USD</option><option>KHR</option></select>
              <input className="field price-field" aria-label="Price amount" name="price" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={motorcycle?.price ?? ""} placeholder="2,350" />
            </div>
            <small className="field-hint">{t["form.priceHint"]}</small>
          </fieldset>
        </div>
      </section>

      <details className="card form-section group mt-4 p-4 sm:p-6">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-black">
          <span className="details-summary-copy"><span className="details-summary-icon"><Info size={18} /></span><span>{t["motorcycle.moreDetails"]}<small>{t["form.moreHint"]}</small></span></span>
          <ChevronDown className="shrink-0 transition group-open:rotate-180" size={20} />
        </summary>
        <div className="optional-details">
          <FormSubsection icon={Gauge} title={t["form.specifications"]} description={t["form.specificationsHint"]}>
            <Field label={t["form.variant"]}><input className="field" name="variant" defaultValue={motorcycle?.variant ?? ""} placeholder="Prestige" /></Field>
            <Field label={t["form.color"]}><input className="field" name="color" defaultValue={motorcycle?.color ?? ""} /></Field>
            <Field label={t["form.engineSize"]}><div className="input-suffix"><input className="field" aria-label="Engine size in cc" name="engineCc" type="number" min="0" inputMode="numeric" defaultValue={motorcycle?.engineCc ?? ""} /><span>cc</span></div></Field>
            <Field label={t["form.transmission"]}><select className="field" name="transmission" defaultValue={motorcycle?.transmission ?? ""}><option value="">{t["form.notSpecified"]}</option><option value="Automatic">{t["form.automatic"]}</option><option value="Semi-automatic">{t["form.semiAutomatic"]}</option><option value="Manual">{t["form.manual"]}</option></select></Field>
            <Field label={t["form.mileage"]}><div className="input-suffix"><input className="field" aria-label="Mileage in kilometers" name="mileage" type="number" min="0" inputMode="numeric" defaultValue={motorcycle?.mileage ?? ""} /><span>km</span></div></Field>
          </FormSubsection>
          <FormSubsection icon={Info} title={t["form.identifiers"]} description={t["form.identifiersHint"]}>
            <Field label={t["form.plate"]}><input className="field" name="plateNumber" autoCapitalize="characters" defaultValue={motorcycle?.plateNumber ?? ""} /></Field>
            <Field label={t["form.frame"]}><input className="field" name="frameNumber" autoCapitalize="characters" defaultValue={motorcycle?.frameNumber ?? ""} /></Field>
            <Field label={t["form.engineNumber"]}><input className="field" name="engineNumber" autoCapitalize="characters" defaultValue={motorcycle?.engineNumber ?? ""} /></Field>
          </FormSubsection>
          <FormSubsection icon={FileText} title={t["form.publicDescription"]} description={t["form.publicDescriptionHint"]} single>
            <Field label={t["form.description"]}><textarea className="field min-h-32 resize-y" name="description" defaultValue={motorcycle?.description ?? ""} /></Field>
          </FormSubsection>
          <FormSubsection icon={LockKeyhole} title={t["form.privateNotes"]} description={t["form.privateNotesHint"]} single>
            <Field label={t["form.shopNotes"]}><textarea className="field min-h-24 resize-y" name="notes" defaultValue={motorcycle?.notes ?? ""} /></Field>
          </FormSubsection>
        </div>
      </details>

      {state.error ? <p role="alert" aria-live="polite" className="form-submit-error">{state.error}</p> : null}
      <SubmitButtons isPublished={motorcycle?.status === "AVAILABLE"} isEditing={Boolean(motorcycle)} t={t} />
    </form>
  );
}

function Field({ label, children, required, requiredLabel = "Required" }: { label: string; children: React.ReactNode; required?: boolean; requiredLabel?: string }) {
  return <label><span className="label">{label}{required ? <span className="required-mark">{requiredLabel}</span> : null}</span>{children}</label>;
}

function FormSubsection({ icon: Icon, title, description, children, single }: { icon: typeof Info; title: string; description: string; children: React.ReactNode; single?: boolean }) {
  return <section className="form-subsection"><div className="form-subsection-heading"><span><Icon size={18} /></span><div><h3>{title}</h3><p>{description}</p></div></div><div className={`form-subsection-grid ${single ? "is-single" : ""}`}>{children}</div></section>;
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

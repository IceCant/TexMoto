"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSession } from "@/auth/session";
import { changeMotorcycleStatus, createMotorcycle, updateMotorcycle } from "@/data/motorcycles";
import { DomainError } from "@/domain/errors";
import { statuses } from "@/domain/motorcycle";
import { scheduleSocialPublishing } from "@/lib/social-publishing";

export type MotorcycleFormState = { error?: string };

function detailsFromFormData(formData: FormData) {
  return Object.fromEntries(
    [
      "brand", "model", "variant", "year", "condition", "color", "engineCc", "transmission",
      "mileage", "price", "currency", "description", "plateNumber", "frameNumber", "engineNumber", "notes",
    ].map((key) => [key, formData.get(key)]),
  );
}

function imageFilesFromFormData(formData: FormData) {
  return formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function actionError(error: unknown): MotorcycleFormState {
  if (error instanceof DomainError) return { error: error.message };
  if (error instanceof Error) return { error: error.message };
  return { error: "Something went wrong. Please try again." };
}

export async function createMotorcycleAction(
  _state: MotorcycleFormState,
  formData: FormData,
): Promise<MotorcycleFormState> {
  const session = await requireSession();
  let motorcycleId: string;
  const shouldPublish = formData.get("intent") === "publish";
  try {
    const motorcycle = await createMotorcycle({
      businessId: session.businessId,
      rawDetails: detailsFromFormData(formData),
      files: imageFilesFromFormData(formData),
      publish: shouldPublish,
    });
    motorcycleId = motorcycle.id;
  } catch (error) {
    return actionError(error);
  }
  if (shouldPublish) scheduleSocialPublishing({ motorcycleId, businessId: session.businessId });
  revalidatePath("/admin");
  revalidatePath("/admin/motorcycles");
  redirect(`/admin/motorcycles/${motorcycleId}?created=1`);
}

export async function updateMotorcycleAction(
  motorcycleId: string,
  _state: MotorcycleFormState,
  formData: FormData,
): Promise<MotorcycleFormState> {
  const session = await requireSession();
  const shouldPublish = formData.get("intent") === "publish";
  try {
    await updateMotorcycle({
      id: motorcycleId,
      businessId: session.businessId,
      rawDetails: detailsFromFormData(formData),
      retainedImageIds: formData.getAll("retainedImageIds").map(String),
      newFiles: imageFilesFromFormData(formData),
      publish: shouldPublish,
    });
  } catch (error) {
    return actionError(error);
  }
  if (shouldPublish) scheduleSocialPublishing({ motorcycleId, businessId: session.businessId });
  revalidatePath("/admin");
  revalidatePath("/admin/motorcycles");
  revalidatePath(`/admin/motorcycles/${motorcycleId}`);
  redirect(`/admin/motorcycles/${motorcycleId}?updated=1`);
}

const statusChangeSchema = z.object({ id: z.uuid(), status: z.enum(statuses) });

export async function changeStatusAction(formData: FormData) {
  const session = await requireSession();
  const parsed = statusChangeSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new DomainError("Invalid status change.", "INVALID_INPUT");
  await changeMotorcycleStatus(parsed.data.id, session.businessId, parsed.data.status);
  if (parsed.data.status === "AVAILABLE") scheduleSocialPublishing({ motorcycleId: parsed.data.id, businessId: session.businessId });
  revalidatePath("/admin");
  revalidatePath("/admin/motorcycles");
  revalidatePath(`/admin/motorcycles/${parsed.data.id}`);
}

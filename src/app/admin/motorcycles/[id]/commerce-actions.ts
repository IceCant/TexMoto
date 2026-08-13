"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/auth/session";
import { cancelMotorcycleReservation, completeMotorcycleSale, reserveMotorcycle } from "@/data/sales";
import { publishMotorcycleToTelegram } from "@/data/telegram";
import { publishMotorcycleToFacebook } from "@/data/facebook";
import { DomainError } from "@/domain/errors";
import { parseReservationInput, parseSaleInput } from "@/domain/sales";

export type CommerceActionState = { error?: string };

function actionError(error: unknown) {
  if (error instanceof DomainError) return { error: error.message };
  return { error: "Something went wrong. Please try again." };
}

function refreshMotorcycle(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/motorcycles");
  revalidatePath(`/admin/motorcycles/${id}`);
}

export async function publishTelegramAction(motorcycleId: string, _state: CommerceActionState): Promise<CommerceActionState> {
  void _state;
  const session = await requireSession();
  try { await publishMotorcycleToTelegram({ motorcycleId, businessId: session.businessId, publicOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }); }
  catch (error) { refreshMotorcycle(motorcycleId); return actionError(error); }
  refreshMotorcycle(motorcycleId);
  redirect(`/admin/motorcycles/${motorcycleId}?telegram=published`);
}

export async function publishFacebookAction(motorcycleId: string, _state: CommerceActionState): Promise<CommerceActionState> {
  void _state;
  const session = await requireSession();
  try { await publishMotorcycleToFacebook({ motorcycleId, businessId: session.businessId, publicOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }); }
  catch (error) { refreshMotorcycle(motorcycleId); return actionError(error); }
  refreshMotorcycle(motorcycleId);
  redirect(`/admin/motorcycles/${motorcycleId}?facebook=published`);
}

export async function reserveMotorcycleAction(motorcycleId: string, _state: CommerceActionState, formData: FormData): Promise<CommerceActionState> {
  const session = await requireSession();
  try { await reserveMotorcycle({ businessId: session.businessId, motorcycleId, reservation: parseReservationInput(Object.fromEntries(formData)) }); }
  catch (error) { return actionError(error); }
  refreshMotorcycle(motorcycleId);
  redirect(`/admin/motorcycles/${motorcycleId}?reserved=1`);
}

export async function cancelReservationAction(motorcycleId: string) {
  const session = await requireSession();
  await cancelMotorcycleReservation({ businessId: session.businessId, motorcycleId });
  refreshMotorcycle(motorcycleId);
  redirect(`/admin/motorcycles/${motorcycleId}?reservation=cancelled`);
}

export async function completeSaleAction(motorcycleId: string, _state: CommerceActionState, formData: FormData): Promise<CommerceActionState> {
  const session = await requireSession();
  let sale;
  try { sale = await completeMotorcycleSale({ businessId: session.businessId, motorcycleId, createdByUserId: session.userId, sale: parseSaleInput(Object.fromEntries(formData)) }); }
  catch (error) { return actionError(error); }
  refreshMotorcycle(motorcycleId);
  revalidatePath("/admin/customers");
  revalidatePath("/admin/sales");
  redirect(`/admin/sales/${sale.id}/receipt?created=1`);
}

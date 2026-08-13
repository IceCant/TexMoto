"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/auth/session";
import { addMotorcycleServiceRecord } from "@/data/sales";
import { DomainError } from "@/domain/errors";
import { parseReceiptIdentifier } from "@/domain/receipt";
import { parseServiceRecordInput } from "@/domain/service-record";
import { getTranslations } from "@/i18n/server";

export type ServiceRecordActionState = { error?: string; success?: string };

export async function addServiceRecordAction(saleIdValue: string, _state: ServiceRecordActionState, formData: FormData): Promise<ServiceRecordActionState> {
  const session = await requireSession();
  try {
    const saleId = parseReceiptIdentifier(saleIdValue);
    const result = await addMotorcycleServiceRecord({ businessId: session.businessId, saleId, createdByUserId: session.userId, record: parseServiceRecordInput(Object.fromEntries(formData)) });
    revalidatePath(`/admin/sales/${saleId}/receipt`);
    revalidatePath(`/receipt/${result.receiptAccessToken}`);
    return { success: (await getTranslations())["service.saved"] };
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    return { error: "Service record could not be saved." };
  }
}

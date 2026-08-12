import "server-only";

import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  businesses,
  motorcycleImages,
  motorcycles,
  type Motorcycle,
  type MotorcycleImage,
} from "@/db/schema";
import { DomainError } from "@/domain/errors";
import {
  assertMotorcycleCanBePublished,
  nextPublicationState,
  parseMotorcycleDraft,
  type MotorcycleDraftInput,
} from "@/domain/motorcycle";
import type { StorefrontTheme } from "@/domain/storefront-theme";
import { createMotorcycleSlug } from "@/domain/slug";
import { getImageStorage } from "@/storage";

export type MotorcycleWithImages = Motorcycle & { images: MotorcycleImage[] };

function motorcycleValues(input: MotorcycleDraftInput) {
  return {
    brand: input.brand ?? null,
    model: input.model ?? null,
    variant: input.variant ?? null,
    year: input.year ?? null,
    condition: input.condition ?? null,
    color: input.color ?? null,
    engineCc: input.engineCc ?? null,
    transmission: input.transmission ?? null,
    mileage: input.mileage ?? null,
    price: input.price === undefined ? null : input.price.toFixed(2),
    currency: input.currency,
    description: input.description ?? null,
    plateNumber: input.plateNumber ?? null,
    frameNumber: input.frameNumber ?? null,
    engineNumber: input.engineNumber ?? null,
    notes: input.notes ?? null,
    updatedAt: new Date(),
  };
}

async function attachImages(rows: Motorcycle[]): Promise<MotorcycleWithImages[]> {
  if (rows.length === 0) return [];
  const images = await db
    .select()
    .from(motorcycleImages)
    .where(inArray(motorcycleImages.motorcycleId, rows.map((row) => row.id)))
    .orderBy(motorcycleImages.sortOrder);

  const imagesByMotorcycle = new Map<string, MotorcycleImage[]>();
  for (const image of images) {
    const currentImages = imagesByMotorcycle.get(image.motorcycleId) ?? [];
    currentImages.push(image);
    imagesByMotorcycle.set(image.motorcycleId, currentImages);
  }
  return rows.map((row) => ({ ...row, images: imagesByMotorcycle.get(row.id) ?? [] }));
}

export async function createMotorcycle(input: {
  businessId: string;
  rawDetails: unknown;
  files: File[];
  publish: boolean;
}) {
  if (input.files.length > 12) throw new DomainError("You can upload up to 12 photos.", "INVALID_INPUT");
  const details = parseMotorcycleDraft(input.rawDetails);
  if (input.publish) assertMotorcycleCanBePublished(details, input.files.length);

  const storage = getImageStorage();
  const uploaded = [] as Awaited<ReturnType<typeof storage.save>>[];
  try {
    for (const file of input.files) uploaded.push(await storage.save(file, input.businessId));

    return await db.transaction(async (transaction) => {
      const slug = createMotorcycleSlug(details.brand ?? "motorcycle", details.model ?? "draft", details.year ?? new Date().getFullYear());
      const publication = input.publish ? nextPublicationState(details, uploaded.length) : { status: "DRAFT" as const, publishedAt: null };
      const [motorcycle] = await transaction
        .insert(motorcycles)
        .values({
          businessId: input.businessId,
          slug,
          ...motorcycleValues(details),
          ...publication,
        })
        .returning();

      if (!motorcycle) throw new Error("Motorcycle creation did not return a row.");
      if (uploaded.length > 0) {
        await transaction.insert(motorcycleImages).values(
          uploaded.map((image, sortOrder) => ({ motorcycleId: motorcycle.id, url: image.url, sortOrder })),
        );
      }
      return motorcycle;
    });
  } catch (error) {
    await Promise.all(uploaded.map((image) => storage.remove(image.url)));
    throw error;
  }
}

export async function updateMotorcycle(input: {
  id: string;
  businessId: string;
  rawDetails: unknown;
  retainedImageIds: string[];
  newFiles: File[];
  publish: boolean;
}) {
  const details = parseMotorcycleDraft(input.rawDetails);
  const current = await getAdminMotorcycleById(input.id, input.businessId);
  const retainedImages = input.retainedImageIds.map((id) => current.images.find((image) => image.id === id));
  if (retainedImages.some((image) => !image)) {
    throw new DomainError("An image does not belong to this motorcycle.", "FORBIDDEN");
  }

  const finalImageCount = retainedImages.length + input.newFiles.length;
  if (finalImageCount > 12) throw new DomainError("You can keep up to 12 photos.", "INVALID_INPUT");
  if (input.publish || current.status === "AVAILABLE") {
    assertMotorcycleCanBePublished(details, finalImageCount);
  }

  const storage = getImageStorage();
  const uploaded = [] as Awaited<ReturnType<typeof storage.save>>[];
  try {
    for (const file of input.newFiles) uploaded.push(await storage.save(file, input.businessId));

    const motorcycle = await db.transaction(async (transaction) => {
      const publication = input.publish
        ? nextPublicationState(details, finalImageCount, current.publishedAt ?? new Date())
        : { status: current.status, publishedAt: current.publishedAt };
      const [updated] = await transaction
        .update(motorcycles)
        .set({ ...motorcycleValues(details), ...publication })
        .where(and(eq(motorcycles.id, input.id), eq(motorcycles.businessId, input.businessId)))
        .returning();
      if (!updated) throw new DomainError("Motorcycle not found.", "NOT_FOUND");

      await transaction.delete(motorcycleImages).where(eq(motorcycleImages.motorcycleId, input.id));
      const finalImages = [
        ...retainedImages.map((image) => ({ id: image!.id, url: image!.url })),
        ...uploaded.map((image) => ({ id: crypto.randomUUID(), url: image.url })),
      ];
      if (finalImages.length > 0) {
        await transaction.insert(motorcycleImages).values(
          finalImages.map((image, sortOrder) => ({
            id: image.id,
            motorcycleId: input.id,
            url: image.url,
            sortOrder,
          })),
        );
      }
      return updated;
    });

    const retainedSet = new Set(input.retainedImageIds);
    await Promise.all(current.images.filter((image) => !retainedSet.has(image.id)).map((image) => storage.remove(image.url)));
    return motorcycle;
  } catch (error) {
    await Promise.all(uploaded.map((image) => storage.remove(image.url)));
    throw error;
  }
}

export async function getAdminMotorcycleById(id: string, businessId: string) {
  const rows = await db
    .select()
    .from(motorcycles)
    .where(and(eq(motorcycles.id, id), eq(motorcycles.businessId, businessId)))
    .limit(1);
  const [motorcycle] = await attachImages(rows);
  if (!motorcycle) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
  return motorcycle;
}

export async function listAdminMotorcycles(
  businessId: string,
  filters: { status?: string; brand?: string; condition?: string; search?: string } = {},
) {
  const conditions: SQL[] = [eq(motorcycles.businessId, businessId)];
  if (["DRAFT", "AVAILABLE", "RESERVED", "SOLD", "HIDDEN"].includes(filters.status ?? "")) {
    conditions.push(eq(motorcycles.status, filters.status as Motorcycle["status"]));
  }
  if (filters.brand) conditions.push(ilike(motorcycles.brand, filters.brand));
  if (filters.condition === "NEW" || filters.condition === "USED") {
    conditions.push(eq(motorcycles.condition, filters.condition));
  }
  if (filters.search) {
    conditions.push(or(ilike(motorcycles.brand, `%${filters.search}%`), ilike(motorcycles.model, `%${filters.search}%`))!);
  }
  const rows = await db.select().from(motorcycles).where(and(...conditions)).orderBy(desc(motorcycles.createdAt));
  return attachImages(rows);
}

export async function getDashboardData(businessId: string) {
  const counts = await db
    .select({ status: motorcycles.status, count: count() })
    .from(motorcycles)
    .where(eq(motorcycles.businessId, businessId))
    .groupBy(motorcycles.status);
  const recentRows = await db
    .select()
    .from(motorcycles)
    .where(eq(motorcycles.businessId, businessId))
    .orderBy(desc(motorcycles.createdAt))
    .limit(5);
  return { counts: Object.fromEntries(counts.map((row) => [row.status, row.count])), recent: await attachImages(recentRows) };
}

export async function changeMotorcycleStatus(id: string, businessId: string, status: Motorcycle["status"]) {
  const current = await getAdminMotorcycleById(id, businessId);
  if (current.status === "SOLD") throw new DomainError("Sold motorcycles cannot be reopened.", "INVALID_STATE");
  if (status === "SOLD" || status === "RESERVED") throw new DomainError("Use the reservation or sale workflow for this status.", "INVALID_STATE");
  if (status === "AVAILABLE") {
    assertMotorcycleCanBePublished(parseMotorcycleDraft(current), current.images.length);
  }
  const [updated] = await db
    .update(motorcycles)
    .set({ status, publishedAt: status === "AVAILABLE" ? current.publishedAt ?? new Date() : current.publishedAt, updatedAt: new Date() })
    .where(and(eq(motorcycles.id, id), eq(motorcycles.businessId, businessId)))
    .returning();
  if (!updated) throw new DomainError("Motorcycle not found.", "NOT_FOUND");
  return updated;
}

export async function getPublicBusiness(businessSlug: string) {
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, businessSlug)).limit(1);
  if (!business) throw new DomainError("Shop not found.", "NOT_FOUND");
  return business;
}

export async function updateBusinessStorefrontTheme(businessId: string, storefrontTheme: StorefrontTheme) {
  const [business] = await db
    .update(businesses)
    .set({ storefrontTheme, updatedAt: new Date() })
    .where(eq(businesses.id, businessId))
    .returning();

  if (!business) throw new DomainError("Shop not found.", "NOT_FOUND");
  return business;
}

export async function listPublicMotorcycles(
  businessId: string,
  filters: { search?: string; brand?: string; condition?: string } = {},
) {
  const conditions: SQL[] = [eq(motorcycles.businessId, businessId), eq(motorcycles.status, "AVAILABLE")];
  if (filters.brand) conditions.push(ilike(motorcycles.brand, filters.brand));
  if (filters.condition === "NEW" || filters.condition === "USED") conditions.push(eq(motorcycles.condition, filters.condition));
  if (filters.search) conditions.push(or(ilike(motorcycles.brand, `%${filters.search}%`), ilike(motorcycles.model, `%${filters.search}%`))!);
  const rows = await db.select().from(motorcycles).where(and(...conditions)).orderBy(desc(motorcycles.publishedAt));
  return attachImages(rows);
}

export async function getPublicMotorcycleListing(businessSlug: string, motorcycleSlug: string) {
  const rows = await db
    .select({ motorcycle: motorcycles })
    .from(motorcycles)
    .innerJoin(businesses, eq(motorcycles.businessId, businesses.id))
    .where(
      and(
        eq(businesses.slug, businessSlug),
        eq(motorcycles.slug, motorcycleSlug),
        inArray(motorcycles.status, ["AVAILABLE", "RESERVED", "SOLD"]),
      ),
    )
    .limit(1);
  const [motorcycle] = await attachImages(rows.map((row) => row.motorcycle));
  if (!motorcycle) throw new DomainError("Listing not found.", "NOT_FOUND");
  return motorcycle;
}

import { hash } from "bcryptjs";
import { db, sql } from "@/db/connection";
import { businesses, motorcycleImages, motorcycles, users } from "@/db/schema";

async function seed() {
  const [business] = await db
    .insert(businesses)
    .values({
      name: "Sokha Moto",
      slug: "sokha-moto",
      phone: "+855 12 345 678",
      telegram: "texmoto",
      facebook: "texmoto",
      address: "Phnom Penh, Cambodia",
    })
    .onConflictDoUpdate({ target: businesses.slug, set: { name: "Sokha Moto", updatedAt: new Date() } })
    .returning();
  if (!business) throw new Error("Failed to seed Sokha Moto.");

  await db
    .insert(users)
    .values({
      businessId: business.id,
      name: "Sokha Owner",
      email: "owner@texmoto.test",
      passwordHash: await hash("TexMoto123!", 12),
      role: "OWNER",
    })
    .onConflictDoUpdate({ target: users.email, set: { businessId: business.id, name: "Sokha Owner", updatedAt: new Date() } });

  const demos = [
    { slug: "honda-dream-125-2024-demo", brand: "Honda", model: "Dream 125", year: 2024, condition: "NEW" as const, price: "2450.00", color: "Black", image: "/motorcycles/honda-dream-125-studio.jpg" },
    { slug: "honda-scoopy-2023-demo", brand: "Honda", model: "Scoopy", year: 2023, condition: "USED" as const, price: "1850.00", color: "Cream", image: "/motorcycles/honda-scoopy-studio.jpg" },
    { slug: "yamaha-nmax-2024-demo", brand: "Yamaha", model: "NMAX", year: 2024, condition: "NEW" as const, price: "3900.00", color: "Blue", image: "/motorcycles/yamaha-nmax-studio.jpg" },
  ];

  for (const demo of demos) {
    const [motorcycle] = await db
      .insert(motorcycles)
      .values({ businessId: business.id, slug: demo.slug, brand: demo.brand, model: demo.model, year: demo.year, condition: demo.condition, price: demo.price, currency: "USD", color: demo.color, status: "AVAILABLE", publishedAt: new Date() })
      .onConflictDoUpdate({ target: [motorcycles.businessId, motorcycles.slug], set: { price: demo.price, status: "AVAILABLE", updatedAt: new Date() } })
      .returning();
    if (!motorcycle) throw new Error(`Failed to seed ${demo.model}.`);
    await db.insert(motorcycleImages).values({ motorcycleId: motorcycle.id, url: demo.image, sortOrder: 0 }).onConflictDoUpdate({ target: [motorcycleImages.motorcycleId, motorcycleImages.sortOrder], set: { url: demo.image } });
  }
  console.info("Seeded Sokha Moto. Login: owner@texmoto.test / TexMoto123!");
}

seed().then(() => sql.end()).catch(async (error) => { console.error(error); await sql.end(); process.exit(1); });

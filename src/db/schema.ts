import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["OWNER", "STAFF"]);
export const motorcycleCondition = pgEnum("motorcycle_condition", ["NEW", "USED"]);
export const motorcycleStatus = pgEnum("motorcycle_status", [
  "DRAFT",
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "HIDDEN",
]);
export const currency = pgEnum("currency", ["USD", "KHR"]);
export const storefrontTheme = pgEnum("storefront_theme", ["MARKETPLACE", "EDITORIAL", "LOCAL"]);
export const publicationChannel = pgEnum("publication_channel", ["TELEGRAM", "FACEBOOK"]);
export const publicationStatus = pgEnum("publication_status", ["PENDING", "PUBLISHED", "FAILED"]);
export const reservationStatus = pgEnum("reservation_status", ["ACTIVE", "CANCELLED", "COMPLETED"]);
export const paymentMethod = pgEnum("payment_method", ["CASH", "KHQR", "BANK_TRANSFER", "OTHER"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    phone: text("phone"),
    telegram: text("telegram"),
    facebook: text("facebook"),
    address: text("address"),
    logoUrl: text("logo_url"),
    storefrontTheme: storefrontTheme("storefront_theme").notNull().default("MARKETPLACE"),
    ...timestamps,
  },
  (table) => [uniqueIndex("businesses_slug_unique").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("STAFF"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_business_idx").on(table.businessId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_idx").on(table.userId), index("sessions_expiry_idx").on(table.expiresAt)],
);

export const motorcycles = pgTable(
  "motorcycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    brand: text("brand"),
    model: text("model"),
    variant: text("variant"),
    year: integer("year"),
    condition: motorcycleCondition("condition"),
    color: text("color"),
    engineCc: integer("engine_cc"),
    transmission: text("transmission"),
    mileage: integer("mileage"),
    price: numeric("price", { precision: 14, scale: 2 }),
    currency: currency("currency").notNull().default("USD"),
    description: text("description"),
    plateNumber: text("plate_number"),
    frameNumber: text("frame_number"),
    engineNumber: text("engine_number"),
    notes: text("notes"),
    status: motorcycleStatus("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("motorcycles_business_slug_unique").on(table.businessId, table.slug),
    index("motorcycles_business_status_idx").on(table.businessId, table.status),
    index("motorcycles_business_created_idx").on(table.businessId, table.createdAt),
  ],
);

export const motorcycleImages = pgTable(
  "motorcycle_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    motorcycleId: uuid("motorcycle_id")
      .notNull()
      .references(() => motorcycles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("motorcycle_images_order_unique").on(table.motorcycleId, table.sortOrder),
    index("motorcycle_images_motorcycle_idx").on(table.motorcycleId),
  ],
);

export const telegramIntegrations = pgTable(
  "telegram_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    botTokenEncrypted: text("bot_token_encrypted").notNull(),
    channelId: text("channel_id").notNull(),
    channelUsername: text("channel_username"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("telegram_integrations_business_unique").on(table.businessId)],
);

export const facebookIntegrations = pgTable(
  "facebook_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    pageAccessTokenEncrypted: text("page_access_token_encrypted").notNull(),
    pageId: text("page_id").notNull(),
    pageName: text("page_name"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("facebook_integrations_business_unique").on(table.businessId)],
);

export const publications = pgTable(
  "publications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    motorcycleId: uuid("motorcycle_id").notNull().references(() => motorcycles.id, { onDelete: "cascade" }),
    channel: publicationChannel("channel").notNull(),
    status: publicationStatus("status").notNull().default("PENDING"),
    externalPostId: text("external_post_id"),
    externalUrl: text("external_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("publications_business_motorcycle_channel_unique").on(table.businessId, table.motorcycleId, table.channel),
    index("publications_motorcycle_idx").on(table.motorcycleId),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    telegramUsername: text("telegram_username"),
    address: text("address"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [index("customers_business_name_idx").on(table.businessId, table.name), index("customers_business_phone_idx").on(table.businessId, table.phone)],
);

export const motorcycleReservations = pgTable(
  "motorcycle_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    motorcycleId: uuid("motorcycle_id").notNull().references(() => motorcycles.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name"),
    phone: text("phone"),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    status: reservationStatus("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [index("reservations_business_motorcycle_idx").on(table.businessId, table.motorcycleId), index("reservations_customer_idx").on(table.customerId)],
);

export const motorcycleSales = pgTable(
  "motorcycle_sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
    motorcycleId: uuid("motorcycle_id").notNull().references(() => motorcycles.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    listedPrice: numeric("listed_price", { precision: 14, scale: 2 }).notNull(),
    sellingPrice: numeric("selling_price", { precision: 14, scale: 2 }).notNull(),
    currency: currency("currency").notNull(),
    paymentMethod: paymentMethod("payment_method").notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("motorcycle_sales_business_motorcycle_unique").on(table.businessId, table.motorcycleId),
    index("motorcycle_sales_business_sold_idx").on(table.businessId, table.soldAt),
    index("motorcycle_sales_customer_idx").on(table.customerId),
  ],
);

export const schema = { businesses, users, sessions, motorcycles, motorcycleImages, telegramIntegrations, facebookIntegrations, publications, customers, motorcycleReservations, motorcycleSales };

export type Business = typeof businesses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Motorcycle = typeof motorcycles.$inferSelect;
export type MotorcycleImage = typeof motorcycleImages.$inferSelect;
export type TelegramIntegration = typeof telegramIntegrations.$inferSelect;
export type FacebookIntegration = typeof facebookIntegrations.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type MotorcycleReservation = typeof motorcycleReservations.$inferSelect;
export type MotorcycleSale = typeof motorcycleSales.$inferSelect;

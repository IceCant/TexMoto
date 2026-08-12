CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'KHQR', 'BANK_TRANSFER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."publication_channel" AS ENUM('TELEGRAM', 'FACEBOOK');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('PENDING', 'PUBLISHED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('ACTIVE', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"telegram_username" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycle_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_name" text,
	"phone" text,
	"reserved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"notes" text,
	"status" "reservation_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motorcycle_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"customer_id" uuid,
	"listed_price" numeric(14, 2) NOT NULL,
	"selling_price" numeric(14, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"sold_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"channel" "publication_channel" NOT NULL,
	"status" "publication_status" DEFAULT 'PENDING' NOT NULL,
	"external_post_id" text,
	"external_url" text,
	"published_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"bot_token_encrypted" text NOT NULL,
	"channel_id" text NOT NULL,
	"channel_username" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_reservations" ADD CONSTRAINT "motorcycle_reservations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_reservations" ADD CONSTRAINT "motorcycle_reservations_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_reservations" ADD CONSTRAINT "motorcycle_reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD CONSTRAINT "motorcycle_sales_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD CONSTRAINT "motorcycle_sales_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD CONSTRAINT "motorcycle_sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD CONSTRAINT "motorcycle_sales_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_integrations" ADD CONSTRAINT "telegram_integrations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_business_name_idx" ON "customers" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "customers_business_phone_idx" ON "customers" USING btree ("business_id","phone");--> statement-breakpoint
CREATE INDEX "reservations_business_motorcycle_idx" ON "motorcycle_reservations" USING btree ("business_id","motorcycle_id");--> statement-breakpoint
CREATE INDEX "reservations_customer_idx" ON "motorcycle_reservations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "motorcycle_sales_business_motorcycle_unique" ON "motorcycle_sales" USING btree ("business_id","motorcycle_id");--> statement-breakpoint
CREATE INDEX "motorcycle_sales_business_sold_idx" ON "motorcycle_sales" USING btree ("business_id","sold_at");--> statement-breakpoint
CREATE INDEX "motorcycle_sales_customer_idx" ON "motorcycle_sales" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "publications_business_motorcycle_channel_unique" ON "publications" USING btree ("business_id","motorcycle_id","channel");--> statement-breakpoint
CREATE INDEX "publications_motorcycle_idx" ON "publications" USING btree ("motorcycle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_integrations_business_unique" ON "telegram_integrations" USING btree ("business_id");
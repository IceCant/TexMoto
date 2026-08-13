CREATE TYPE "public"."service_record_type" AS ENUM('MAINTENANCE', 'REPAIR', 'WARRANTY', 'INSPECTION');--> statement-breakpoint
CREATE TABLE "motorcycle_service_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"type" "service_record_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"odometer" integer,
	"cost" numeric(14, 2),
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"serviced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_service_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD COLUMN "receipt_access_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD COLUMN "warranty_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "motorcycle_sales" ADD COLUMN "warranty_terms" text;--> statement-breakpoint
ALTER TABLE "motorcycle_service_records" ADD CONSTRAINT "motorcycle_service_records_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_service_records" ADD CONSTRAINT "motorcycle_service_records_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_service_records" ADD CONSTRAINT "motorcycle_service_records_sale_id_motorcycle_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."motorcycle_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycle_service_records" ADD CONSTRAINT "motorcycle_service_records_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_records_sale_date_idx" ON "motorcycle_service_records" USING btree ("sale_id","serviced_at");--> statement-breakpoint
CREATE INDEX "service_records_business_motorcycle_idx" ON "motorcycle_service_records" USING btree ("business_id","motorcycle_id");--> statement-breakpoint
CREATE UNIQUE INDEX "motorcycle_sales_receipt_access_unique" ON "motorcycle_sales" USING btree ("receipt_access_token");
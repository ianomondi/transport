ALTER TABLE "trips" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "start_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trips" ALTER COLUMN "start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "vehicle_number" text;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;
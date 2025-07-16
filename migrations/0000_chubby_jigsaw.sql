CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"total_trips" integer DEFAULT 0,
	"total_passengers" integer DEFAULT 0,
	"total_distance" numeric(8, 2) DEFAULT '0',
	"average_passengers_per_trip" numeric(5, 2) DEFAULT '0',
	"hourly_data" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "destination_queues" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"destination" text NOT NULL,
	"arrival_time" timestamp DEFAULT now() NOT NULL,
	"queue_position" integer NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"driver_id" text,
	"estimated_boarding_time" timestamp
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"assistant_name" text,
	"assistant_contact" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"date" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"coordinates" jsonb NOT NULL,
	"is_popular" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "passenger_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"passenger_count" integer NOT NULL,
	"location" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_passengers" integer DEFAULT 0 NOT NULL,
	"initial_passengers" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"current_location" jsonb,
	"route" jsonb DEFAULT '[]'::jsonb,
	"drop_off_points" jsonb DEFAULT '[]'::jsonb,
	"total_distance" numeric(8, 2) DEFAULT '0',
	"revenue" numeric(10, 2) DEFAULT '0',
	"driver_id" integer,
	"turns_count" integer DEFAULT 0
);

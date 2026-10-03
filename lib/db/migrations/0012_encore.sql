-- ============================================================================
-- 0012_encore.sql
--
-- Encore, the arts calendar, moves from a JSON file into Postgres so it can
-- refresh itself:
--
--   * encore_venues, encore_events, encore_performances: the calendar, seeded
--     from lib/content/encore/encore-calendar.json (lib/encore/seed.ts) and
--     kept current by the collector (lib/encore/collect). The site reads
--     these (lib/encore/store) and falls back to the JSON when it can't.
--   * encore_sources: one row per venue/presenter feed: which adapter reads
--     it, its settings, how often, and how the last run went.
--   * encore_checks: every status and price reading of a performance (the
--     weekly collect and the daily 21-day check both write here).
--   * encore_review_queue: what a person (or Claude) has to look at before
--     it goes live: new events, changes the collector won't make on its own.
--   * encore_images: each event's official image, resized to WebP in the
--     public `encore-images` Storage bucket, with its source and credit.
--     `hidden` takes one down on request.
--   * encore_runs: a log of collector runs, for /api/encore/status.
--
-- RLS on with no policies and every grant revoked from the API roles: the
-- anon/authenticated keys can read nothing. The site and the collector use
-- the postgres role over DATABASE_URL.
--
-- Written to be re-runnable (IF NOT EXISTS, ON CONFLICT DO NOTHING): it is
-- applied through the Supabase connector before being logged in
-- drizzle.__drizzle_migrations.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "encore_venues" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"address" text,
	"city" text,
	"market" text,
	"website" text,
	"events_url" text,
	"resident_companies" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"adapter" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frequency" text DEFAULT 'weekly' NOT NULL,
	"presenter" text,
	"venue_key" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_ok_at" timestamp with time zone,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"failures" integer DEFAULT 0 NOT NULL,
	"content_hash" text,
	"etag" text,
	"last_modified" text,
	"events_found" integer,
	"performances_found" integer,
	"matched" integer,
	"queued" integer,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encore_sources_frequency_check" CHECK ("frequency" in ('daily', 'weekly', 'monthly', 'manual'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_events" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"presenter" text,
	"market" text NOT NULL,
	"category" text NOT NULL,
	"site_category" text NOT NULL,
	"subcategory" text,
	"venue_key" text REFERENCES "encore_venues"("key") ON UPDATE CASCADE,
	"venue_name" text,
	"room" text,
	"city" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"start_time" text,
	"recurrence" text,
	"price" text,
	"price_min" numeric(10, 2),
	"price_max" numeric(10, 2),
	"ticket_url" text,
	"sources" text[] DEFAULT '{}'::text[] NOT NULL,
	"description" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"source_id" text REFERENCES "encore_sources"("id") ON DELETE SET NULL,
	"external_id" text,
	"hidden" boolean DEFAULT false NOT NULL,
	"origin" text DEFAULT 'seed' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encore_events_status_check" CHECK ("status" in ('scheduled', 'announced', 'sold-out', 'cancelled', 'postponed')),
	CONSTRAINT "encore_events_origin_check" CHECK ("origin" in ('seed', 'collector', 'review'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_events_venue_idx" ON "encore_events" ("venue_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_events_source_idx" ON "encore_events" ("source_id", "external_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_performances" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"event_slug" text NOT NULL REFERENCES "encore_events"("slug") ON DELETE CASCADE ON UPDATE CASCADE,
	"date" date NOT NULL,
	"time" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"availability" text DEFAULT 'unknown' NOT NULL,
	"price_min" numeric(10, 2),
	"price_max" numeric(10, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"ticket_url" text,
	"source_url" text,
	"last_seen_at" timestamp with time zone,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encore_performances_status_check" CHECK ("status" in ('scheduled', 'cancelled', 'postponed', 'removed')),
	CONSTRAINT "encore_performances_availability_check" CHECK ("availability" in ('on-sale', 'few-left', 'sold-out', 'not-on-sale', 'unknown'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "encore_performances_event_date_time_key" ON "encore_performances" ("event_slug", "date", "time");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_performances_date_idx" ON "encore_performances" ("date");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_checks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"performance_id" bigint NOT NULL REFERENCES "encore_performances"("id") ON DELETE CASCADE,
	"run" text DEFAULT 'check' NOT NULL,
	"status" text NOT NULL,
	"availability" text NOT NULL,
	"price_min" numeric(10, 2),
	"price_max" numeric(10, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"source_url" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encore_checks_run_check" CHECK ("run" in ('collect', 'check'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_checks_performance_idx" ON "encore_checks" ("performance_id", "checked_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_review_queue" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"fingerprint" text NOT NULL,
	"source_id" text REFERENCES "encore_sources"("id") ON DELETE SET NULL,
	"event_slug" text,
	"title" text NOT NULL,
	"source_url" text,
	"first_date" date,
	"payload" jsonb NOT NULL,
	"proposed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" text,
	"seen_count" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encore_review_queue_kind_check" CHECK ("kind" in ('new-event', 'change', 'removed', 'source')),
	CONSTRAINT "encore_review_queue_status_check" CHECK ("status" in ('pending', 'approved', 'rejected', 'merged'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "encore_review_queue_fingerprint_key" ON "encore_review_queue" ("fingerprint");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_review_queue_status_idx" ON "encore_review_queue" ("status", "first_date");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_images" (
	"event_slug" text PRIMARY KEY NOT NULL REFERENCES "encore_events"("slug") ON DELETE CASCADE ON UPDATE CASCADE,
	"image_source_url" text NOT NULL,
	"page_url" text,
	"credit" text NOT NULL,
	"alt" text,
	"storage_path" text,
	"public_url" text,
	"width" integer,
	"height" integer,
	"sha256" text,
	"hidden" boolean DEFAULT false NOT NULL,
	"error" text,
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "encore_runs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"kind" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"sources" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	CONSTRAINT "encore_runs_kind_check" CHECK ("kind" in ('collect', 'check', 'seed', 'images'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "encore_runs_started_idx" ON "encore_runs" ("kind", "started_at");
--> statement-breakpoint
ALTER TABLE "encore_venues" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_sources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_performances" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_checks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_review_queue" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_images" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "encore_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "encore_venues", "encore_sources", "encore_events", "encore_performances", "encore_checks", "encore_review_queue", "encore_images", "encore_runs" FROM anon, authenticated;
--> statement-breakpoint
-- Public read for the images (the bucket is public; nothing else is). Uploads use the service role.
INSERT INTO storage.buckets ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES ('encore-images', 'encore-images', true, 2097152, ARRAY['image/webp'])
ON CONFLICT ("id") DO NOTHING;

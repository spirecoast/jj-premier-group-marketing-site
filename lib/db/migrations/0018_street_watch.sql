-- ============================================================================
-- 0018_street_watch.sql
--
-- Street Watch (docs/ISSUES.md, "Street Watch"): an email when the county
-- records a sale on a street or in a place someone asked to watch, built on
-- the newsletter's machinery (double opt-in, signed unsubscribe links, the
-- daily sending cap, newsletter_deliveries as the record of every send).
--
--   street_watches         one address watching one street-and-ZIP or one
--                          Atlas place. 'pending' until the confirm link is
--                          pressed, then 'confirmed', or 'unsubscribed'.
--                          Keyed on the lowercased address and the target.
--                          contacts.unsubscribed_email stays the
--                          authoritative "never email this address".
--   street_watch_digests   one row per address per sales refresh: the claim
--                          that makes a re-run never send twice, and what the
--                          digest held (which watches, how many sales).
--
-- Each confirmation and digest is also a row in newsletter_deliveries
-- (list 'watch'), so it counts against NEWSLETTER_DAILY_CAP with Tide and
-- Encore.
--
-- Housekeeping is the site's own (lib/watch/store.ts, from the daily Street
-- Watch run): a watch never confirmed is deleted 30 days after it was asked
-- for, an unsubscribed watch 30 days after it was stopped, and a digest
-- record after 2 years, matching retention_purge() for the newsletter.
--
-- Additive only: two new tables and their indexes, RLS on with no policies
-- and every grant revoked from the API roles (the site uses DATABASE_URL).
-- Re-runnable (IF NOT EXISTS). Nothing existing is changed. The site works
-- before this is applied: the Watch buttons still record the lead, and the
-- watch itself is skipped with one log line naming this file.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "street_watches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid REFERENCES "contacts"("id") ON DELETE SET NULL,
	"email" text NOT NULL,
	"kind" text NOT NULL,
	"target_key" text NOT NULL,
	"label" text NOT NULL,
	"street" text,
	"zip" text,
	"place_slug" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text,
	"consent_version" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmation_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_method" text,
	"last_digest_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "street_watches_kind_check" CHECK ("kind" in ('street', 'place')),
	CONSTRAINT "street_watches_status_check" CHECK ("status" in ('pending', 'confirmed', 'unsubscribed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "street_watches_email_target_key" ON "street_watches" ("email", "target_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "street_watches_status_idx" ON "street_watches" ("status", "confirmed_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "street_watch_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"data_version" text NOT NULL,
	"status" text NOT NULL,
	"watches" jsonb,
	"sales" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"resend_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "street_watch_digests_status_check" CHECK ("status" in ('claimed', 'sent', 'failed', 'unknown', 'held'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "street_watch_digests_email_version_key" ON "street_watch_digests" ("email", "data_version");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "street_watch_digests_created_idx" ON "street_watch_digests" ("created_at");
--> statement-breakpoint
ALTER TABLE "street_watches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "street_watch_digests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "street_watches", "street_watch_digests" FROM anon, authenticated;

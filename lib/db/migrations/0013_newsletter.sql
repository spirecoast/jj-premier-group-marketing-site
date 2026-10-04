-- ============================================================================
-- 0013_newsletter.sql
--
-- The site now emails Tide and Encore to the people who subscribe
-- (docs/ISSUES.md), with double opt-in:
--
--   * newsletter_subscriptions: one address on one list ('tide' | 'encore'),
--     'pending' until the confirm link is pressed, then 'confirmed', or
--     'unsubscribed'. Keyed on the lowercased address and the list; contact_id
--     is the latest contacts row that asked. contacts.unsubscribed_email
--     stays the authoritative "never email this address".
--   * issue_sends: one row per issue sent to subscribers (Tide per data
--     month, Encore per week), with its schedule, hold and counts.
--   * newsletter_deliveries: every email sent to a subscriber, one row per
--     address; unique per issue so a re-run never sends twice.
--
-- Additive only: three new tables, their indexes, RLS on with no policies and
-- every grant revoked from the API roles (the site uses DATABASE_URL).
-- Re-runnable (IF NOT EXISTS). Nothing is dropped or deleted.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid REFERENCES "contacts"("id") ON DELETE SET NULL,
	"email" text NOT NULL,
	"list" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"source" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmation_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"welcome_sent_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"unsubscribe_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscriptions_list_check" CHECK ("list" in ('tide', 'encore')),
	CONSTRAINT "newsletter_subscriptions_status_check" CHECK ("status" in ('pending', 'confirmed', 'unsubscribed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_email_list_key" ON "newsletter_subscriptions" ("email", "list");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_list_status_idx" ON "newsletter_subscriptions" ("list", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "issue_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"period" text NOT NULL,
	"period_label" text NOT NULL,
	"period_end" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"held_by" text,
	"hold_reason" text,
	"held_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"unknown_count" integer DEFAULT 0 NOT NULL,
	"deferred_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"started_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_sends_kind_check" CHECK ("kind" in ('tide', 'encore')),
	CONSTRAINT "issue_sends_status_check" CHECK ("status" in ('scheduled', 'held', 'sending', 'sent', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "issue_sends_kind_period_key" ON "issue_sends" ("kind", "period");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_sends_status_idx" ON "issue_sends" ("status", "scheduled_for");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"list" text NOT NULL,
	"subscription_id" uuid REFERENCES "newsletter_subscriptions"("id") ON DELETE SET NULL,
	"issue_send_id" uuid REFERENCES "issue_sends"("id") ON DELETE CASCADE,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"resend_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "newsletter_deliveries_kind_check" CHECK ("kind" in ('confirmation', 'welcome', 'issue')),
	CONSTRAINT "newsletter_deliveries_status_check" CHECK ("status" in ('claimed', 'sent', 'failed', 'unknown'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_deliveries_issue_email_key" ON "newsletter_deliveries" ("issue_send_id", "email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_deliveries_created_idx" ON "newsletter_deliveries" ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_deliveries_subscription_idx" ON "newsletter_deliveries" ("subscription_id");
--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "issue_sends" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "newsletter_deliveries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "newsletter_subscriptions", "issue_sends", "newsletter_deliveries" FROM anon, authenticated;

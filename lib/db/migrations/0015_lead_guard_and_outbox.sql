-- ============================================================================
-- 0015_lead_guard_and_outbox.sql
--
-- The lead outbox, the form guard and a faster contact lookup. Additive only:
-- three new tables and two new indexes; nothing existing is changed. The site
-- works before this is applied (each part fails soft and logs once which file
-- to apply); with it, failed CRM and team-email deliveries are retried and
-- the forms get their rate limit and resend guard.
--
--   lead_outbox       one row per lead and sink ('crm', 'team_email') still
--                     owed; lib/lead-outbox.ts claims, retries and settles it.
--   lead_rate_limits  per-window send counts (lib/lead-guard.ts). The key is a
--                     hash; no address or email is stored. Rows older than a
--                     day are deleted by the daily cron.
--   lead_submissions  the random id each form attempt carries, so a resend is
--                     answered without sending the lead twice. Kept a week.
--
-- RLS on with no policies and every grant revoked from the API roles, like
-- the other tables (the site uses DATABASE_URL). Re-runnable.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "lead_outbox" (
	"lead_id" uuid NOT NULL,
	"sink" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_outbox_lead_id_sink_pk" PRIMARY KEY("lead_id","sink"),
	CONSTRAINT "lead_outbox_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "lead_outbox_sink_check" CHECK ("sink" in ('crm', 'team_email')),
	CONSTRAINT "lead_outbox_status_check" CHECK ("status" in ('pending', 'done', 'dead'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_outbox_due_idx" ON "lead_outbox" USING btree ("next_attempt_at") WHERE "lead_outbox"."status" = 'pending';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lead_rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_rate_limits_window_idx" ON "lead_rate_limits" USING btree ("window_start");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_submissions" (
	"submission_id" uuid PRIMARY KEY NOT NULL,
	"lead_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_submissions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_submissions_created_idx" ON "lead_submissions" USING btree ("created_at");
--> statement-breakpoint
-- A returning visitor's contacts row is found by lower(email) (lib/lead-pipeline.ts).
CREATE INDEX IF NOT EXISTS "contacts_email_lower_idx" ON "contacts" USING btree (lower("email")) WHERE "contacts"."archived_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "lead_outbox" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lead_rate_limits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lead_submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "lead_outbox", "lead_rate_limits", "lead_submissions" FROM anon, authenticated;

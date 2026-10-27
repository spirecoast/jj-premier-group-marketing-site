-- ============================================================================
-- 0016_ops_and_retention.sql
--
-- Operations records, and retention that covers the newsletter tables too.
-- Additive: three new tables and one function replaced with a superset of
-- what 0009 did. Nothing existing is dropped, renamed or rewritten. The site
-- works before this is applied (lib/ops fails soft and logs once which file
-- to apply). Re-runnable.
--
--   ops_runs     one row per run of a scheduled job: each Vercel cron
--                (lib/ops/cron.ts) and the nightly retention purge below.
--                /api/cron/ops-check reads it to notice a job that failed or
--                stopped running; /api/health?deep=1 shows the latest.
--   ops_alerts   which alert emails have gone out, so a problem that lasts
--                is emailed once a week, not on every run (lib/ops/alert.ts).
--   erasures     the record of an erasure request (scripts/forget.ts): when,
--                what was removed, and a SHA-256 of the address, never the
--                address itself.
--
-- retention_purge() keeps every rule from 0009 and adds the newsletter
-- tables, which 0009 left alone, so the privacy page holds for them too:
--   * a subscription never confirmed: deleted 30 days after it was asked
--     for (the confirm link lasts 7), with its confirmation email record;
--   * a confirmed subscription with no email sent to it and no change for
--     5 years: deleted;
--   * an unsubscribed one: kept, as the do-not-email record the privacy page
--     promises;
--   * newsletter_deliveries (who was sent which email): deleted after
--     2 years;
--   * ops_runs and ops_alerts: deleted after 180 days.
-- Each run now writes its counts to ops_runs, so a purge that fails (and
-- writes nothing) is noticed by the next ops check.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ops_runs" (
	"id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	"job" text NOT NULL,
	"outcome" text NOT NULL,
	"http_status" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" jsonb,
	"error" text,
	CONSTRAINT "ops_runs_outcome_check" CHECK ("outcome" in ('ok', 'held', 'partial', 'failed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ops_runs_job_started_idx" ON "ops_runs" USING btree ("job", "started_at" DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ops_alerts" (
	"key" text PRIMARY KEY NOT NULL,
	"first_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"times" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "erasures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_sha256" text,
	"phone_sha256" text,
	"erased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"counts" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "erasures_email_idx" ON "erasures" USING btree ("email_sha256");
--> statement-breakpoint
ALTER TABLE "ops_runs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "ops_alerts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "erasures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "ops_runs", "ops_alerts", "erasures" FROM anon, authenticated;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.retention_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  started timestamptz := clock_timestamp();
  n_deliveries int; n_leads_scrubbed int; n_leads_removed int;
  n_contacts_scrubbed int; n_events_scrubbed int; n_events_removed int; n_contacts_removed int;
  n_pending_removed int; n_pending_mail_removed int; n_idle_removed int; n_newsletter_mail_removed int;
  n_ops_removed int;
  result jsonb;
BEGIN
  -- 0009's rules, unchanged.
  DELETE FROM lead_deliveries WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS n_deliveries = ROW_COUNT;

  UPDATE leads SET first_name = NULL, last_name = NULL, message = NULL, market = NULL,
         property_address = NULL, timing = NULL, sell_first = NULL, source = NULL, payload = NULL
   WHERE submitted_at < now() - interval '2 years'
     AND (first_name IS NOT NULL OR last_name IS NOT NULL OR message IS NOT NULL OR market IS NOT NULL
          OR property_address IS NOT NULL OR timing IS NOT NULL OR sell_first IS NOT NULL
          OR source IS NOT NULL OR payload IS NOT NULL);
  GET DIAGNOSTICS n_leads_scrubbed = ROW_COUNT;

  DELETE FROM leads WHERE submitted_at < now() - interval '5 years';
  GET DIAGNOSTICS n_leads_removed = ROW_COUNT;

  UPDATE contacts SET full_name = NULL, first_name = NULL, last_name = NULL, utm = NULL,
         source = NULL, source_detail = NULL
   WHERE coalesce(last_touch_at, created_at) < now() - interval '2 years'
     AND (full_name IS NOT NULL OR first_name IS NOT NULL OR last_name IS NOT NULL
          OR utm IS NOT NULL OR source IS NOT NULL OR source_detail IS NOT NULL);
  GET DIAGNOSTICS n_contacts_scrubbed = ROW_COUNT;

  UPDATE events SET payload = NULL
   WHERE occurred_at < now() - interval '2 years' AND payload IS NOT NULL
     AND event_type NOT LIKE 'unsubscribed%';
  GET DIAGNOSTICS n_events_scrubbed = ROW_COUNT;

  DELETE FROM events
   WHERE occurred_at < now() - interval '5 years' AND event_type NOT LIKE 'unsubscribed%';
  GET DIAGNOSTICS n_events_removed = ROW_COUNT;

  DELETE FROM contacts
   WHERE coalesce(last_touch_at, created_at) < now() - interval '5 years'
     AND NOT (unsubscribed_email OR unsubscribed_sms OR do_not_call);
  GET DIAGNOSTICS n_contacts_removed = ROW_COUNT;

  -- Newsletter: a sign-up never confirmed, with the confirmation email's record.
  DELETE FROM newsletter_deliveries
   WHERE subscription_id IN (
     SELECT id FROM newsletter_subscriptions
      WHERE status = 'pending' AND confirmed_at IS NULL AND requested_at < now() - interval '30 days');
  GET DIAGNOSTICS n_pending_mail_removed = ROW_COUNT;

  DELETE FROM newsletter_subscriptions
   WHERE status = 'pending' AND confirmed_at IS NULL AND requested_at < now() - interval '30 days';
  GET DIAGNOSTICS n_pending_removed = ROW_COUNT;

  -- A confirmed subscription nothing has been sent to, and nothing has changed on, for 5 years.
  DELETE FROM newsletter_subscriptions s
   WHERE s.status = 'confirmed'
     AND greatest(s.updated_at, s.requested_at, coalesce(s.confirmed_at, s.requested_at)) < now() - interval '5 years'
     AND NOT EXISTS (
       SELECT 1 FROM newsletter_deliveries d
        WHERE d.subscription_id = s.id AND d.created_at >= now() - interval '5 years');
  GET DIAGNOSTICS n_idle_removed = ROW_COUNT;

  -- Who was sent which newsletter email, and whether it was delivered: 2 years.
  DELETE FROM newsletter_deliveries WHERE created_at < now() - interval '2 years';
  GET DIAGNOSTICS n_newsletter_mail_removed = ROW_COUNT;

  DELETE FROM ops_runs WHERE started_at < now() - interval '180 days';
  GET DIAGNOSTICS n_ops_removed = ROW_COUNT;
  DELETE FROM ops_alerts WHERE last_sent_at < now() - interval '180 days';

  result := jsonb_build_object(
    'deliveries_removed', n_deliveries, 'leads_scrubbed', n_leads_scrubbed, 'leads_removed', n_leads_removed,
    'contacts_scrubbed', n_contacts_scrubbed, 'events_scrubbed', n_events_scrubbed,
    'events_removed', n_events_removed, 'contacts_removed', n_contacts_removed,
    'pending_subscriptions_removed', n_pending_removed, 'pending_confirmations_removed', n_pending_mail_removed,
    'idle_subscriptions_removed', n_idle_removed, 'newsletter_deliveries_removed', n_newsletter_mail_removed,
    'ops_runs_removed', n_ops_removed, 'ran_at', now());

  INSERT INTO ops_runs (job, outcome, started_at, finished_at, summary)
  VALUES ('retention-purge', 'ok', started, clock_timestamp(), result);

  RETURN result;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.retention_purge() FROM PUBLIC, anon, authenticated;

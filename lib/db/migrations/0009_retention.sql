-- ============================================================================
-- 0009_retention.sql
--
-- Nightly retention for the personal data the site keeps. Home Platform is the
-- CRM and tracks who became a client, so the site database applies one rule
-- to everyone:
--   * lead_deliveries: deleted after 90 days.
--   * leads: after 2 years only the consent proof stays (form, email, phone,
--     consent flags, consent time, wording version); deleted after 5 years.
--   * contacts: no contact for 2 years -> names, source and UTM cleared;
--     no contact for 5 years -> deleted, unless they unsubscribed or asked not
--     to be called, in which case email, phone and those flags stay for good.
--   * events: details cleared after 2 years, removed after 5; unsubscribe
--     entries stay as part of the opt-out record.
-- 5 years covers the 4-year window for TCPA claims. Questionnaire answers are
-- deleted by hand once the site copy is final.
--
-- Runs at 07:17 UTC every day through pg_cron. The function is SECURITY
-- DEFINER, so execute is revoked from the API roles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.retention_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_deliveries int; n_leads_scrubbed int; n_leads_removed int;
  n_contacts_scrubbed int; n_events_scrubbed int; n_events_removed int; n_contacts_removed int;
BEGIN
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

  RETURN jsonb_build_object(
    'deliveries_removed', n_deliveries, 'leads_scrubbed', n_leads_scrubbed, 'leads_removed', n_leads_removed,
    'contacts_scrubbed', n_contacts_scrubbed, 'events_scrubbed', n_events_scrubbed,
    'events_removed', n_events_removed, 'contacts_removed', n_contacts_removed, 'ran_at', now());
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.retention_purge() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
--> statement-breakpoint
GRANT USAGE ON SCHEMA cron TO postgres;
--> statement-breakpoint
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'retention-purge';
--> statement-breakpoint
SELECT cron.schedule('retention-purge', '17 7 * * *', 'SELECT public.retention_purge()');

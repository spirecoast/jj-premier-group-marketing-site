-- ============================================================================
-- 0017_places_visitors.sql
--
-- places_visitors: how many Google Places lists one visitor has opened on
-- each Pacific-time day. lib/places/budget.ts counts a visitor's list before
-- it counts against the site-wide cap in places_usage (0014), and refuses it
-- past PLACES_VISITOR_CAP, so one person (or one script) can't use up the
-- day's 30 calls for everyone. A visitor is a SHA-256 of the day and the
-- address the request came from, never the address itself; rows older than
-- two days are deleted by the site as it goes.
--
-- Additive only: one new table, RLS on with no policies and every grant
-- revoked from the API roles (the site uses DATABASE_URL). Re-runnable. The
-- site works before this is applied: without the table there is no
-- per-visitor count (logged once) and the site-wide cap still holds.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "places_visitors" (
	"day" date NOT NULL,
	"visitor" text NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "places_visitors_day_visitor_pk" PRIMARY KEY("day","visitor")
);
--> statement-breakpoint
ALTER TABLE "places_visitors" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "places_visitors" FROM anon, authenticated;

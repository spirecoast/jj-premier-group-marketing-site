-- ============================================================================
-- 0014_places_usage.sql
--
-- places_usage: how many calls the site has made to Google Places on each
-- Pacific-time day, per billing SKU ('nearby' | 'text'). lib/places/budget.ts
-- counts each call before it's made and refuses it past 30 a day or 900 a
-- month, inside Google's 1,000 free calls a month per SKU. The site also
-- creates this table on first use, so the cap works before this is run.
--
-- Additive only: one new table, RLS on with no policies and every grant
-- revoked from the API roles (the site uses DATABASE_URL). Re-runnable.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "places_usage" (
	"day" date NOT NULL,
	"sku" text NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "places_usage_day_sku_pk" PRIMARY KEY("day","sku")
);
--> statement-breakpoint
ALTER TABLE "places_usage" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE "places_usage" FROM anon, authenticated;

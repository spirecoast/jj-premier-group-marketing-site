-- ============================================================================
-- 0019_client_rooms.sql
--
-- Client rooms: a private page per client at /room/<token>, made and kept by
-- the team from their own private links (/q/<token>/rooms). One row per room.
-- Only the SHA-256 of the room's token is stored; the raw link is shown to the
-- agent once, when it is made or remade, and never kept (lib/room/store.ts).
--
-- name is the client's first name, as the agent typed it; content is the
-- room itself (saved places, plan links, the guide step, notes) as JSON, read
-- back through lib/room/model.ts so an older shape never breaks a page.
--
-- IF NOT EXISTS because lib/room/store.ts runs the same statements once per
-- server process before its first read or write, so the table may already be
-- there when this migration runs. Additive only.
--
-- RLS enabled, no policies: the anon/authenticated roles can read nothing.
-- The server reads and writes through the postgres role (DATABASE_URL).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "client_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'buying' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "client_rooms_token_hash_idx" ON "client_rooms" ("token_hash");
--> statement-breakpoint
ALTER TABLE "client_rooms" ENABLE ROW LEVEL SECURITY;

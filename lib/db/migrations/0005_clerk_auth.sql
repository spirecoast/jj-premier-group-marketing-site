-- ============================================================================
-- 0005_clerk_auth.sql
--
-- Swap auth provider: Supabase Auth → Clerk.
--
-- 1. Drop SELECT policies that depended on is_active_agent() (which used
--    auth.uid() — Supabase-specific). With Clerk owning auth, auth.uid() is
--    null on every request and those policies are useless.
-- 2. Drop is_active_agent() — irrelevant under Clerk.
-- 3. Replace agents.auth_user_id (uuid, Supabase) with agents.clerk_user_id
--    (text, Clerk).
--
-- RLS stays enabled on every table. With no policies, the anon and authenticated
-- roles can read/write nothing. Server actions continue to bypass RLS via the
-- postgres role (DATABASE_URL connection). All read paths in /portal go through
-- Drizzle, never through the Supabase JS client.
-- ============================================================================

DROP POLICY IF EXISTS "agents_read_contacts" ON public.contacts;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_events" ON public.events;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_agents" ON public.agents;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_update_self" ON public.agents;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_sequences" ON public.sequences;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_sequence_enrollments" ON public.sequence_enrollments;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_lead_routing_rules" ON public.lead_routing_rules;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_tasks" ON public.tasks;
--> statement-breakpoint

DROP FUNCTION IF EXISTS public.is_active_agent();
--> statement-breakpoint

ALTER TABLE "agents" DROP COLUMN IF EXISTS "auth_user_id";
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "clerk_user_id" text;
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_clerk_user_id_unique" UNIQUE ("clerk_user_id");

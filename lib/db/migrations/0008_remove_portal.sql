-- ============================================================================
-- 0008_remove_portal.sql
--
-- The team's CRM is Coldwell Banker's Home Platform. The site no longer has
-- its own agent portal, agents, tasks, sequences or lead routing, so their
-- tables, policies, helper function, foreign keys and columns go.
--
-- Kept: contacts, events, leads, lead_deliveries, questionnaire_answers.
-- On contacts, only the columns that served the portal are dropped (agent
-- assignment, scoring, next action, birthday, home purchase date);
-- lifecycle_stage, first_touch_at and last_touch_at stay because
-- lib/lead-pipeline.ts and app/unsubscribe still write them.
--
-- IF EXISTS everywhere, so this runs cleanly whether or not 0002/0005 were
-- applied in full. agents.auth_user_id / clerk_user_id go with the table.
-- ============================================================================

-- Policies from 0002/0003 (0005 dropped them; repeated in case it did not run).
DROP POLICY IF EXISTS "agents_read_contacts" ON public.contacts;
--> statement-breakpoint
DROP POLICY IF EXISTS "agents_read_events" ON public.events;
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.agents') IS NOT NULL THEN
    DROP POLICY IF EXISTS "agents_read_agents" ON public.agents;
    DROP POLICY IF EXISTS "agents_update_self" ON public.agents;
  END IF;
  IF to_regclass('public.sequences') IS NOT NULL THEN
    DROP POLICY IF EXISTS "agents_read_sequences" ON public.sequences;
  END IF;
  IF to_regclass('public.sequence_enrollments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "agents_read_sequence_enrollments" ON public.sequence_enrollments;
  END IF;
  IF to_regclass('public.lead_routing_rules') IS NOT NULL THEN
    DROP POLICY IF EXISTS "agents_read_lead_routing_rules" ON public.lead_routing_rules;
  END IF;
  IF to_regclass('public.tasks') IS NOT NULL THEN
    DROP POLICY IF EXISTS "agents_read_tasks" ON public.tasks;
  END IF;
END $$;
--> statement-breakpoint
DROP FUNCTION IF EXISTS public.is_active_agent();
--> statement-breakpoint

-- Foreign keys from the kept tables to agents.
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_primary_agent_id_agents_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_agent_id_agents_id_fk";
--> statement-breakpoint

-- Indexes on the contacts columns being dropped.
DROP INDEX IF EXISTS "contacts_primary_agent_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_score_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_next_action_idx";
--> statement-breakpoint

-- Portal-only tables, children first (their indexes and FKs go with them).
DROP TABLE IF EXISTS "tasks";
--> statement-breakpoint
DROP TABLE IF EXISTS "sequence_enrollments";
--> statement-breakpoint
DROP TABLE IF EXISTS "sequences";
--> statement-breakpoint
DROP TABLE IF EXISTS "lead_routing_rules";
--> statement-breakpoint
DROP TABLE IF EXISTS "agents";
--> statement-breakpoint

-- Agent and CRM-only columns.
ALTER TABLE "events" DROP COLUMN IF EXISTS "agent_id";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "primary_agent_id";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "score";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "temperature";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "last_score_update";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "next_action_due_at";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "birthday";
--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "home_purchase_date";

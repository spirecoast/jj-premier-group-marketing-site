CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"contact_id" uuid,
	"transaction_id" uuid,
	"listing_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"priority" text DEFAULT 'normal',
	"source" text,
	"failsafe_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "temperature" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "last_score_update" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_agents_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_agent_due_idx" ON "tasks" USING btree ("agent_id","due_at") WHERE "tasks"."completed_at" is null;--> statement-breakpoint
CREATE INDEX "tasks_contact_idx" ON "tasks" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "tasks_failsafe_open_idx" ON "tasks" USING btree ("contact_id","failsafe_type") WHERE "tasks"."completed_at" is null;--> statement-breakpoint
CREATE INDEX "contacts_score_idx" ON "contacts" USING btree ("score" DESC NULLS LAST);--> statement-breakpoint

-- RLS for tasks: deny-by-default + read for active agents (matches 0002 pattern).
-- Writes happen via server actions (postgres role, RLS-bypassing) for now.
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "agents_read_tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_active_agent());
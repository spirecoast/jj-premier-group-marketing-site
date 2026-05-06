CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_agent_id" uuid,
	"full_name" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"preferred_channel" text,
	"type" text[] DEFAULT '{lead}'::text[],
	"lifecycle_stage" text DEFAULT 'new',
	"source" text,
	"source_detail" text,
	"utm" jsonb,
	"consent_email" boolean DEFAULT false NOT NULL,
	"consent_email_at" timestamp with time zone,
	"consent_sms" boolean DEFAULT false NOT NULL,
	"consent_sms_at" timestamp with time zone,
	"consent_sms_method" text,
	"unsubscribed_email" boolean DEFAULT false NOT NULL,
	"unsubscribed_sms" boolean DEFAULT false NOT NULL,
	"do_not_call" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_touch_at" timestamp with time zone,
	"last_touch_at" timestamp with time zone,
	"next_action_due_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"contact_id" uuid,
	"agent_id" uuid,
	"listing_id" uuid,
	"transaction_id" uuid,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_lifecycle_stage_idx" ON "contacts" USING btree ("lifecycle_stage");--> statement-breakpoint
CREATE INDEX "contacts_primary_agent_idx" ON "contacts" USING btree ("primary_agent_id");--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contacts_next_action_idx" ON "contacts" USING btree ("next_action_due_at") WHERE "contacts"."next_action_due_at" is not null;--> statement-breakpoint
CREATE INDEX "events_contact_idx" ON "events" USING btree ("contact_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("event_type","occurred_at" DESC NULLS LAST);--> statement-breakpoint

-- Row Level Security: deny-by-default until policies ship in Phase 5 (CRM dashboard / portal).
-- The Drizzle/postgres-js connection uses the postgres role, which bypasses RLS,
-- so server actions still write. The Supabase JS client (anon/authenticated roles)
-- gets nothing without an explicit policy.
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
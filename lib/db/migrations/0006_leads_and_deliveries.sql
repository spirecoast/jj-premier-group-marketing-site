-- ============================================================================
-- 0006_leads_and_deliveries.sql
--
-- Every public form submission is written here BEFORE any delivery attempt
-- (CRM webhook, Follow Up Boss, team email). `leads` is the mirror of record;
-- `lead_deliveries` records what each sink said. The contacts/events rows the
-- portal reads are still written alongside (see lib/lead-pipeline.ts).
--
-- RLS enabled, no policies: the anon/authenticated roles can read nothing.
-- Server actions write through the postgres role (DATABASE_URL), as elsewhere.
-- ============================================================================

CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid,
	"form" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"market" text,
	"property_address" text,
	"timing" text,
	"sell_first" text,
	"consent_email" boolean DEFAULT false NOT NULL,
	"consent_sms" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_wording_version" text,
	"source" jsonb,
	"payload" jsonb,
	"is_test" boolean DEFAULT false NOT NULL,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"delivery_error" text,
	"delivered_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"sink" text NOT NULL,
	"status" text NOT NULL,
	"status_code" integer,
	"attempts" integer DEFAULT 1 NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_deliveries" ADD CONSTRAINT "lead_deliveries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_submitted_idx" ON "leads" USING btree ("submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_delivery_status_idx" ON "leads" USING btree ("delivery_status") WHERE "leads"."delivery_status" <> 'delivered';--> statement-breakpoint
CREATE INDEX "lead_deliveries_lead_idx" ON "lead_deliveries" USING btree ("lead_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_deliveries" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"license_number" text NOT NULL,
	"brokerage" text,
	"bio" text,
	"headshot_url" text,
	"phone" text,
	"call_rail_phone_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lead_routing_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"match_conditions" jsonb NOT NULL,
	"agent_id" uuid NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sequence_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"sequence_id" uuid NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"paused_reason" text,
	"completed_at" timestamp with time zone,
	"unenrolled_at" timestamp with time zone,
	"unenrolled_reason" text
);
--> statement-breakpoint
CREATE TABLE "sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger" text NOT NULL,
	"steps" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sequences_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "lead_routing_rules" ADD CONSTRAINT "lead_routing_rules_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."sequences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_routing_rules_priority_idx" ON "lead_routing_rules" USING btree ("priority") WHERE "lead_routing_rules"."active" = true;--> statement-breakpoint
CREATE INDEX "sequence_enrollments_contact_idx" ON "sequence_enrollments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_sequence_idx" ON "sequence_enrollments" USING btree ("sequence_id");--> statement-breakpoint
CREATE INDEX "sequence_enrollments_active_idx" ON "sequence_enrollments" USING btree ("contact_id","sequence_id") WHERE "sequence_enrollments"."completed_at" is null and "sequence_enrollments"."unenrolled_at" is null;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_primary_agent_id_agents_id_fk" FOREIGN KEY ("primary_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Row Level Security: deny-by-default. Authenticated-agent policies land with
-- the /portal dashboard slice. Server-side writes via postgres-js bypass RLS.
ALTER TABLE "agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sequences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sequence_enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_routing_rules" ENABLE ROW LEVEL SECURITY;
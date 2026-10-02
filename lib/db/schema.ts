import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * agents — the team. Two rows for now (mom + girlfriend) but the table scales.
 * `clerk_user_id` links to the Clerk user (id like "user_xxxxx"); set on first
 * portal visit when an authenticated Clerk user matches an agent row by email.
 */
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  licenseNumber: text("license_number").notNull(),
  brokerage: text("brokerage"),
  bio: text("bio"),
  headshotUrl: text("headshot_url"),
  phone: text("phone"),
  callRailPhoneId: text("call_rail_phone_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * contacts — every person the team has touched (lead, buyer, seller, sphere).
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    primaryAgentId: uuid("primary_agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),

    fullName: text("full_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    preferredChannel: text("preferred_channel"),

    type: text("type")
      .array()
      .default(sql`'{lead}'::text[]`),
    lifecycleStage: text("lifecycle_stage").default("new"),
    source: text("source"),
    sourceDetail: text("source_detail"),
    utm: jsonb("utm"),

    consentEmail: boolean("consent_email").default(false).notNull(),
    consentEmailAt: timestamp("consent_email_at", { withTimezone: true }),
    consentSms: boolean("consent_sms").default(false).notNull(),
    consentSmsAt: timestamp("consent_sms_at", { withTimezone: true }),
    consentSmsMethod: text("consent_sms_method"),
    unsubscribedEmail: boolean("unsubscribed_email").default(false).notNull(),
    unsubscribedSms: boolean("unsubscribed_sms").default(false).notNull(),
    doNotCall: boolean("do_not_call").default(false).notNull(),

    score: integer("score").default(0).notNull(),
    temperature: text("temperature"),
    lastScoreUpdate: timestamp("last_score_update", { withTimezone: true }),

    /** Personal context — drives sphere management failsafes (birthday, anniversary). */
    birthday: date("birthday"),
    homePurchaseDate: date("home_purchase_date"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    firstTouchAt: timestamp("first_touch_at", { withTimezone: true }),
    lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
    nextActionDueAt: timestamp("next_action_due_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("contacts_lifecycle_stage_idx").on(table.lifecycleStage),
    index("contacts_primary_agent_idx").on(table.primaryAgentId),
    index("contacts_email_idx").on(table.email),
    index("contacts_score_idx").on(table.score.desc()),
    index("contacts_next_action_idx")
      .on(table.nextActionDueAt)
      .where(sql`${table.nextActionDueAt} is not null`),
  ],
);

/**
 * events — append-only canonical activity log (ARCHITECTURE.md §5).
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    agentId: uuid("agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    listingId: uuid("listing_id"),
    transactionId: uuid("transaction_id"),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_contact_idx").on(table.contactId, table.occurredAt.desc()),
    index("events_type_idx").on(table.eventType, table.occurredAt.desc()),
  ],
);

/**
 * sequences — nurture campaign templates (welcome series, cold reactivation, etc.).
 * `steps` is a jsonb array: [{day_offset, channel, template_key, condition?}].
 */
export const sequences = pgTable("sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(),
  steps: jsonb("steps").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * sequence_enrollments — a contact's progress through a sequence.
 * Inngest schedules step delivery; this table holds state.
 */
export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .references(() => contacts.id, { onDelete: "cascade" })
      .notNull(),
    sequenceId: uuid("sequence_id")
      .references(() => sequences.id, { onDelete: "cascade" })
      .notNull(),
    currentStep: integer("current_step").notNull().default(0),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    paused: boolean("paused").notNull().default(false),
    pausedReason: text("paused_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    unenrolledAt: timestamp("unenrolled_at", { withTimezone: true }),
    unenrolledReason: text("unenrolled_reason"),
  },
  (table) => [
    index("sequence_enrollments_contact_idx").on(table.contactId),
    index("sequence_enrollments_sequence_idx").on(table.sequenceId),
    index("sequence_enrollments_active_idx")
      .on(table.contactId, table.sequenceId)
      .where(
        sql`${table.completedAt} is null and ${table.unenrolledAt} is null`,
      ),
  ],
);

/**
 * tasks — agent to-dos. Sources: 'manual' (created in /portal), 'failsafe'
 * (auto-created by Inngest when a deadline or no-touch threshold is hit),
 * 'sequence' (Phase 8+), 'agent_ai' (Phase 7+).
 *
 * transactionId / listingId columns exist per §5 but are unconstrained until
 * those tables land in Phases 3/5.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    transactionId: uuid("transaction_id"),
    listingId: uuid("listing_id"),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => agents.id, {
      onDelete: "set null",
    }),
    priority: text("priority").default("normal"),
    source: text("source"),
    failsafeType: text("failsafe_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_agent_due_idx")
      .on(table.agentId, table.dueAt)
      .where(sql`${table.completedAt} is null`),
    index("tasks_contact_idx").on(table.contactId),
    index("tasks_failsafe_open_idx")
      .on(table.contactId, table.failsafeType)
      .where(sql`${table.completedAt} is null`),
  ],
);

/**
 * lead_routing_rules — priority-ordered match rules that assign primary_agent_id
 * at contact creation. Per ARCHITECTURE.md §10:
 *   Existing relationship (handled in code) → location → intent → load → fallback.
 *
 * `match_conditions` is a jsonb predicate evaluated by the routing engine, e.g.
 *   { "intent": "buy" }
 *   { "neighborhood_in": ["country-club-east", "esplanade"] }
 *   { "source_in": ["organic", "paid_search"] }
 */
export const leadRoutingRules = pgTable(
  "lead_routing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    priority: integer("priority").notNull().default(100),
    matchConditions: jsonb("match_conditions").notNull(),
    agentId: uuid("agent_id")
      .references(() => agents.id, { onDelete: "cascade" })
      .notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("lead_routing_rules_priority_idx")
      .on(table.priority)
      .where(sql`${table.active} = true`),
  ],
);

/**
 * leads — one row per public form submission, written before any delivery is
 * attempted. This is the mirror of record: whatever the CRM, Zapier or Resend
 * do afterwards, the lead is here. `contact_id` links the contacts row the
 * portal reads; `payload` is the exact JSON sent to the CRM webhook.
 *
 * `delivery_status` summarises the CRM attempt: 'pending' until tried,
 * 'delivered', 'failed', or 'skipped' (no provider configured).
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    form: text("form").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message"),
    market: text("market"),
    propertyAddress: text("property_address"),
    timing: text("timing"),
    sellFirst: text("sell_first"),
    consentEmail: boolean("consent_email").default(false).notNull(),
    consentSms: boolean("consent_sms").default(false).notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    consentWordingVersion: text("consent_wording_version"),
    source: jsonb("source"),
    payload: jsonb("payload"),
    isTest: boolean("is_test").default(false).notNull(),
    deliveryStatus: text("delivery_status").default("pending").notNull(),
    deliveryError: text("delivery_error"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("leads_submitted_idx").on(table.submittedAt.desc()),
    index("leads_email_idx").on(table.email),
    index("leads_delivery_status_idx")
      .on(table.deliveryStatus)
      .where(sql`${table.deliveryStatus} <> 'delivered'`),
  ],
);

/**
 * lead_deliveries — one row per sink per lead: what was tried, what came back.
 * sink: 'crm_webhook' | 'fub' | 'team_email' | 'plausible'.
 * status: 'ok' | 'failed' | 'skipped'.
 */
export const leadDeliveries = pgTable(
  "lead_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    sink: text("sink").notNull(),
    status: text("status").notNull(),
    statusCode: integer("status_code"),
    attempts: integer("attempts").default(1).notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("lead_deliveries_lead_idx").on(table.leadId, table.createdAt.desc())],
);

/**
 * questionnaire_answers — the website questionnaire behind the private /q links.
 * One row per person per question; respondent is 'joelyn' or 'jessica'.
 * value is the free text, choice the picked option (null when none).
 * The ids and wording of the questions live in lib/questionnaire/questions.ts.
 */
export const questionnaireAnswers = pgTable(
  "questionnaire_answers",
  {
    respondent: text("respondent").notNull(),
    questionId: text("question_id").notNull(),
    value: text("value"),
    choice: text("choice"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.respondent, table.questionId] })],
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Sequence = typeof sequences.$inferSelect;
export type NewSequence = typeof sequences.$inferInsert;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type NewSequenceEnrollment = typeof sequenceEnrollments.$inferInsert;
export type LeadRoutingRule = typeof leadRoutingRules.$inferSelect;
export type NewLeadRoutingRule = typeof leadRoutingRules.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadDelivery = typeof leadDeliveries.$inferSelect;
export type NewLeadDelivery = typeof leadDeliveries.$inferInsert;
export type NewTask = typeof tasks.$inferInsert;
export type QuestionnaireAnswer = typeof questionnaireAnswers.$inferSelect;
export type NewQuestionnaireAnswer = typeof questionnaireAnswers.$inferInsert;

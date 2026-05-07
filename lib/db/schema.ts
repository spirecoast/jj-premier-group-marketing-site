import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
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
export type NewTask = typeof tasks.$inferInsert;

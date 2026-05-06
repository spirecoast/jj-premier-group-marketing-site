import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * contacts — every person the team has touched (lead, buyer, seller, sphere).
 * Phase 2 slice from ARCHITECTURE.md §5; deferred fields (score, buyer_profile,
 * current_address, pre-approval, personal context) land in Phase 4/5.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    primaryAgentId: uuid("primary_agent_id"), // FK added when agents table lands

    fullName: text("full_name"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    preferredChannel: text("preferred_channel"), // 'email' | 'sms' | 'phone'

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
    index("contacts_next_action_idx")
      .on(table.nextActionDueAt)
      .where(sql`${table.nextActionDueAt} is not null`),
  ],
);

/**
 * events — append-only canonical activity log (ARCHITECTURE.md §5).
 * Distinct from `interactions` (Phase 5+), which is the human-readable view of
 * email/sms/call/meeting threads. `events` is for analytics + reconstruction.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
    }),
    agentId: uuid("agent_id"),
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

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

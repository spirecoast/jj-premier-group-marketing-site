import { sql } from "drizzle-orm";
import {
  boolean,
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
 * contacts — the person behind each public form submission (written by
 * lib/lead-pipeline.ts) and their consent record: email, call/text,
 * unsubscribes. The team's CRM is Coldwell Banker's Home Platform; this table
 * is only the site's mirror.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    firstTouchAt: timestamp("first_touch_at", { withTimezone: true }),
    lastTouchAt: timestamp("last_touch_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("contacts_lifecycle_stage_idx").on(table.lifecycleStage),
    index("contacts_email_idx").on(table.email),
  ],
);

/**
 * events — append-only activity log for contacts (form submits, unsubscribes).
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: text("event_type").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, {
      onDelete: "cascade",
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
 * leads — one row per public form submission, written before any delivery is
 * attempted. This is the mirror of record: whatever the CRM, Zapier or Resend
 * do afterwards, the lead is here. `contact_id` links the contacts row;
 * `payload` is the exact JSON sent to the CRM webhook.
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

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadDelivery = typeof leadDeliveries.$inferSelect;
export type NewLeadDelivery = typeof leadDeliveries.$inferInsert;
export type QuestionnaireAnswer = typeof questionnaireAnswers.$inferSelect;
export type NewQuestionnaireAnswer = typeof questionnaireAnswers.$inferInsert;

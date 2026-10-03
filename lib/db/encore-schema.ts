import { sql } from "drizzle-orm";
import { bigint, boolean, check, date, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Encore, the arts calendar (migration 0012_encore.sql). Kept in its own
 * file and re-exported from schema.ts. RLS on, no policies: the site and
 * the collector use DATABASE_URL.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });

export const encoreVenues = pgTable("encore_venues", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  address: text("address"),
  city: text("city"),
  market: text("market"),
  website: text("website"),
  eventsUrl: text("events_url"),
  residentCompanies: text("resident_companies").array().notNull().default(sql`'{}'::text[]`),
  notes: text("notes"),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const encoreSources = pgTable(
  "encore_sources",
  {
    id: text("id").primaryKey(),
    domain: text("domain").notNull(),
    adapter: text("adapter").notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    frequency: text("frequency").notNull().default("weekly"),
    presenter: text("presenter"),
    venueKey: text("venue_key"),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: ts("last_run_at"),
    lastOkAt: ts("last_ok_at"),
    lastError: text("last_error"),
    lastErrorAt: ts("last_error_at"),
    failures: integer("failures").notNull().default(0),
    contentHash: text("content_hash"),
    etag: text("etag"),
    lastModified: text("last_modified"),
    eventsFound: integer("events_found"),
    performancesFound: integer("performances_found"),
    matched: integer("matched"),
    queued: integer("queued"),
    warnings: jsonb("warnings").$type<string[]>().notNull().default([]),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [check("encore_sources_frequency_check", sql`${t.frequency} in ('daily', 'weekly', 'monthly', 'manual')`)],
);

export const encoreEvents = pgTable(
  "encore_events",
  {
    slug: text("slug").primaryKey(),
    title: text("title").notNull(),
    presenter: text("presenter"),
    market: text("market").notNull(),
    category: text("category").notNull(),
    siteCategory: text("site_category").notNull(),
    subcategory: text("subcategory"),
    venueKey: text("venue_key").references(() => encoreVenues.key, { onUpdate: "cascade" }),
    venueName: text("venue_name"),
    room: text("room"),
    city: text("city"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    startTime: text("start_time"),
    recurrence: text("recurrence"),
    price: text("price"),
    priceMin: money("price_min"),
    priceMax: money("price_max"),
    ticketUrl: text("ticket_url"),
    sources: text("sources").array().notNull().default(sql`'{}'::text[]`),
    description: text("description"),
    status: text("status").notNull().default("scheduled"),
    notes: text("notes"),
    sourceId: text("source_id").references(() => encoreSources.id, { onDelete: "set null" }),
    externalId: text("external_id"),
    hidden: boolean("hidden").notNull().default(false),
    origin: text("origin").notNull().default("seed"),
    firstSeenAt: ts("first_seen_at").defaultNow().notNull(),
    lastSeenAt: ts("last_seen_at"),
    checkedAt: ts("checked_at"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [
    check("encore_events_status_check", sql`${t.status} in ('scheduled', 'announced', 'sold-out', 'cancelled', 'postponed')`),
    check("encore_events_origin_check", sql`${t.origin} in ('seed', 'collector', 'review')`),
    index("encore_events_venue_idx").on(t.venueKey),
    index("encore_events_source_idx").on(t.sourceId, t.externalId),
  ],
);

export const encorePerformances = pgTable(
  "encore_performances",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    eventSlug: text("event_slug")
      .notNull()
      .references(() => encoreEvents.slug, { onDelete: "cascade", onUpdate: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    time: text("time").notNull().default(""),
    status: text("status").notNull().default("scheduled"),
    availability: text("availability").notNull().default("unknown"),
    priceMin: money("price_min"),
    priceMax: money("price_max"),
    currency: text("currency").notNull().default("USD"),
    ticketUrl: text("ticket_url"),
    sourceUrl: text("source_url"),
    lastSeenAt: ts("last_seen_at"),
    checkedAt: ts("checked_at"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [
    check("encore_performances_status_check", sql`${t.status} in ('scheduled', 'cancelled', 'postponed', 'removed')`),
    check("encore_performances_availability_check", sql`${t.availability} in ('on-sale', 'few-left', 'sold-out', 'not-on-sale', 'unknown')`),
    uniqueIndex("encore_performances_event_date_time_key").on(t.eventSlug, t.date, t.time),
    index("encore_performances_date_idx").on(t.date),
  ],
);

export const encoreChecks = pgTable(
  "encore_checks",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    performanceId: bigint("performance_id", { mode: "number" })
      .notNull()
      .references(() => encorePerformances.id, { onDelete: "cascade" }),
    run: text("run").notNull().default("check"),
    status: text("status").notNull(),
    availability: text("availability").notNull(),
    priceMin: money("price_min"),
    priceMax: money("price_max"),
    currency: text("currency").notNull().default("USD"),
    sourceUrl: text("source_url"),
    checkedAt: ts("checked_at").defaultNow().notNull(),
  },
  (t) => [check("encore_checks_run_check", sql`${t.run} in ('collect', 'check')`), index("encore_checks_performance_idx").on(t.performanceId, t.checkedAt)],
);

export const encoreReviewQueue = pgTable(
  "encore_review_queue",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("pending"),
    fingerprint: text("fingerprint").notNull(),
    sourceId: text("source_id").references(() => encoreSources.id, { onDelete: "set null" }),
    eventSlug: text("event_slug"),
    title: text("title").notNull(),
    sourceUrl: text("source_url"),
    firstDate: date("first_date", { mode: "string" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    proposed: jsonb("proposed").$type<Record<string, unknown>>().notNull().default({}),
    note: text("note"),
    seenCount: integer("seen_count").notNull().default(1),
    lastSeenAt: ts("last_seen_at").defaultNow().notNull(),
    reviewedAt: ts("reviewed_at"),
    reviewedBy: text("reviewed_by"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [
    check("encore_review_queue_kind_check", sql`${t.kind} in ('new-event', 'change', 'removed', 'source')`),
    check("encore_review_queue_status_check", sql`${t.status} in ('pending', 'approved', 'rejected', 'merged')`),
    uniqueIndex("encore_review_queue_fingerprint_key").on(t.fingerprint),
    index("encore_review_queue_status_idx").on(t.status, t.firstDate),
  ],
);

export const encoreImages = pgTable("encore_images", {
  eventSlug: text("event_slug")
    .primaryKey()
    .references(() => encoreEvents.slug, { onDelete: "cascade", onUpdate: "cascade" }),
  imageSourceUrl: text("image_source_url").notNull(),
  pageUrl: text("page_url"),
  credit: text("credit").notNull(),
  alt: text("alt"),
  storagePath: text("storage_path"),
  publicUrl: text("public_url"),
  width: integer("width"),
  height: integer("height"),
  sha256: text("sha256"),
  hidden: boolean("hidden").notNull().default(false),
  error: text("error"),
  fetchedAt: ts("fetched_at"),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
});

export const encoreRuns = pgTable(
  "encore_runs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    kind: text("kind").notNull(),
    startedAt: ts("started_at").defaultNow().notNull(),
    finishedAt: ts("finished_at"),
    sources: integer("sources").notNull().default(0),
    remaining: integer("remaining"),
    stats: jsonb("stats").$type<Record<string, unknown>>().notNull().default({}),
    error: text("error"),
  },
  (t) => [check("encore_runs_kind_check", sql`${t.kind} in ('collect', 'check', 'seed', 'images')`), index("encore_runs_started_idx").on(t.kind, t.startedAt)],
);

export type EncoreVenueRow = typeof encoreVenues.$inferSelect;
export type EncoreEventRow = typeof encoreEvents.$inferSelect;
export type EncorePerformanceRow = typeof encorePerformances.$inferSelect;
export type EncoreSourceRow = typeof encoreSources.$inferSelect;
export type EncoreImageRow = typeof encoreImages.$inferSelect;
export type EncoreReviewRow = typeof encoreReviewQueue.$inferSelect;

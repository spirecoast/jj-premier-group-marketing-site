import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import { RATE_LIMITS, guardKey, windowStart } from "@/lib/lead-guard-keys";

/**
 * What stands between a public form and a flood (migration 0015):
 *
 * - A submission id. Each form makes a random id for the attempt it sends;
 *   the first time the server sees it, it's claimed. The same id again (a
 *   retry after a dropped response, a replayed request) is answered with the
 *   success the first one got, and nothing is sent twice.
 * - A rate limit kept in Postgres, like the Places cap: 6 sends per network
 *   address per 10 minutes and 4 per email or phone per hour. Past either,
 *   the visitor sees the usual success and the lead is kept as
 *   `suspected_bot`, sent nowhere. The address is never stored: the key is a
 *   hash of it with the window's start time, so it can't be followed from one
 *   window to the next, and rows older than a day are deleted.
 * - The honeypot (the hidden "website" box) gets the same treatment.
 *
 * Every check fails open: if the database is missing, asleep or not yet
 * migrated, the lead goes through as it always has. A guard must never be
 * the reason a real enquiry is lost.
 */

/** Past this many sends in a window from one address, suspected leads aren't kept either: a flood shouldn't fill the table. */
const KEEP_SUSPECTS_UP_TO = 30;

const MIGRATION = "0015_lead_guard_and_outbox.sql";

function warn(err: unknown, what: string): void {
  if (isMissingTable(err)) warnMissingTable(what, MIGRATION);
  else console.error(`[lead-guard] ${what}:`, err instanceof Error ? err.message : err);
}

async function hit(kind: "address" | "person", value: string, now: Date): Promise<number | null> {
  const limit = RATE_LIMITS[kind];
  const start = windowStart(now, limit.windowMinutes);
  const rows = await getDb().execute<{ hits: number }>(sql`
    INSERT INTO lead_rate_limits (key, window_start, hits) VALUES (${guardKey(kind, value, start)}, ${start.toISOString()}::timestamptz, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET hits = lead_rate_limits.hits + 1
    RETURNING hits
  `);
  return rows[0]?.hits ?? null;
}

export type GuardVerdict =
  | { action: "accept" }
  /** Seen before: answer as the first one was answered. */
  | { action: "duplicate" }
  /** Keep it, send it nowhere. `keep` is false once a flood is past the point of keeping each one. */
  | { action: "suspect"; reason: "honeypot" | "rate"; keep: boolean };

/**
 * Decide what to do with a submission that passed validation. `person` is the
 * email, or the phone when there's no email; `address` the network address.
 */
export async function checkSubmission(input: { submissionId?: string; honeypot: boolean; address?: string | null; person?: string | null }, now: Date = new Date()): Promise<GuardVerdict> {
  if (!process.env.DATABASE_URL) return input.honeypot ? { action: "suspect", reason: "honeypot", keep: false } : { action: "accept" };

  let addressHits: number | null = null;
  try {
    if (input.address) addressHits = await hit("address", input.address, now);
  } catch (err) {
    warn(err, "lead_rate_limits");
  }
  const keep = addressHits === null || addressHits <= KEEP_SUSPECTS_UP_TO;
  if (input.honeypot) return { action: "suspect", reason: "honeypot", keep };

  if (input.submissionId) {
    try {
      const rows = await getDb().execute(sql`INSERT INTO lead_submissions (submission_id) VALUES (${input.submissionId}::uuid) ON CONFLICT (submission_id) DO NOTHING RETURNING submission_id`);
      if (!rows.length) return { action: "duplicate" };
    } catch (err) {
      warn(err, "lead_submissions");
    }
  }

  let personHits: number | null = null;
  try {
    if (input.person) personHits = await hit("person", input.person, now);
  } catch (err) {
    warn(err, "lead_rate_limits");
  }
  if ((addressHits ?? 0) > RATE_LIMITS.address.max || (personHits ?? 0) > RATE_LIMITS.person.max) {
    return { action: "suspect", reason: "rate", keep };
  }
  return { action: "accept" };
}

/** After processLead: link the claimed id to its lead, or give the id back when nothing kept the lead, so a retry is processed. */
export async function settleSubmission(submissionId: string | undefined, leadId: string | null, captured: boolean): Promise<void> {
  if (!submissionId || !process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    if (captured) {
      if (leadId) await db.execute(sql`UPDATE lead_submissions SET lead_id = ${leadId}::uuid WHERE submission_id = ${submissionId}::uuid`);
    } else {
      await db.execute(sql`DELETE FROM lead_submissions WHERE submission_id = ${submissionId}::uuid`);
    }
  } catch (err) {
    warn(err, "lead_submissions");
  }
}

/** Delete what the guard no longer needs: rate rows older than a day, submission ids older than a week. Run by the daily cron. */
export async function pruneGuard(): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    await db.execute(sql`DELETE FROM lead_rate_limits WHERE window_start < now() - interval '1 day'`);
    await db.execute(sql`DELETE FROM lead_submissions WHERE created_at < now() - interval '7 days'`);
  } catch (err) {
    warn(err, "lead guard tables");
  }
}

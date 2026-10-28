import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";

/**
 * street_watches and street_watch_digests (migration 0018), in raw SQL like
 * the other tables added after the Drizzle snapshots (lib/ops/store.ts).
 * Every call fails soft before the migration is applied: reads come back
 * empty, writes are skipped, and one log line names the file to apply.
 */

export const WATCH_MIGRATION = "0018_street_watch.sql";

export function softWatch(table: string, err: unknown): void {
  if (isMissingTable(err)) warnMissingTable(table, WATCH_MIGRATION);
  else console.error(`[watch] ${table}:`, err instanceof Error ? err.message : err);
}

export type WatchStatus = "pending" | "confirmed" | "unsubscribed";

export type WatchRow = {
  id: string;
  contactId: string | null;
  email: string;
  kind: "street" | "place";
  targetKey: string;
  label: string;
  street: string | null;
  zip: string | null;
  placeSlug: string | null;
  status: WatchStatus;
  confirmationSentAt: Date | null;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  lastDigestAt: Date | null;
};

type Raw = {
  id: string;
  contact_id: string | null;
  email: string;
  kind: "street" | "place";
  target_key: string;
  label: string;
  street: string | null;
  zip: string | null;
  place_slug: string | null;
  status: WatchStatus;
  confirmation_sent_at: string | Date | null;
  confirmed_at: string | Date | null;
  unsubscribed_at: string | Date | null;
  last_digest_at: string | Date | null;
};

const d = (v: string | Date | null) => (v ? new Date(v) : null);
export const toWatch = (r: Raw): WatchRow => ({
  id: r.id,
  contactId: r.contact_id,
  email: r.email,
  kind: r.kind,
  targetKey: r.target_key,
  label: r.label,
  street: r.street,
  zip: r.zip,
  placeSlug: r.place_slug,
  status: r.status,
  confirmationSentAt: d(r.confirmation_sent_at),
  confirmedAt: d(r.confirmed_at),
  unsubscribedAt: d(r.unsubscribed_at),
  lastDigestAt: d(r.last_digest_at),
});

const COLUMNS = sql`id, contact_id, email, kind, target_key, label, street, zip, place_slug, status, confirmation_sent_at, confirmed_at, unsubscribed_at, last_digest_at`;

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** One watch by id; null when unknown, without a database, or before 0018. */
export async function watchById(id: string): Promise<WatchRow | null> {
  if (!process.env.DATABASE_URL || !isUuid(id)) return null;
  try {
    const rows = (await getDb().execute(sql`SELECT ${COLUMNS} FROM street_watches WHERE id = ${id}::uuid LIMIT 1`)) as unknown as Raw[];
    return rows[0] ? toWatch(rows[0]) : null;
  } catch (err) {
    softWatch("street_watches", err);
    return null;
  }
}

/** One address's watch on one target. */
export async function watchByTarget(email: string, targetKey: string): Promise<WatchRow | null> {
  const rows = (await getDb().execute(sql`SELECT ${COLUMNS} FROM street_watches WHERE email = ${email} AND target_key = ${targetKey} LIMIT 1`)) as unknown as Raw[];
  return rows[0] ? toWatch(rows[0]) : null;
}

/**
 * Stop one watch (`id`) or every watch on an address (`email`). Never
 * throws: an unsubscribe from a newsletter link must not fail because this
 * table isn't there yet.
 */
export async function stopWatches(which: { id: string } | { email: string }, method: string): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const where = "id" in which ? sql`id = ${which.id}::uuid` : sql`email = ${which.email.trim().toLowerCase()}`;
    const rows = (await getDb().execute(sql`
      UPDATE street_watches SET status = 'unsubscribed', unsubscribed_at = now(), unsubscribe_method = ${method}, updated_at = now()
       WHERE ${where} AND status <> 'unsubscribed' RETURNING id`)) as unknown as { id: string }[];
    return rows.length;
  } catch (err) {
    softWatch("street_watches", err);
    return 0;
  }
}

/**
 * The daily tidy-up, the same promises as retention_purge() makes for the
 * newsletter: a watch never confirmed goes 30 days after it was asked for,
 * an unsubscribed one 30 days after it stopped, a digest record after two
 * years. Never throws.
 */
export async function watchHousekeeping(): Promise<{ pending: number; unsubscribed: number; digests: number } | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const db = getDb();
    const pending = (await db.execute(sql`DELETE FROM street_watches WHERE status = 'pending' AND requested_at < now() - interval '30 days' RETURNING id`)) as unknown as unknown[];
    const unsubscribed = (await db.execute(sql`DELETE FROM street_watches WHERE status = 'unsubscribed' AND unsubscribed_at < now() - interval '30 days' RETURNING id`)) as unknown as unknown[];
    const digests = (await db.execute(sql`DELETE FROM street_watch_digests WHERE created_at < now() - interval '2 years' RETURNING id`)) as unknown as unknown[];
    return { pending: pending.length, unsubscribed: unsubscribed.length, digests: digests.length };
  } catch (err) {
    softWatch("street_watches", err);
    return null;
  }
}

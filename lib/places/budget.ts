import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * The cap on calls to Google Places, kept in Postgres (table places_usage,
 * migration 0014) because Google Cloud offers no per-day quota for Places
 * API (New) and a budget only alerts, it never stops spending.
 *
 * Each call is billed on its SKU (Nearby Search or Text Search), and each SKU
 * has 1,000 free calls a month. A call is counted before it's made, and
 * refused once its SKU has had PLACES_CAP.day calls today or
 * PLACES_CAP.month this month, so the site stays inside the free tier with
 * room to spare. Days and months are Pacific time, as Google bills.
 *
 * If the count can't be read, the call isn't made: the lists go quiet before
 * anything can be billed.
 */

export const PLACES_CAP = { day: 30, month: 900 } as const;

export type Sku = "nearby" | "text";
export type Take = { ok: true } | { ok: false; reason: "day" | "month" | "error" };

const DDL = [
  `CREATE TABLE IF NOT EXISTS "places_usage" (
    "day" date NOT NULL,
    "sku" text NOT NULL,
    "calls" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "places_usage_day_sku_pk" PRIMARY KEY("day","sku")
  )`,
  `ALTER TABLE "places_usage" ENABLE ROW LEVEL SECURITY`,
];

let ready: Promise<void> | null = null;

async function db() {
  const database = getDb();
  if (!ready) {
    ready = (async () => {
      for (const statement of DDL) await database.execute(sql.raw(statement));
    })();
    // A failure (database asleep, a race with another process) is retried on the next call.
    ready.catch(() => {
      ready = null;
    });
  }
  await ready;
  return database;
}

/** "2026-10-12", the calendar day in Pacific time. */
export function pacificDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * Count one call to `sku` if there's room today and this month. One
 * statement: the day's row is locked by the upsert, so the daily cap is
 * exact; the month check can be passed by a few calls racing at the very
 * end, which the gap between PLACES_CAP.month and 1,000 absorbs.
 */
export async function takeCall(sku: Sku, now: Date = new Date()): Promise<Take> {
  if (!process.env.DATABASE_URL) return { ok: false, reason: "error" };
  const day = pacificDay(now);
  const monthStart = `${day.slice(0, 7)}-01`;
  try {
    const database = await db();
    const rows = await database.execute(sql`
      INSERT INTO places_usage (day, sku, calls)
      SELECT ${day}::date, ${sku}, 1
      WHERE (SELECT coalesce(sum(calls), 0) FROM places_usage WHERE sku = ${sku} AND day >= ${monthStart}::date) < ${PLACES_CAP.month}
      ON CONFLICT (day, sku) DO UPDATE SET calls = places_usage.calls + 1
        WHERE places_usage.calls < ${PLACES_CAP.day}
      RETURNING calls
    `);
    if (rows.length) return { ok: true };
    const [today] = await database.execute<{ calls: number }>(sql`SELECT calls FROM places_usage WHERE day = ${day}::date AND sku = ${sku}`);
    return { ok: false, reason: (today?.calls ?? 0) >= PLACES_CAP.day ? "day" : "month" };
  } catch (err) {
    console.error("[places/budget]", err instanceof Error ? err.message : err);
    return { ok: false, reason: "error" };
  }
}

/** Thrown in place of a call to Google once the cap is reached. */
export class PlacesCapError extends Error {
  constructor(readonly reason: "day" | "month" | "error") {
    super(`Places cap: ${reason}`);
  }
}

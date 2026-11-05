import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import { PLACES_CAP, PLACES_VISITOR_CAP, type CapReason, type Sku, type Take } from "./caps";
import { photoRoom } from "./photo";

export { PLACES_CAP, PLACES_VISITOR_CAP, type CapReason, type Sku, type Take };

/**
 * The cap on calls to Google Places, kept in Postgres (table places_usage,
 * migration 0014) because Google Cloud offers no per-day quota for Places
 * API (New) and a budget only alerts, it never stops spending.
 *
 * Each call is billed on its SKU (Nearby Search, Text Search, or Place
 * Photos for the Planner's thumbnails), and each SKU has 1,000 free calls a
 * month. A call is counted before it's made, and refused once its SKU has
 * had PLACES_CAP.day calls today or PLACES_CAP.month this month (./caps.ts),
 * so the site stays inside the free tier with room to spare. Days and months
 * are Pacific time, as Google bills.
 *
 * If the count can't be read, the call isn't made: the lists go quiet before
 * anything can be billed. That includes a database where migration 0014
 * hasn't been applied: the table is never created from a request.
 */

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
    const database = getDb();
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
    if (isMissingTable(err)) warnMissingTable("places_usage", "0014_places_usage.sql");
    else console.error("[places/budget]", err instanceof Error ? err.message : err);
    return { ok: false, reason: "error" };
  }
}

/** What a visitor's daily count is of: the lists they open, or the photos in them. Each has PLACES_VISITOR_CAP. */
export type VisitorCount = "list" | "photo";

/** A visitor, for the per-visitor count: a hash of the day and their address, so the address is never stored. */
export function visitorKey(ip: string, day: string, count: VisitorCount = "list"): string {
  return createHash("sha256")
    .update(`${count === "photo" ? "places-photo" : "places"}|${day}|${ip}`)
    .digest("hex")
    .slice(0, 32);
}

let swept = "";

/**
 * Count one list (or one photo) for this visitor today, if they have room
 * (PLACES_VISITOR_CAP each). A list fails open: without the table (migration
 * 0017 not applied) or a database that won't answer, there's no per-visitor
 * count and the site-wide cap in takeCall still stops the spending. A photo
 * fails closed: it's only ever an extra, so without a count there's no photo.
 */
export async function takeVisitorCall(ip: string, now: Date = new Date(), count: VisitorCount = "list"): Promise<{ ok: boolean }> {
  const unknown = { ok: count === "list" };
  if (!process.env.DATABASE_URL) return unknown;
  const day = pacificDay(now);
  try {
    const database = getDb();
    const rows = await database.execute(sql`
      INSERT INTO places_visitors (day, visitor, calls)
      VALUES (${day}::date, ${visitorKey(ip, day, count)}, 1)
      ON CONFLICT (day, visitor) DO UPDATE SET calls = places_visitors.calls + 1
        WHERE places_visitors.calls < ${PLACES_VISITOR_CAP}
      RETURNING calls
    `);
    // Yesterday's counts are kept a day for the Pacific/UTC overlap, then go.
    if (swept !== day) {
      swept = day;
      await database.execute(sql`DELETE FROM places_visitors WHERE day < ${day}::date - 1`).catch(() => undefined);
    }
    return { ok: rows.length > 0 };
  } catch (err) {
    if (isMissingTable(err)) warnMissingTable("places_visitors", "0017_places_visitors.sql");
    else console.error("[places/budget] visitor count", err instanceof Error ? err.message : err);
    return unknown;
  }
}

/**
 * How many photos could be fetched for this visitor right now, read without
 * counting anything: the least of what's left of the photo SKU today and
 * this month, and of the visitor's own photos today (photoRoom in
 * ./photo.ts). A list only carries photos when all of them fit. Zero when
 * the database, either table or the answer is missing: no room, no photos.
 */
export async function photosLeft(ip: string, now: Date = new Date()): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const day = pacificDay(now);
  const monthStart = `${day.slice(0, 7)}-01`;
  const sku: Sku = "photo";
  try {
    const [used] = await getDb().execute<{ day: number; month: number; visitor: number }>(sql`
      SELECT
        coalesce((SELECT calls FROM places_usage WHERE day = ${day}::date AND sku = ${sku}), 0)::int AS day,
        coalesce((SELECT sum(calls) FROM places_usage WHERE sku = ${sku} AND day >= ${monthStart}::date), 0)::int AS month,
        coalesce((SELECT calls FROM places_visitors WHERE day = ${day}::date AND visitor = ${visitorKey(ip, day, "photo")}), 0)::int AS visitor
    `);
    return used ? photoRoom({ day: Number(used.day), month: Number(used.month), visitor: Number(used.visitor) }) : 0;
  } catch (err) {
    // Either table may be the missing one; each is named once in the log.
    if (isMissingTable(err)) {
      warnMissingTable("places_usage", "0014_places_usage.sql");
      warnMissingTable("places_visitors", "0017_places_visitors.sql");
    } else console.error("[places/budget] photo room", err instanceof Error ? err.message : err);
    return 0;
  }
}

/** Thrown in place of a call to Google once a cap is reached. */
export class PlacesCapError extends Error {
  constructor(readonly reason: CapReason) {
    super(`Places cap: ${reason}`);
  }
}

import { JSON_SNAPSHOT } from "@/lib/content/encore";
import { addDays, todayLocal } from "./collect/dates";
import type { EncoreSnapshot } from "./store/types";

/**
 * The calendar the site shows: the encore_* tables (kept current by the
 * collector), or a local snapshot file in development
 * (ENCORE_SNAPSHOT_FILE), or the bundled JSON when neither can be read. A
 * build without DATABASE_URL, a database that is down or slow, or empty
 * tables all fall back to the JSON, so the site never depends on the
 * database to render.
 *
 * Kept in memory for five minutes per server instance; pages add their own
 * ISR on top.
 */

const TTL = 5 * 60_000;

/**
 * How far back pages read: a closed event keeps its page (with what's next
 * at the venue) for about a month after its last date, and the compare
 * page counts this month's shows. Everything older stays in the tables for
 * the collector, which reads them all, until encore_prune() removes it.
 */
export const PAGE_HISTORY_DAYS = 35;
let memo: { at: number; snap: EncoreSnapshot } | null = null;
let inflight: Promise<EncoreSnapshot> | null = null;

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))]);
}

async function read(): Promise<EncoreSnapshot> {
  const file = process.env.ENCORE_SNAPSHOT_FILE;
  if (file) {
    const { fileStore } = await import("./store/file");
    const snap = await fileStore(file).load();
    return snap.events.length ? snap : JSON_SNAPSHOT;
  }
  if (!process.env.DATABASE_URL || process.env.ENCORE_SOURCE === "json") return JSON_SNAPSHOT;
  try {
    const [{ getDb }, { pgStore }] = await Promise.all([import("@/lib/db"), import("./store/pg")]);
    const snap = await timeout(pgStore(getDb()).load({ since: addDays(todayLocal(Date.now()), -PAGE_HISTORY_DAYS) }), 8000);
    if (!snap.events.length) return JSON_SNAPSHOT;
    return snap;
  } catch (err) {
    console.warn(`[encore] database unavailable, using the bundled dataset: ${err instanceof Error ? err.message : String(err)}`);
    return JSON_SNAPSHOT;
  }
}

export async function loadEncoreSnapshot(): Promise<EncoreSnapshot> {
  if (memo && Date.now() - memo.at < TTL) return memo.snap;
  inflight ??= read()
    .then((snap) => {
      memo = { at: Date.now(), snap };
      return snap;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** The last snapshot this instance loaded, or the bundled JSON: for callers that can't await. */
export function currentEncoreSnapshot(): EncoreSnapshot {
  return memo?.snap ?? JSON_SNAPSHOT;
}

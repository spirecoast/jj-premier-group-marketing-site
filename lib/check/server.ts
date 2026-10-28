import "server-only";
import { unstable_cache } from "next/cache";
import { findParcelSales, getSalesManifest, type Sale } from "@/lib/sales";
import { RateLimiter, TtlCache } from "@/lib/search/query";
import { checkLocated, locate, type CheckResult, type Deps } from "./check";
import { countiesForZip, type ParsedAddress } from "./parse";

/**
 * Atlas Check on the server: the public layers through a cache, the limits,
 * and the county sales file for the last qualified sale.
 *
 * Every source is free and needs no key: the two counties' ArcGIS services,
 * FEMA's National Flood Hazard Layer and the Census geocoder. Even so the
 * route is polite to them: each answer from a layer is kept for 30 days
 * (Next's data cache, shared across instances, so a parcel is read once a
 * month however often it's checked), a whole result for an hour in memory,
 * and the checks are capped per visitor and per instance.
 */

const MONTH_S = 30 * 24 * 60 * 60;
const TIMEOUT_MS = 8_000;
const UA = "JJ Premier Group Atlas Check (+https://jjpremiergroup.com)";

class SourceError extends Error {}

/** YYYY-MM-DD on the coast. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, headers: { Accept: "application/json", "User-Agent": UA, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new SourceError(`${new URL(url).host} answered ${res.status}`);
  const j = (await res.json()) as { error?: { message?: string } };
  // ArcGIS reports its own errors with a 200 and an `error` body.
  if (j && typeof j === "object" && "error" in j && j.error) throw new SourceError(`${new URL(url).host}: ${j.error.message ?? "error"}`);
  return j;
}

type Read = { at: string; json: unknown };
const stamp = async (p: Promise<unknown>): Promise<Read> => ({ at: today(), json: await p });

/** One answer per address of a layer, kept 30 days with the day it was read. A failure throws and is never cached. */
const cachedGet = unstable_cache((url: string) => stamp(fetchJson(url)), ["atlas-check-get-v1"], { revalidate: MONTH_S, tags: ["atlas-check"] });
const cachedPost = unstable_cache(
  (url: string, form: string) => stamp(fetchJson(url, { method: "POST", body: form, headers: { "Content-Type": "application/x-www-form-urlencoded" } })),
  ["atlas-check-post-v1"],
  { revalidate: MONTH_S, tags: ["atlas-check"] },
);

/** The layers for one check, noting the oldest day any answer was read: that's the day the page says it was checked. */
function depsFor(): { deps: Deps; oldest: () => string } {
  const days: string[] = [];
  const note = (r: Read) => {
    days.push(r.at);
    return r.json;
  };
  return {
    deps: { get: async (url) => note(await cachedGet(url)), post: async (url, form) => note(await cachedPost(url, form)), countiesForZip },
    oldest: () => days.sort()[0] ?? today(),
  };
}

/** Per visitor, per server instance: a person checks a few addresses, not a street's worth. */
export const checkLimiter = new RateLimiter(10, 60_000);
/** Per instance, per day: a ceiling under the public services, whatever the traffic. */
export const dailyCap = new RateLimiter(3_000, 24 * 60 * 60 * 1000);
const results = new TtlCache<CheckOutcome>(60 * 60 * 1000, 500);

export type LastSale = { date: string; price: number } | null;

export type CheckOutcome =
  | { ok: true; result: CheckResult; sale: LastSale; saleWindowStart: string | null; salesThrough: string | null }
  | { ok: false; error: "not-found" | "outside" | "unavailable"; matched?: string };

/** The newest qualified sale the county file has for this parcel. */
async function lastSale(r: CheckResult): Promise<LastSale> {
  if (!r.parcel) return null;
  let rows: Sale[] = [];
  try {
    rows = await findParcelSales({ number: r.parcel.number, street: r.parcel.street, zip: r.parcel.zip });
  } catch {
    return null;
  }
  const own = rows.find((s) => s.county === r.county && (!r.roll || s.parcelId === r.roll.id || s.parcelId.replace(/\D/g, "") === r.roll.id.replace(/\D/g, "")));
  return own ? { date: own.saleDate, price: own.salePrice } : null;
}


const resultKey = (a: ParsedAddress) => `${a.number}|${a.predir}|${a.name}|${a.suffix}|${a.postdir}|${a.unit}|${a.zip}`;

/** An answer this instance already has: it costs the public services nothing, so the limits don't count it. */
export function cachedCheck(a: ParsedAddress): CheckOutcome | undefined {
  return results.get(resultKey(a));
}

export async function runCheck(a: ParsedAddress): Promise<CheckOutcome> {
  const key = resultKey(a);
  const hit = results.get(key);
  if (hit) return hit;
  let outcome: CheckOutcome;
  try {
    const { deps, oldest } = depsFor();
    const l = await locate(a, deps);
    if (l.kind === "none") outcome = { ok: false, error: "not-found" };
    else if (l.kind === "outside") outcome = { ok: false, error: "outside", matched: l.matched };
    else {
      const result = await checkLocated(l, a, deps, today());
      result.checked = oldest();
      const manifest = await getSalesManifest().catch(() => null);
      const through = manifest?.counties?.[result.county]?.to ?? null;
      outcome = { ok: true, result, sale: await lastSale(result), saleWindowStart: manifest?.windowStart ?? null, salesThrough: through };
    }
  } catch (err) {
    console.warn("[check] a source failed:", err instanceof Error ? err.message : String(err));
    return { ok: false, error: "unavailable" };
  }
  // Keep a whole answer only when every source answered; a partial one is asked again next time.
  if (!outcome.ok || (outcome.result.evacuation.status === "ok" && outcome.result.flood.status === "ok")) results.set(key, outcome);
  return outcome;
}

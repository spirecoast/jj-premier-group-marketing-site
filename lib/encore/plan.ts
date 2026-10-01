import type { Route } from "next";
import { MARKETS, isMarketSlug } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { isEventCategory } from "./categories";
import type { EncoreIndex } from "./index-format";
import { addDays, daysInRange, occurrences, weekday, weekendOf, type Occ } from "./select";

/**
 * The visit planner. Someone coming to look at homes gives us their dates
 * and the places they want to see; the daytime is left for showings and
 * the evenings are filled from Encore. Pure functions over the client
 * index, so the server paints the first plan and the browser rebuilds it
 * on every change without a round trip.
 */

/** A stay runs up to two weeks. */
export const MAX_DAYS = 14;
/** Evening picks start at five. */
export const EVENING_FROM = "17:00";
/** A weekend matinee is anything from late morning up to the evening cut. */
export const MATINEE_FROM = "11:00";
export const PICKS_PER_EVENING = 3;
/** The showing block, as wall-clock times in the site timezone. */
export const SHOWINGS = { from: "10:00", to: "16:00", label: "Showings with us (10 to 4)", description: "Showings with Joelyn and Jessica" } as const;

export type PlanState = {
  /** YYYY-MM-DD, inclusive. */
  from: string;
  to: string;
  /** Empty means every market, rotated. */
  markets: MarketSlug[];
  /** Empty means no preference. */
  categories: EventCategory[];
  /** Skip the weekend matinee option. */
  eveningsOnly: boolean;
};

export type PlanDay = {
  day: string;
  weekend: boolean;
  /** The market or two to spend the showing hours in. */
  markets: MarketSlug[];
  /** Up to three performances from five o'clock, in time order. */
  picks: Occ[];
  /** On a weekend, one afternoon option. */
  matinee?: Occ;
};

export type Plan = { days: PlanDay[] };

type Params = Record<string, string | string[] | undefined> | URLSearchParams;
const one = (p: Params, k: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};
/** A real calendar date: the shape, and it survives the round trip (2026-10-99 does not). */
const isDay = (s: string | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s);

/** Dates that make a stay: not in the past, in order, and at most two weeks. */
export function normalizeDates(from: string, to: string, today: string): { from: string; to: string; trimmed: boolean } {
  let f = from < today ? today : from;
  let t = to < f ? f : to;
  const last = addDays(f, MAX_DAYS - 1);
  const trimmed = t > last;
  if (trimmed) t = last;
  if (f > addDays(today, 365)) f = t = addDays(today, 365);
  return { from: f, to: t, trimmed };
}

/** The coming weekend, Friday through Sunday (or what is left of it). */
export function defaultDates(today: string): [string, string] {
  return weekendOf(today);
}

export function parsePlanState(p: Params, today: string): { state: PlanState; trimmed: boolean } {
  const [wFrom, wTo] = defaultDates(today);
  const fromParam = one(p, "from");
  const toParam = one(p, "to");
  const from = isDay(fromParam) ? fromParam : wFrom;
  const to = isDay(toParam) ? toParam : isDay(fromParam) ? from : wTo;
  const dates = normalizeDates(from, to, today);
  const markets = [...new Set((one(p, "market") ?? "").split(",").filter(isMarketSlug))];
  const categories = [...new Set((one(p, "cat") ?? "").split(",").filter(isEventCategory))];
  const eveningsOnly = one(p, "evenings") === "1";
  return { state: { from: dates.from, to: dates.to, markets, categories, eveningsOnly }, trimmed: dates.trimmed };
}

export function planSearch(s: PlanState): string {
  const sp = new URLSearchParams();
  sp.set("from", s.from);
  sp.set("to", s.to);
  if (s.markets.length) sp.set("market", s.markets.join(","));
  if (s.categories.length) sp.set("cat", s.categories.join(","));
  if (s.eveningsOnly) sp.set("evenings", "1");
  return `?${sp.toString()}`;
}

export function planHref(s: PlanState): Route {
  return `/calendar/plan${planSearch(s)}` as Route;
}

/** The ICS download for a built plan: the state for the showing blocks, plus each pick as slug:start. */
export function planIcsHref(s: PlanState, plan: Plan): string {
  const picks = plan.days.flatMap((d) => [...(d.matinee ? [d.matinee] : []), ...d.picks]).map((o) => `pick=${encodeURIComponent(`${o.e.s}:${o.start}`)}`);
  return `/api/calendar/plan.ics${planSearch(s)}${picks.length ? `&${picks.join("&")}` : ""}`;
}

/** The days of the stay with their market or two, rotating through the chosen ones. */
export function stayDays(s: PlanState): Pick<PlanDay, "day" | "weekend" | "markets">[] {
  const days = daysInRange(s.from, s.to).slice(0, MAX_DAYS);
  const rotation: MarketSlug[] = s.markets.length ? s.markets : MARKETS.map((m) => m.slug);
  const perDay = days.length >= rotation.length ? 1 : Math.min(2, rotation.length);
  return days.map((day, i) => {
    const wd = weekday(day);
    return { day, weekend: wd === 0 || wd === 6, markets: Array.from({ length: perDay }, (_, k) => rotation[(i * perDay + k) % rotation.length]!) };
  });
}

/**
 * Build the plan. Each day gets a market or two by rotating through the
 * chosen ones (one a day when the stay is long enough to reach them all,
 * two a day when it is not), then its evening is filled greedily: every
 * timed performance from five o'clock that isn't sold out is scored, the
 * top one is taken, and the rest are re-scored with it in mind.
 *
 * The score prefers the chosen categories and venues in the day's market,
 * and pushes away from categories and venues already in the plan, harder
 * within the same evening, and a little away from a start time already
 * taken that evening. A production is never picked twice in a stay.
 * On a weekend, one matinee is chosen the same way unless evenings only.
 */
export function buildPlan(index: EncoreIndex, s: PlanState, today: string, nowMs = 0): Plan {
  const prefs = new Set(s.categories);
  const used = new Set<string>();
  const stayCats = new Map<EventCategory, number>();
  const stayVenues = new Map<string, number>();
  const bump = <K,>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1);

  const out: PlanDay[] = stayDays(s).map(({ day, weekend, markets }) => {
    const all = occurrences(index, day, day, {}, day === today ? nowMs : 0).filter((o) => o.time && !o.e.so);
    const dayCats = new Map<EventCategory, number>();
    const dayVenues = new Map<string, number>();
    const dayStarts = new Map<string, number>();

    const score = (o: Occ) => {
      let n = 0;
      if (prefs.size) n += prefs.has(o.e.c) ? 3 : 0;
      if (markets.includes(o.e.m)) n += 2;
      n -= 1.5 * (stayCats.get(o.e.c) ?? 0);
      n -= 2 * (stayVenues.get(o.e.v) ?? 0);
      n -= 2 * (dayCats.get(o.e.c) ?? 0);
      n -= 3 * (dayVenues.get(o.e.v) ?? 0);
      n -= 1 * (dayStarts.get(o.time) ?? 0);
      return n;
    };
    const take = (pool: Occ[], n: number): Occ[] => {
      const picked: Occ[] = [];
      let rest = pool.filter((o) => !used.has(o.e.s));
      while (picked.length < n && rest.length) {
        rest.sort((a, b) => score(b) - score(a) || a.start - b.start || a.e.t.localeCompare(b.e.t));
        const o = rest[0]!;
        picked.push(o);
        used.add(o.e.s);
        bump(stayCats, o.e.c);
        bump(stayVenues, o.e.v);
        bump(dayCats, o.e.c);
        bump(dayVenues, o.e.v);
        bump(dayStarts, o.time);
        rest = rest.filter((x) => x.e.s !== o.e.s);
      }
      return picked.sort((a, b) => a.start - b.start);
    };

    const picks = take(
      all.filter((o) => o.time >= EVENING_FROM),
      PICKS_PER_EVENING,
    );
    const matinee = weekend && !s.eveningsOnly ? take(all.filter((o) => o.time >= MATINEE_FROM && o.time < EVENING_FROM), 1)[0] : undefined;
    return { day, weekend, markets, picks, matinee };
  });
  return { days: out };
}

/** "Lakewood Ranch and Sarasota" */
export function marketList(slugs: MarketSlug[]): string {
  const names = slugs.map((s) => MARKETS.find((m) => m.slug === s)?.name ?? s);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

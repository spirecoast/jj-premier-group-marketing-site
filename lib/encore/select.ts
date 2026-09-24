import type { EventCategory, MarketSlug } from "@/lib/content/types";
import type { EncoreEvent, EncoreIndex, EncorePerf } from "./index-format";

/**
 * Pure selectors over the client index. Everything here works on local
 * day strings (YYYY-MM-DD) computed at build time, so it runs the same on the
 * server for the first paint and in the browser afterwards.
 */
export type Occ = { e: EncoreEvent; day: string; time: string; start: number; end: number };

export type Filter = { category?: EventCategory; market?: MarketSlug; venue?: string; q?: string };

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export function matches(e: EncoreEvent, f: Filter, q?: string[]): boolean {
  if (f.category && e.c !== f.category) return false;
  if (f.market && e.m !== f.market) return false;
  if (f.venue && e.v !== f.venue) return false;
  if (q?.length) {
    const hay = norm([e.t, e.vn, e.p ?? "", e.sc ?? "", e.sum ?? ""].join(" "));
    if (!q.every((t) => hay.includes(t))) return false;
  }
  return true;
}

export const tokens = (q: string | undefined) => (q ? norm(q).split(" ").filter(Boolean) : []);

export function toOcc(index: EncoreIndex, p: EncorePerf): Occ {
  return { e: index.events[p[0]]!, day: p[1], time: p[2], start: p[3], end: p[4] };
}

/** Performances on days in [from, to], filtered, in time order. */
export function occurrences(index: EncoreIndex, from: string, to: string, f: Filter, nowMs = 0): Occ[] {
  const q = tokens(f.q);
  const out: Occ[] = [];
  for (const p of index.perfs) {
    if (p[1] < from || p[1] > to) continue;
    if (nowMs && p[4] < nowMs) continue;
    const e = index.events[p[0]]!;
    if (!matches(e, f, q)) continue;
    out.push({ e, day: p[1], time: p[2], start: p[3], end: p[4] });
  }
  return out;
}

/** Exhibitions and runs with no times that are still open on `today`, closing soonest first. */
export function onView(index: EncoreIndex, today: string, f: Filter): EncoreEvent[] {
  const q = tokens(f.q);
  return index.events
    .filter((e) => e.x && (e.r ?? "") >= today && (e.f ?? "") <= today && matches(e, f, q))
    .sort((a, b) => (a.r ?? "").localeCompare(b.r ?? "") || a.t.localeCompare(b.t));
}

/** Runs that open after today. */
export function opensLater(index: EncoreIndex, today: string, f: Filter): EncoreEvent[] {
  const q = tokens(f.q);
  return index.events.filter((e) => e.x && (e.f ?? "") > today && matches(e, f, q)).sort((a, b) => (a.f ?? "").localeCompare(b.f ?? ""));
}

/** How many filtered performances fall on each day in [from, to]. */
export function countsByDay(index: EncoreIndex, from: string, to: string, f: Filter): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of occurrences(index, from, to, f)) m.set(o.day, (m.get(o.day) ?? 0) + 1);
  return m;
}

/** Counts per category among the filtered performances of a window (for the chips). */
export function countsByCategory(index: EncoreIndex, from: string, to: string, f: Filter): Map<EventCategory, number> {
  const m = new Map<EventCategory, number>();
  for (const o of occurrences(index, from, to, { ...f, category: undefined })) m.set(o.e.c, (m.get(o.e.c) ?? 0) + 1);
  return m;
}

/** Group occurrences by day, preserving order. */
export function byDay(occs: Occ[]): [string, Occ[]][] {
  const m = new Map<string, Occ[]>();
  for (const o of occs) m.set(o.day, [...(m.get(o.day) ?? []), o]);
  return [...m.entries()];
}

/* ---- Day arithmetic on YYYY-MM-DD strings, no timezones involved ------------ */

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const t = Date.UTC(y, m - 1, d + n);
  return new Date(t).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The Monday on or before the day. */
export function weekStart(day: string): string {
  const w = weekday(day);
  return addDays(day, w === 0 ? -6 : 1 - w);
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function monthEnd(day: string): string {
  const [y, m] = day.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function daysInRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Friday through Sunday of the weekend that contains or follows `today`. */
export function weekendOf(today: string): [string, string] {
  const w = weekday(today);
  const fri = w <= 5 ? addDays(today, 5 - w) : addDays(today, -1); // Sat → Fri yesterday still counts
  const start = w === 6 || w === 0 ? today : fri;
  const end = w === 0 ? today : addDays(fri, 2);
  return [start, end];
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function longDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return `${DAYS[weekday(day)]}, ${MONTHS[m - 1]} ${d}${y !== new Date().getUTCFullYear() ? `, ${y}` : ""}`;
}
export function shortDay(day: string): string {
  const [, m, d] = day.split("-").map(Number) as [number, number, number];
  return `${MONTHS[m - 1]!.slice(0, 3)} ${d}`;
}
export function weekdayShort(day: string): string {
  return DAYS[weekday(day)]!.slice(0, 3);
}
export function monthLabel(day: string): string {
  const [y, m] = day.split("-").map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${y}`;
}
export function dayNumber(day: string): number {
  return Number(day.slice(8, 10));
}

/** "7:30 PM" from "19:30". */
export function clock(t: string): string {
  if (!t) return "All day";
  const [h, m] = t.split(":").map(Number) as [number, number];
  const hour = ((h + 11) % 12) + 1;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}

/** "Through Oct 31" for a run. */
export function through(e: EncoreEvent): string | undefined {
  return e.r ? `Through ${shortDay(e.r)}` : undefined;
}

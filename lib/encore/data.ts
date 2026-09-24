import "server-only";
import { encoreEvents, encoreVenues } from "@/lib/content/encore";
import { SITE_TIMEZONE } from "@/lib/content/format";
import type { EncoreEvent, EncoreIndex, EncorePerf } from "./index-format";

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function localDay(ms: number): string {
  const p = Object.fromEntries(dayFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
function localTime(ms: number): string {
  const p = Object.fromEntries(timeFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}`;
}

let cached: { at: number; index: EncoreIndex } | null = null;

/**
 * The client index: productions with at least one performance (or a run)
 * that ends after yesterday, so a page rendered up to a day after the
 * index was built still has tonight. Rebuilt hourly by the route's ISR.
 */
export function getEncoreIndex(): EncoreIndex {
  const now = Date.now();
  if (cached && now - cached.at < 10 * 60_000) return cached.index;
  const since = now - 24 * 3600_000;
  const events: EncoreEvent[] = [];
  const perfs: EncorePerf[] = [];
  for (const e of encoreEvents(new Date(since))) {
    const idx = events.length;
    const isRun = !e.performances?.length && Boolean(e.runsThrough);
    const row: EncoreEvent = {
      s: e.slug,
      t: e.title,
      c: e.category,
      v: e.venue.slug,
      vn: e.venue.name,
      m: e.venue.market,
    };
    if (e.subcategory) row.sc = e.subcategory;
    if (e.presenter && e.presenter !== e.venue.name) row.p = e.presenter;
    if (e.priceNote) row.pr = e.priceNote;
    if (e.status === "sold-out") row.so = 1;
    if (e.firstDate) row.f = e.firstDate;
    if (e.runsThrough) row.r = e.runsThrough;
    if (isRun) row.x = 1;
    if (e.summary) row.sum = e.summary.length > 140 ? `${e.summary.slice(0, 137).trimEnd()}…` : e.summary;
    if (e.image?.src) row.img = e.image.src;
    events.push(row);
    for (const p of e.performances ?? []) {
      const start = Date.parse(p.startsAt);
      const end = p.endsAt ? Date.parse(p.endsAt) : start;
      if (end < since) continue;
      perfs.push([idx, localDay(start), p.allDay ? "" : localTime(start), start, end]);
    }
  }
  perfs.sort((a, b) => a[3] - b[3] || events[a[0]]!.t.localeCompare(events[b[0]]!.t));
  const venues = encoreVenues().map((v) => ({ s: v.slug, n: v.name, m: v.market }));
  const index: EncoreIndex = { generated: new Date(now).toISOString(), events, perfs, venues };
  cached = { at: now, index };
  return index;
}

/** The part of the index a first paint needs: performances inside [from, to] and current runs, with their events. */
export function sliceIndex(index: EncoreIndex, fromDay: string, toDay: string): EncoreIndex {
  const keep = new Map<number, number>();
  const events: EncoreEvent[] = [];
  const perfs: EncorePerf[] = [];
  const remap = (i: number) => {
    let j = keep.get(i);
    if (j === undefined) {
      j = events.length;
      keep.set(i, j);
      events.push(index.events[i]!);
    }
    return j;
  };
  for (const p of index.perfs) {
    if (p[1] < fromDay || p[1] > toDay) continue;
    perfs.push([remap(p[0]), p[1], p[2], p[3], p[4]]);
  }
  index.events.forEach((e, i) => {
    if (e.x && (e.r ?? "") >= fromDay) remap(i);
  });
  return { generated: index.generated, events, perfs, venues: index.venues };
}

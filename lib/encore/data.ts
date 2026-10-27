import "server-only";
import { encoreEvents, encoreVenues } from "@/lib/content/encore";
import { currentEncoreSnapshot, loadEncoreSnapshot } from "./live";
import type { EncoreSnapshot } from "./store/types";
import { SITE_TIMEZONE } from "@/lib/content/format";
import type { EncoreEvent, EncoreIndex, EncorePerf } from "./index-format";
import { localDay } from "./day";

const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export { localDay } from "./day";
function localTime(ms: number): string {
  const p = Object.fromEntries(timeFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}`;
}

let cached: { at: number; snap: EncoreSnapshot; index: EncoreIndex } | null = null;

/**
 * The client index: productions with at least one performance (or a run)
 * that ends after yesterday, so a page rendered up to a day after the
 * index was built still has tonight. Rebuilt hourly by the route's ISR.
 *
 * Built from the database snapshot (lib/encore/live.ts). Async callers use
 * loadEncoreIndex(); this synchronous form uses the snapshot this instance
 * last loaded (or the bundled JSON), for callers that can't await.
 */
export function getEncoreIndex(snap: EncoreSnapshot = currentEncoreSnapshot()): EncoreIndex {
  const now = Date.now();
  if (cached && cached.snap === snap && now - cached.at < 10 * 60_000) return cached.index;
  const since = now - 24 * 3600_000;
  const events: EncoreEvent[] = [];
  const perfs: EncorePerf[] = [];
  for (const e of encoreEvents(new Date(since), snap)) {
    // Called off or moved: not on the calendar (the event's page still says so).
    if (e.status === "cancelled" || e.status === "postponed") continue;
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
    if (e.image?.src) {
      row.img = e.image.src;
      if (e.imageCredit?.name) row.ic = e.imageCredit.name;
    }
    events.push(row);
    for (const p of e.performances ?? []) {
      const start = Date.parse(p.startsAt);
      const end = p.endsAt ? Date.parse(p.endsAt) : start;
      if (end < since) continue;
      perfs.push([idx, localDay(start), p.allDay ? "" : localTime(start), start, end]);
    }
  }
  perfs.sort((a, b) => a[3] - b[3] || events[a[0]]!.t.localeCompare(events[b[0]]!.t));
  const venues = encoreVenues(snap).map((v) => ({ s: v.slug, n: v.name, m: v.market }));
  const index: EncoreIndex = { generated: new Date(now).toISOString(), events, perfs, venues };
  cached = { at: now, snap, index };
  return index;
}

/** The index from the freshest snapshot (database, else the bundled JSON). */
export async function loadEncoreIndex(): Promise<EncoreIndex> {
  return getEncoreIndex(await loadEncoreSnapshot());
}

/**
 * The part of the index a first paint needs: performances inside [from, to]
 * and current runs, with their events. The one-line summaries stay out (a
 * tile never shows one; they are only searched, and a search fetches the
 * full index), which halves the page's props. `only` narrows it further to
 * the events a filter matches, for a search rendered on the server.
 */
export function sliceIndex(index: EncoreIndex, fromDay: string, toDay: string, only?: (e: EncoreEvent) => boolean): EncoreIndex {
  const keep = new Map<number, number>();
  const events: EncoreEvent[] = [];
  const perfs: EncorePerf[] = [];
  const remap = (i: number) => {
    let j = keep.get(i);
    if (j === undefined) {
      j = events.length;
      keep.set(i, j);
      const slim: EncoreEvent = { ...index.events[i]! };
      delete slim.sum;
      events.push(slim);
    }
    return j;
  };
  for (const p of index.perfs) {
    if (p[1] < fromDay || p[1] > toDay) continue;
    if (only && !only(index.events[p[0]]!)) continue;
    perfs.push([remap(p[0]), p[1], p[2], p[3], p[4]]);
  }
  index.events.forEach((e, i) => {
    if (e.x && (e.r ?? "") >= fromDay && (!only || only(e))) remap(i);
  });
  return { generated: index.generated, events, perfs, venues: index.venues };
}

import type { DatasetEvent, DatasetVenue } from "@/lib/encore/collect/known";
import { isTicketingUrl } from "@/lib/encore/collect/util";
import { publicSlugs } from "@/lib/encore/slug";
import { jsonSnapshot } from "@/lib/encore/store/convert";
import type { EncoreSnapshot, StoreEvent, StorePerformance } from "@/lib/encore/store/types";
import { UNLISTED_NAME, unlistedVenue } from "@/lib/encore/venue-rules";
import data from "./encore/encore-calendar.json";
import { isMarketSlug } from "./markets";
import type { Address, Event, EventCategory, MarketSlug, Performance, Venue, VenueDate } from "./types";

/**
 * The Encore Arts Calendar: every listing taken from the venue's or
 * presenter's own site, one record per production with all of its
 * performances. This module turns a snapshot of it into the site's Venue and
 * Event shapes. The snapshot comes from the encore_* tables, kept current by
 * the collector (lib/encore/live.ts loads it); the JSON file in
 * ./encore/ is the seed and the fallback when the database can't be reached.
 */

type RawVenue = DatasetVenue;

/** The bundled dataset as a snapshot: the seed, and the fallback. */
export const JSON_SNAPSHOT: EncoreSnapshot = jsonSnapshot(data as unknown as { venues: DatasetVenue[]; events: DatasetEvent[]; generatedAt?: string });

/* ---- Time: the dataset's times are local (America/New_York) ---------------- */

const TZ = "America/New_York";
const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** The UTC instant for a wall-clock time in the site timezone. */
export function zonedInstant(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [h, min] = time.split(":").map(Number) as [number, number];
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 2; i += 1) {
    const p = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    const seen = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute));
    guess += Date.UTC(y, m - 1, d, h, min) - seen;
  }
  return new Date(guess);
}

/** Noon local for date-only items, so the calendar day is right in any zone. */
const noon = (date: string) => zonedInstant(date, "12:00").toISOString();

/* ---- Venues ------------------------------------------------------------------ */

function parseAddress(v: RawVenue): Address {
  const a = (v.address ?? "").trim();
  const m = a.match(/^(.*?),\s*([^,]+),\s*FL\s*(\d{5})$/);
  if (m) return { street: m[1]!.trim(), city: m[2]!.trim(), state: "FL", zip: m[3]! };
  return { street: a, city: v.city ?? "", state: "FL", zip: "" };
}

const marketOf = (v: string | null | undefined, fallback: MarketSlug = "sarasota"): MarketSlug => (isMarketSlug(v) ? v : fallback);

/* ---- Events ------------------------------------------------------------------ */

const CATEGORIES: EventCategory[] = ["music", "theater", "gallery", "festival", "family", "market", "film", "talks"];
const categoryOf = (c: string): EventCategory => (CATEGORIES.includes(c as EventCategory) ? (c as EventCategory) : "festival");

/** Default length of a performance when the venue does not publish one. */
const HOURS: Record<EventCategory, number> = { music: 2, theater: 2.5, gallery: 2, festival: 3, family: 2, market: 4, film: 2, talks: 1.5 };

function perfOf(p: Pick<StorePerformance, "date" | "time">, hours: number): Performance {
  if (p.time) {
    const start = zonedInstant(p.date, p.time);
    return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + hours * 3600_000).toISOString() };
  }
  return { startsAt: noon(p.date), allDay: true };
}

/** The event's page on the presenter's or venue's own site: the first source that isn't a ticket seller. */
function venuePage(e: StoreEvent): string | undefined {
  return e.sources.find((u) => !isTicketingUrl(u)) ?? e.sources[0];
}

function venueDateOf(p: StorePerformance, hours: number): VenueDate {
  const base = perfOf(p, hours);
  const status = p.status === "cancelled" || p.status === "postponed" ? p.status : p.availability;
  return {
    startsAt: base.startsAt,
    allDay: base.allDay,
    status,
    priceMin: p.priceMin ?? undefined,
    priceMax: p.priceMax ?? undefined,
    ticketUrl: p.ticketUrl ?? undefined,
  };
}

type Built = {
  /** The venues with a page of their own. */
  venues: Venue[];
  events: Omit<Event, "startsAt" | "endsAt" | "allDay">[];
  /** A stored slug the first collector clipped → the slug the site serves it under (lib/encore/slug.ts). */
  aliases: Map<string, string>;
  /** Venues with no page (a placeholder or a home), by key. */
  unlisted: Map<string, Venue>;
};
const builtCache = new WeakMap<EncoreSnapshot, Built>();

/** Venues and events from a snapshot (memoised per snapshot). */
export function buildEncore(snap: EncoreSnapshot): Built {
  const hit = builtCache.get(snap);
  if (hit) return hit;
  const all: Venue[] = snap.venues
    .filter((v) => v.name || v.key === "venue-tbd")
    .map((v) => {
      const unlisted = unlistedVenue(v);
      const address = parseAddress(v);
      return {
        _id: `venue-${v.key}`,
        name: unlisted ? UNLISTED_NAME[unlisted] : v.name!,
        slug: v.key,
        // A placeholder or a home: the city, never a street.
        address: unlisted ? { street: "", city: v.city ?? address.city, state: "FL", zip: "" } : address,
        website: unlisted ? undefined : (v.website ?? undefined),
        market: marketOf(v.market),
        ...(unlisted ? { unlisted } : {}),
      };
    });
  const venues = all.filter((v) => !v.unlisted);
  const venueByKey = new Map(all.map((v) => [v.slug, v]));
  const images = new Map(snap.images.filter((i) => i.publicUrl && !i.hidden).map((i) => [i.eventSlug, i]));
  const aliases = publicSlugs(snap.events);
  const events = snap.events
    .filter((e) => !e.hidden && e.status !== "announced" && e.venueKey && venueByKey.has(e.venueKey))
    .map((e) => {
      const known = venueByKey.get(e.venueKey!)!;
      // The "to be confirmed" row carries no city or market of its own: the event's stand in.
      const venue: Venue = known.slug === "venue-tbd" ? { ...known, market: marketOf(e.market), address: { ...known.address, city: e.city ?? "" } } : known;
      // The dataset's own eight categories; siteCategory folds film and talks into six.
      const category = categoryOf(e.category);
      const hours = HOURS[category];
      const listed = e.performances.filter((p) => p.status !== "removed");
      const scheduled = listed.filter((p) => p.status === "scheduled");
      // A production called off entirely keeps its dates so its page can say so.
      const shown = scheduled.length || !listed.length ? scheduled : listed;
      const performances = shown.map((p) => perfOf(p, hours)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      const status = e.status === "sold-out" || e.status === "cancelled" || e.status === "postponed" ? e.status : "scheduled";
      const img = images.get(e.slug);
      const event: Omit<Event, "startsAt" | "endsAt" | "allDay"> = {
        _id: `event-${e.slug}`,
        title: e.title,
        slug: aliases.get(e.slug) ?? e.slug,
        summary: e.description ?? "",
        venue: { name: venue.name, slug: venue.slug, market: venue.market, address: venue.address, geo: venue.geo, ...(venue.unlisted ? { unlisted: venue.unlisted } : {}) },
        category,
        ticketUrl: e.ticketUrl ?? undefined,
        priceNote: status === "sold-out" ? "Sold out" : status === "cancelled" ? "Cancelled" : status === "postponed" ? "Postponed" : (e.price ?? undefined),
        // The presenter's own image when the collector found one; otherwise pages draw key art for the category.
        image: img?.publicUrl && img.width && img.height ? { src: img.publicUrl, alt: img.alt || e.title, width: img.width, height: img.height } : undefined,
        imageCredit: img?.publicUrl ? { name: img.credit, url: img.pageUrl ?? undefined } : undefined,
        source: e.presenter ?? known.name,
        sourceUrl: e.sources[0],
        featured: false,
        presenter: e.presenter ?? undefined,
        room: e.room ?? undefined,
        subcategory: e.subcategory ?? undefined,
        performances,
        runsThrough: e.endDate ?? undefined,
        firstDate: e.startDate,
        status,
        live: {
          dates: listed.map((p) => venueDateOf(p, hours)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
          checkedAt: e.checkedAt ?? undefined,
          priceMin: e.priceMin ?? undefined,
          priceMax: e.priceMax ?? undefined,
          venuePage: venuePage(e),
        },
      };
      return event;
    });
  const unlisted = new Map(all.filter((v) => v.unlisted).map((v) => [v.slug, v]));
  const out = { venues, events, aliases, unlisted };
  builtCache.set(snap, out);
  return out;
}

export function encoreVenues(snap: EncoreSnapshot = JSON_SNAPSHOT): Venue[] {
  return buildEncore(snap).venues;
}

/** A venue that has no page (lib/encore/venue-rules.ts): its old address redirects to its market's calendar. */
export function unlistedEncoreVenue(slug: string, snap: EncoreSnapshot = JSON_SNAPSHOT): Venue | undefined {
  return buildEncore(snap).unlisted.get(slug);
}

/**
 * Events with `startsAt` set to the next performance on or after `from`, or
 * the run's first day for exhibitions and date-only listings. Anything whose
 * last date is behind `from` is left out.
 */
export function encoreEvents(from: Date = new Date(), snap: EncoreSnapshot = JSON_SNAPSHOT): Event[] {
  const nowIso = from.toISOString();
  const today = nowIso.slice(0, 10);
  const out: Event[] = [];
  for (const e of buildEncore(snap).events) {
    const perfs = e.performances ?? [];
    if (perfs.length) {
      const next = perfs.find((p) => (p.endsAt ?? p.startsAt) >= nowIso) ?? null;
      if (!next) continue;
      out.push({ ...e, startsAt: next.startsAt, endsAt: next.endsAt, allDay: next.allDay });
    } else {
      // A run with no published times: on view from firstDate through runsThrough.
      const last = e.runsThrough ?? e.firstDate;
      if (!last || last < today) continue;
      const start = e.firstDate && e.firstDate > today ? e.firstDate : today;
      out.push({ ...e, startsAt: noon(start), endsAt: e.runsThrough ? noon(e.runsThrough) : undefined, allDay: true });
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * What an event address answers (app/(site)/calendar/[slug]):
 * - `live`: on the calendar now;
 * - `closed`: its dates are all behind `from`; the page stays, says so and
 *   points at what's next, with noindex;
 * - `moved`: a slug the first collector clipped, now served under a clean
 *   one (a permanent redirect).
 * Undefined when the snapshot has no such event (hidden, never listed, or
 * pruned more than a year after its last date).
 */
export type EventLookup = { kind: "live"; event: Event } | { kind: "closed"; event: Event } | { kind: "moved"; slug: string };

export function lookupEncoreEvent(slug: string, from: Date = new Date(), snap: EncoreSnapshot = JSON_SNAPSHOT): EventLookup | undefined {
  const built = buildEncore(snap);
  const moved = built.aliases.get(slug);
  if (moved) return { kind: "moved", slug: moved };
  const live = encoreEvents(from, snap).find((e) => e.slug === slug);
  if (live) return { kind: "live", event: live };
  const e = built.events.find((x) => x.slug === slug);
  if (!e) return undefined;
  const last = e.performances?.[e.performances.length - 1];
  if (last) return { kind: "closed", event: { ...e, startsAt: last.startsAt, endsAt: last.endsAt, allDay: last.allDay } };
  const day = e.runsThrough ?? e.firstDate;
  if (!day) return undefined;
  return { kind: "closed", event: { ...e, startsAt: noon(day), allDay: true } };
}

import data from "./encore/encore-calendar.json";
import { isMarketSlug } from "./markets";
import type { Address, Event, EventCategory, MarketSlug, Performance, Venue } from "./types";

/**
 * The Encore Arts Calendar dataset: every listing taken from the venue's or
 * presenter's own site, one record per production with all of its
 * performances. This module turns it into the site's Venue and Event shapes.
 * It serves the calendar until the same records live in Sanity; the seed
 * script pushes them there unchanged.
 */

type RawVenue = {
  key: string;
  name: string | null;
  type: string | null;
  address: string | null;
  city: string | null;
  market: string | null;
  website: string | null;
  eventsUrl: string | null;
  residentCompanies: string[];
  notes: string | null;
  eventCount: number;
};

type RawEvent = {
  slug: string;
  title: string;
  presenter: string | null;
  market: string;
  category: string;
  siteCategory: string;
  subcategory: string | null;
  venueKey: string | null;
  venueName: string | null;
  room: string | null;
  city: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  nextDate: string | null;
  nextTime: string | null;
  performances: { date: string; time: string | null }[];
  recurrence: string | null;
  price: string | null;
  ticketUrl: string | null;
  sources: string[];
  description: string | null;
  status: "scheduled" | "announced" | "sold-out";
  notes: string | null;
};

const raw = data as unknown as { venues: RawVenue[]; events: RawEvent[] };

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

const venueList: Venue[] = raw.venues
  .filter((v) => v.name && v.key !== "venue-tbd")
  .map((v) => ({
    _id: `venue-${v.key}`,
    name: v.name!,
    slug: v.key,
    address: parseAddress(v),
    website: v.website ?? undefined,
    market: marketOf(v.market),
  }));

const venueByKey = new Map(venueList.map((v) => [v.slug, v]));

export function encoreVenues(): Venue[] {
  return venueList;
}

/* ---- Events ------------------------------------------------------------------ */

const CATEGORIES: EventCategory[] = ["music", "theater", "gallery", "festival", "family", "market", "film", "talks"];
const categoryOf = (c: string): EventCategory => (CATEGORIES.includes(c as EventCategory) ? (c as EventCategory) : "festival");

/** Default length of a performance when the venue does not publish one. */
const HOURS: Record<EventCategory, number> = { music: 2, theater: 2.5, gallery: 2, festival: 3, family: 2, market: 4, film: 2, talks: 1.5 };

function performancesOf(e: RawEvent, category: EventCategory): Performance[] {
  const hours = HOURS[category];
  return e.performances
    .map((p) => {
      if (p.time) {
        const start = zonedInstant(p.date, p.time);
        return { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + hours * 3600_000).toISOString() };
      }
      return { startsAt: noon(p.date), allDay: true as const };
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

const built: Omit<Event, "startsAt" | "endsAt" | "allDay">[] = raw.events
  .filter((e) => e.status !== "announced" && e.venueKey && venueByKey.has(e.venueKey))
  .map((e) => {
    const venue = venueByKey.get(e.venueKey!)!;
    // The dataset's own eight categories; siteCategory folds film and talks into six.
    const category = categoryOf(e.category);
    const performances = performancesOf(e, category);
    const sold = e.status === "sold-out";
    return {
      _id: `event-${e.slug}`,
      title: e.title,
      slug: e.slug,
      summary: e.description ?? "",
      venue: { name: venue.name, slug: venue.slug, market: venue.market, address: venue.address, geo: venue.geo },
      category,
      ticketUrl: e.ticketUrl ?? undefined,
      priceNote: sold ? "Sold out" : (e.price ?? undefined),
      // No placeholder photograph: pages draw key art for the category until a venue supplies art.
      image: undefined,
      source: e.presenter ?? venue.name,
      sourceUrl: e.sources[0],
      featured: false,
      presenter: e.presenter ?? undefined,
      room: e.room ?? undefined,
      subcategory: e.subcategory ?? undefined,
      performances,
      runsThrough: e.endDate ?? undefined,
      firstDate: e.startDate,
      status: sold ? "sold-out" : "scheduled",
    };
  });

/**
 * Events with `startsAt` set to the next performance on or after `from`, or
 * the run's first day for exhibitions and date-only listings. Anything whose
 * last date is behind `from` is left out.
 */
export function encoreEvents(from: Date = new Date()): Event[] {
  const nowIso = from.toISOString();
  const today = nowIso.slice(0, 10);
  const out: Event[] = [];
  for (const e of built) {
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

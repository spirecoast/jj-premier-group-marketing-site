import type { KnownEvent, KnownVenue } from "./match";
import type { SourceSpec } from "./sources";
import type { KnownRef } from "./types";

/**
 * The dataset's shapes (lib/content/encore/encore-calendar.json), which are
 * also the shapes the encore_* tables are read back into
 * (lib/encore/store/*). Shared so the seed, the collector and the site read
 * one model.
 */
export type DatasetVenue = {
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
  eventCount?: number;
};

export type DatasetEvent = {
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
  nextDate?: string | null;
  nextTime?: string | null;
  performances: { date: string; time: string | null }[];
  recurrence: string | null;
  price: string | null;
  ticketUrl: string | null;
  sources: string[];
  description: string | null;
  status: "scheduled" | "announced" | "sold-out" | "cancelled" | "postponed";
  notes: string | null;
};

export function knownEvents(events: DatasetEvent[]): KnownEvent[] {
  return events.map((e) => ({
    slug: e.slug,
    title: e.title,
    venueKey: e.venueKey,
    urls: [...e.sources, ...(e.ticketUrl ? [e.ticketUrl] : [])],
    dates: e.performances.map((p) => p.date),
    startDate: e.startDate,
    endDate: e.endDate,
  }));
}

export function knownVenues(venues: DatasetVenue[]): KnownVenue[] {
  return venues.filter((v) => v.name).map((v) => ({ key: v.key, name: v.name!, aliases: VENUE_ALIASES[v.key] }));
}

/** Names the sources use for venues that differ from ours. */
export const VENUE_ALIASES: Record<string, string[]> = {
  "van-wezel": ["Van Wezel", "Van Wezel Performing Arts Hall"],
  "sarasota-opera-house": ["Sarasota Opera House", "Opera House"],
  "holley-hall": ["Holley Hall", "Beatrice Friedman Symphony Center"],
  "fsu-center": ["FSU Center for the Performing Arts", "Mertz Theatre", "Cook Theatre", "Asolo Repertory Theatre"],
  "fogartyville": ["Fogartyville", "Fogartyville Community Media and Arts Center"],
  "manatee-pac": ["Manatee Performing Arts Center", "Neel Performing Arts Center at MPAC"],
  "scd-studio": ["SCD Home Studio", "Sarasota Contemporary Dance Studio"],
  "the-ringling": ["The Ringling", "Ringling Museum", "Museum of Art", "Historic Asolo Theater"],
  "the-bay-sarasota": ["The Bay", "The Bay Park", "The Bay Sarasota"],
  "selby-public-library": ["Selby Library", "Selby Public Library"],
  "sarasota-art-museum": ["Sarasota Art Museum", "SAM"],
  "riverview-pac": ["Riverview Performing Arts Center", "Riverview PAC"],
  "first-presbyterian-sarasota": ["First Presbyterian Church", "First Presbyterian Church of Sarasota"],
  "first-congregational-sarasota": ["First Congregational Church", "First Congregational United Church of Christ"],
};

/** The known events whose page or ticket link sits on one of the source's hosts. */
export function knownForSource(source: SourceSpec, events: DatasetEvent[]): KnownRef[] {
  const onHost = (u: string) => {
    try {
      const h = new URL(u).hostname.replace(/^www\./, "");
      return source.hosts.some((x) => h === x || h.endsWith(`.${x}`));
    } catch {
      return false;
    }
  };
  return events
    .filter((e) => e.sources.some(onHost) || (e.ticketUrl && onHost(e.ticketUrl)))
    .map((e) => {
      const dates = [...e.performances.map((p) => p.date), e.startDate, e.endDate].filter((x): x is string => Boolean(x)).sort();
      return {
        slug: e.slug,
        title: e.title,
        urls: [...e.sources, ...(e.ticketUrl ? [e.ticketUrl] : [])].filter(onHost),
        ticketUrl: e.ticketUrl ?? undefined,
        venueKey: e.venueKey ?? undefined,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1],
      };
    });
}

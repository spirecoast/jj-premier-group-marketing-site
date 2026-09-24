import type { EventCategory, MarketSlug } from "@/lib/content/types";

/**
 * What the calendar sends to the browser once: every upcoming production in
 * a few short fields, every dated performance as a tuple, and the venues.
 * Local dates and times are precomputed in the site timezone, so the client
 * never does timezone math. About 40KB gzipped.
 */
export type EncoreEvent = {
  s: string; // slug
  t: string; // title
  c: EventCategory;
  sc?: string; // subcategory
  v: string; // venue slug
  vn: string; // venue name
  m: MarketSlug;
  p?: string; // presenter (when different from the venue)
  pr?: string; // price note
  so?: 1; // sold out
  f?: string; // first date (YYYY-MM-DD)
  r?: string; // runs through (YYYY-MM-DD)
  x?: 1; // exhibition / run with no published times
  sum?: string; // one-line summary
  img?: string; // image src
};

/** [event index, local day YYYY-MM-DD, local time "19:30" or "" for all day, start ms, end ms] */
export type EncorePerf = [number, string, string, number, number];

export type EncoreVenue = { s: string; n: string; m: MarketSlug };

export type EncoreIndex = {
  generated: string;
  events: EncoreEvent[];
  perfs: EncorePerf[];
  venues: EncoreVenue[];
};

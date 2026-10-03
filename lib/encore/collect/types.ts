/**
 * The Encore collector's shared shapes. An adapter reads one source (a
 * venue's calendar, a ticketing platform, a feed) and returns what it found
 * as CollectedEvents; lib/encore/collect/reconcile.ts matches those to the
 * known events and decides what changes apply on their own and what goes to
 * the review queue.
 */

/** What a performance's seller says about it. */
export type Availability = "on-sale" | "few-left" | "sold-out" | "not-on-sale" | "unknown";
/** What the presenter says about the date itself. */
export type PerfStatus = "scheduled" | "cancelled" | "postponed";

export type CollectedPerformance = {
  /** YYYY-MM-DD, local (America/New_York). */
  date: string;
  /** HH:MM 24h local, or "" when the source gives no time. */
  time: string;
  status?: PerfStatus;
  availability?: Availability;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  ticketUrl?: string;
};

export type CollectedEvent = {
  /** The page this event was read from: its own page when there is one. */
  sourceUrl: string;
  /** A stable id inside the source (a TNEW production id, a Tribe post id…). */
  externalId?: string;
  title: string;
  presenter?: string;
  /** The venue as the source names it; matched to encore_venues by name. */
  venueName?: string;
  /** Set when the adapter already knows the venue's key. */
  venueKey?: string;
  room?: string;
  /** Every published date. When `complete` is false the list is a sample (the listing shows only the next one or a range). */
  performances: CollectedPerformance[];
  /** True when `performances` is every date the source publishes, so a date that disappears was removed. */
  complete: boolean;
  /** Dates read from the page's prose rather than structured data: good enough to match on, not to add dates from. */
  heuristic?: boolean;
  /** For runs and exhibitions with no times: first and last day. */
  startDate?: string;
  endDate?: string;
  /** The price exactly as published ("$25–$65", "Free"). */
  price?: string;
  priceMin?: number;
  priceMax?: number;
  ticketUrl?: string;
  status?: PerfStatus | "sold-out";
  /** The event's official image (og:image, JSON-LD image, the listing's hero). */
  imageUrl?: string;
  /** The page the image was taken from (defaults to sourceUrl). */
  imagePageUrl?: string;
  /** Source wording, for the reviewer only. Never published: descriptions are written fresh. */
  sourceText?: string;
  /** A hint for the reviewer ("concert", "exhibition"…), from the source's own categories. */
  categoryHint?: string;
};

export type SourceFrequency = "daily" | "weekly" | "monthly" | "manual";

export type SourceDef = {
  /** Stable id, e.g. "vanwezel". */
  id: string;
  domain: string;
  adapter: string;
  /** Adapter settings: URLs, client ids, venue defaults. */
  config: Record<string, unknown>;
  frequency: SourceFrequency;
  /** The presenter credited on images and as the default presenter. */
  presenter: string;
  /** Default venue key for events that name no venue. */
  venueKey?: string;
  enabled?: boolean;
  notes?: string;
};

export type FetchResult = {
  url: string;
  status: number;
  ok: boolean;
  text: string;
  /** The body as bytes, when the request asked for `binary`. */
  bytes?: Uint8Array;
  headers: Record<string, string>;
  /** 304 on a conditional request. */
  notModified?: boolean;
};

export type FetchOptions = {
  headers?: Record<string, string>;
  /** Send If-None-Match / If-Modified-Since from the last run. */
  etag?: string;
  lastModified?: string;
  accept?: "html" | "json" | "any";
  timeoutMs?: number;
  method?: "GET" | "POST";
  body?: string;
  /** Read the body as bytes (images). */
  binary?: boolean;
};

export type Fetcher = (url: string, opts?: FetchOptions) => Promise<FetchResult>;

/** A known event of this source, so adapters can revisit its own page. */
export type KnownRef = {
  slug: string;
  title: string;
  urls: string[];
  ticketUrl?: string;
  venueKey?: string;
  firstDate?: string;
  lastDate?: string;
};

export type AdapterContext = {
  fetch: Fetcher;
  /** The source's known events (empty for a first run). */
  known: KnownRef[];
  /** "check" runs only need statuses and prices: adapters may skip discovery and images. */
  mode: "collect" | "check";
  /** Today in America/New_York, YYYY-MM-DD: adapters skip anything that ended before it. */
  today: string;
  log: (m: string) => void;
  /** Stop starting new requests after this (ms epoch). */
  deadline?: number;
};

export type AdapterResult = {
  events: CollectedEvent[];
  /** Pages the adapter could not read; the run still applies what it found. */
  warnings: string[];
  /** A hash of what the adapter read, for change detection. */
  contentHash?: string;
};

export type Adapter = {
  name: string;
  /** Platform or generic adapters can serve many sources; per-site adapters one. */
  kind: "generic" | "platform" | "site";
  collect(source: SourceDef, ctx: AdapterContext): Promise<AdapterResult>;
};

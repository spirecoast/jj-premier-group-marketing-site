/**
 * The pure side of the Google Places lists: which places are good enough to
 * show, in what order, how far away, and whether they're open at the hour
 * that matters. No I/O, so it's tested on its own (rank.test.ts).
 */

/** The fields we ask Google for, after the route has picked them out. */
export type RawPlace = {
  id: string;
  name: string;
  rating?: number;
  count?: number;
  /** "PRICE_LEVEL_MODERATE" and so on. */
  priceLevel?: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapsUri?: string;
  website?: string;
  phone?: string;
  status?: string;
  periods?: Period[];
};

/** Google's opening-hours period. day is 0 for Sunday. No close means open around the clock. */
export type Period = { open: { day: number; hour: number; minute: number }; close?: { day: number; hour: number; minute: number } };

/** What the browser gets: display fields only. */
export type Place = {
  id: string;
  name: string;
  rating: number;
  count: number;
  /** "$" to "$$$$", when Google has one. */
  price?: string;
  address?: string;
  /** Miles from the venue, one decimal. Absent for county-wide lists. */
  miles?: number;
  mapsUri?: string;
  website?: string;
  phone?: string;
  /** "Open until 11 PM" on the day asked about, when hours were asked about. */
  hours?: string;
};

export const RANK = {
  /** Below this Google rating a place isn't shown. */
  minRating: 4.2,
  /** Fewer reviews than this and the rating says too little. */
  minCount: 25,
  /** The weighting toward the prior: a place needs about this many reviews before its own rating dominates. */
  weight: 50,
  /** The rating a place is assumed to have before its reviews say otherwise. */
  prior: 4,
  /** How many to show. */
  show: 5,
} as const;

const WEEK = 7 * 24 * 60;

/**
 * Rating adjusted for how many reviews it rests on: a 4.9 from 12 reviews
 * ranks below a 4.7 from 900. The weighted mean of the place's rating and
 * the prior, weighted by its review count against RANK.weight.
 */
export function score(rating: number, count: number, w: number = RANK.weight, prior: number = RANK.prior): number {
  return (count / (count + w)) * rating + (w / (count + w)) * prior;
}

/** Great-circle distance in miles. */
export function miles(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const at = (p: { day: number; hour: number; minute: number }) => p.day * 1440 + p.hour * 60 + p.minute;

/**
 * The period a place is open in at minute `minutes` of weekday `day`
 * (0 Sunday), or null when it's closed then. A period that runs past
 * midnight, or past Saturday into Sunday, still counts.
 */
export function openPeriod(periods: Period[], day: number, minutes: number): Period | null {
  const t = day * 1440 + minutes;
  for (const p of periods) {
    if (!p.close) return p;
    const o = at(p.open);
    let c = at(p.close);
    if (c <= o) c += WEEK;
    if ((t >= o && t < c) || (t + WEEK >= o && t + WEEK < c)) return p;
  }
  return null;
}

/** "11 PM", "10:30 PM", "Midnight". */
export function clockLabel(hour: number, minute: number): string {
  if (hour === 0 && minute === 0) return "Midnight";
  const h = ((hour + 11) % 12) + 1;
  return `${h}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${hour >= 12 ? "PM" : "AM"}`;
}

const PRICE: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export type RankOptions = {
  /** Where distances are measured from. */
  from?: [number, number];
  /** Only places open at this weekday (0 Sunday) and minute of the day. */
  openAt?: { day: number; minutes: number };
  /** Drop places further than this many miles. */
  maxMiles?: number;
  show?: number;
};

/**
 * Operating, rated at least RANK.minRating on at least RANK.minCount
 * reviews, open at the hour asked about (a place with no hours on Google
 * is left in), then ordered by score(). Ties go to the nearer place.
 */
export function rank(raw: RawPlace[], o: RankOptions = {}): Place[] {
  const seen = new Set<string>();
  const kept: (Place & { s: number })[] = [];
  for (const r of raw) {
    if (!r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    if (r.status && r.status !== "OPERATIONAL") continue;
    const rating = r.rating ?? 0;
    const count = r.count ?? 0;
    if (rating < RANK.minRating || count < RANK.minCount) continue;
    const d = o.from && r.lat != null && r.lng != null ? miles(o.from, [r.lat, r.lng]) : undefined;
    if (o.maxMiles != null && d != null && d > o.maxMiles) continue;
    let hours: string | undefined;
    if (o.openAt && r.periods?.length) {
      const p = openPeriod(r.periods, o.openAt.day, o.openAt.minutes);
      if (!p) continue;
      hours = p.close ? `Open until ${clockLabel(p.close.hour, p.close.minute)}` : "Open 24 hours";
    }
    kept.push({
      id: r.id,
      name: r.name,
      rating,
      count,
      price: r.priceLevel ? PRICE[r.priceLevel] : undefined,
      address: r.address,
      miles: d == null ? undefined : Math.round(d * 10) / 10,
      mapsUri: r.mapsUri,
      website: r.website,
      phone: r.phone,
      hours,
      s: score(rating, count),
    });
  }
  kept.sort((a, b) => b.s - a.s || (a.miles ?? 0) - (b.miles ?? 0) || a.name.localeCompare(b.name));
  return kept.slice(0, o.show ?? RANK.show).map(({ s: _s, ...p }) => p);
}

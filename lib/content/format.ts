/**
 * Locale-stable formatters for the public site. Hardcoded to en-US and the
 * team's timezone so server and client never disagree.
 */
export const SITE_TIMEZONE = "America/New_York";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(n: number): string {
  return usd.format(n);
}

/** $2.85M · $975K — for cards and the hero list. */
export function formatPriceShort(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const s = m >= 10 ? m.toFixed(1) : m.toFixed(2);
    return `$${s.replace(/\.?0+$/, "")}M`;
  }
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return usd.format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatSqft(n: number): string {
  return `${formatNumber(n)} SF`;
}

export function formatBaths(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function pricePerSf(price: number, sqft: number): string {
  return `$${formatNumber(Math.round(price / sqft))}`;
}

/** "4 BD · 3.5 BA · 3,940 SF" */
export function factsLine(l: { beds: number; baths: number; sqft: number }): string {
  return `${l.beds} BD · ${formatBaths(l.baths)} BA · ${formatSqft(l.sqft)}`;
}

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: SITE_TIMEZONE,
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: SITE_TIMEZONE,
});
const weekdayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: SITE_TIMEZONE,
});
const weekdayShort = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: SITE_TIMEZONE,
});
const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: SITE_TIMEZONE,
});
const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: SITE_TIMEZONE,
});
const numericDate = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "2-digit",
  timeZone: SITE_TIMEZONE,
});

const toDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);

export function formatDateLong(d: string | Date): string {
  return longDate.format(toDate(d));
}

export function formatDateShort(d: string | Date): string {
  return shortDate.format(toDate(d));
}

/** 04.18.26 — the record style used in mono captions. */
export function formatDateRecord(d: string | Date): string {
  return numericDate.format(toDate(d)).replace(/\//g, ".");
}

export function formatMonthYear(d: string | Date): string {
  return monthYear.format(toDate(d));
}

export function weekdayName(d: string | Date): string {
  return weekdayFmt.format(toDate(d));
}

export function weekdayAbbrev(d: string | Date): string {
  return weekdayShort.format(toDate(d));
}

/** "7:30 PM" — trims ":00". */
export function formatTime(d: string | Date): string {
  return timeFmt.format(toDate(d)).replace(":00", "");
}

/** "Thursday, September 10 · 7:30–10 PM" */
export function formatEventWhen(startsAt: string, endsAt?: string, allDay?: boolean): string {
  const start = toDate(startsAt);
  const day = `${weekdayName(start)}, ${shortDate.format(start)}`;
  if (allDay) return `${day} · All day`;
  if (!endsAt) return `${day} · ${formatTime(start)}`;
  const end = toDate(endsAt);
  const sameDay = shortDate.format(start) === shortDate.format(end);
  if (!sameDay) return `${day} · ${formatTime(start)} → ${weekdayName(end)}, ${shortDate.format(end)}`;
  const a = formatTime(start);
  const b = formatTime(end);
  const aMeridiem = a.slice(-2);
  const bMeridiem = b.slice(-2);
  const aTrim = aMeridiem === bMeridiem ? a.slice(0, -3) : a;
  return `${day} · ${aTrim}–${b}`;
}

/** "Fri" style day plus "7:30 PM" for compact rows. */
export function formatEventShort(startsAt: string): string {
  const d = toDate(startsAt);
  return `${weekdayShort.format(d)} · ${shortDate.format(d)} · ${formatTime(d)}`;
}

export function isSameLocalDay(a: string | Date, b: string | Date): boolean {
  return shortDate.format(toDate(a)) === shortDate.format(toDate(b));
}

export function formatAddress(a: { street: string; city: string; state: string; zip: string }): string {
  return [a.street, `${a.city}, ${a.state} ${a.zip}`.trim()].filter(Boolean).join(", ");
}

export function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LISTING_TAG_LABEL: Record<string, string> = {
  new: "New listing",
  "coming-soon": "Coming soon",
  "just-reduced": "Just reduced",
  "under-contract": "Under contract",
  sold: "Sold",
  "off-market": "Off market",
  "open-house": "Open house",
};

export const EVENT_CATEGORY_LABEL: Record<string, string> = {
  music: "Music",
  theater: "Theater",
  gallery: "Galleries",
  festival: "Festivals",
  family: "Family",
  market: "Markets",
};

import { SITE_TIMEZONE } from "@/lib/content/format";
import type { Event, VenueDate, VenueDateStatus } from "@/lib/content/types";

/**
 * The words and small pure helpers behind the event page's "From the
 * venue" panel (components/encore/venue-panel.tsx), kept here so the copy
 * is checked (lib/encore/encore.test.ts) and the rules are tested.
 */

export const STATUS: Record<VenueDateStatus, { label: string; tone: "ok" | "warn" | "off" | "none" } | null> = {
  "on-sale": { label: "On sale", tone: "ok" },
  "few-left": { label: "Few left", tone: "warn" },
  "sold-out": { label: "Sold out", tone: "off" },
  cancelled: { label: "Cancelled", tone: "off" },
  postponed: { label: "Postponed", tone: "warn" },
  "not-on-sale": { label: "Not on sale yet", tone: "none" },
  unknown: null,
};

export const PANEL_COPY = {
  title: "From the venue",
  checked: (ago: string, presenter: string) => `Checked ${ago} on ${presenter}’s listing`,
  unchecked: (presenter: string) => `Dates as ${presenter} lists them`,
  nextDates: "Next dates",
  when: "When",
  onView: "On view",
  more: (n: number, through: string) => `and ${n} more, through ${through}`,
  tickets: "Tickets",
  calledOff: "Called off by the presenter",
  soldOut: "Sold out",
  seeVenue: "See the venue",
  where: "Where",
  maps: "Open in Google Maps ↗",
  getTickets: "Get tickets",
  signUp: "Details and sign-up",
  venuePage: (presenter: string) => `${presenter}’s page ↗`,
  free: "Free. No ticket needed.",
  door: "Tickets at the door or from the venue.",
  addAll: "Add every date to your calendar",
  addOne: "Add to your calendar",
  footnote: (presenter: string) => `Times, prices and seats come straight from ${presenter}. They can change, so check with them before you go.`,
  credit: (name: string) => `Image: ${name}`,
} as const;

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, hour: "numeric", minute: "2-digit" });
export const monthDay = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, month: "long", day: "numeric" });

/** "Sat, Oct 10 · 7:30 PM", or the day alone when the venue gives no time. */
export function compactWhen(d: Pick<VenueDate, "startsAt" | "allDay">): string {
  const at = new Date(d.startsAt);
  return d.allDay ? dayFmt.format(at) : `${dayFmt.format(at)} · ${timeFmt.format(at).replace(":00", "")}`;
}

const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function priceRange(min?: number, max?: number): string | undefined {
  if (min == null && max == null) return undefined;
  const lo = min ?? max!;
  const hi = max ?? min!;
  if (hi === 0) return "Free";
  return lo === hi ? money(lo) : `${money(lo)}–${money(hi)}`;
}

/** The whole production's state in a few words, for the panel's head. */
export function overall(dates: VenueDate[], status?: Event["status"]): VenueDateStatus | undefined {
  if (status === "cancelled" || status === "postponed") return status;
  const open = dates.filter((d) => d.status !== "cancelled" && d.status !== "postponed");
  if (!open.length) return dates[0]?.status;
  if (open.every((d) => d.status === "sold-out")) return "sold-out";
  if (open.some((d) => d.status === "few-left")) return "few-left";
  if (open.some((d) => d.status === "on-sale")) return "on-sale";
  return undefined;
}

/** Dates still ahead at `nowIso` (a date-only one counts all day). */
export function upcomingDates(dates: VenueDate[], nowIso: string): VenueDate[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(new Date(nowIso));
  return dates.filter((d) => (d.allDay ? new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(new Date(d.startsAt)) >= today : d.startsAt >= nowIso));
}

/** "2 hours ago", "yesterday", "3 days ago". */
export function relativeTime(iso: string, nowMs: number): string {
  const s = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000));
  if (s < 90) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 14) return `${d} days ago`;
  return `${Math.round(d / 7)} weeks ago`;
}

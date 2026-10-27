import { formatDateShort } from "@/lib/content/format";

/**
 * A card stays on a page only while its date is still ahead. Pages are
 * rebuilt hourly and after every Encore run, but a copy served from cache
 * can still be from yesterday; the browser drops what has ended
 * (components/encore/fresh-events.tsx) with these.
 */

type CardEvent = { startsAt: string; endsAt?: string; allDay?: boolean; runsThrough?: string; performances?: { startsAt: string }[] };

const HOUR = 3600_000;

/** When the date a card shows is over: the performance's end, the run's last day, or a few hours after a start with no end. */
export function cardEndsAt(e: CardEvent): string {
  if (e.runsThrough && !e.performances?.length) return new Date(Date.parse(`${e.runsThrough}T12:00:00Z`) + 16 * HOUR).toISOString();
  if (e.endsAt) return e.endsAt;
  // An all-day date is stamped at local noon; it's over at the end of that day.
  return new Date(Date.parse(e.startsAt) + (e.allDay ? 12 : 3) * HOUR).toISOString();
}

/** Still on at `now`. */
export const isCurrent = (endsAt: string, now: number): boolean => Date.parse(endsAt) >= now;

/** ", November 6 to 13": the span the cards cover, so a heading never says "this month" over next month's dates. */
export function eventSpan(starts: (string | Date)[]): string {
  const days = starts.map((s) => formatDateShort(s));
  if (!days.length) return "";
  const first = days[0]!;
  const last = days[days.length - 1]!;
  if (first === last) return `, ${first}`;
  const [m1] = first.split(" ");
  const [m2, d2] = last.split(" ");
  return `, ${first} to ${m1 === m2 ? d2 : last}`;
}

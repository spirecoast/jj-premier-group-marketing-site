/**
 * "Today" as a calendar day. Two readings, both YYYY-MM-DD:
 *
 * - `dayIn(tz)`: the day in one named time zone (the site's, America/New_York,
 *   for Encore, which precomputes every performance's local day).
 * - `dayHere()`: the day where the visitor is, from the browser's own clock.
 *   Atlas Move counts "N days from today" for the person planning the move,
 *   wherever they are, so it reads their clock.
 *
 * Neither uses `toISOString().slice(0, 10)`: that is the UTC day, which is
 * tomorrow from eight in the evening on the east coast.
 *
 * `useToday` keeps a day current in a component: it ticks over at the next
 * local midnight, so a tab left open overnight says "today" about today.
 */
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day of `d` in the visitor's own time zone. */
export function dayHere(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** The calendar day of `d` in a named time zone. */
export function dayIn(tz: string, d: Date = new Date()): string {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(tz, f);
  }
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** Milliseconds from `now` until the day (as `read` reports it) changes: the next midnight, found by stepping to the first minute whose day differs, plus a second of margin. */
export function msUntilNextDay(read: (d: Date) => string, now: Date = new Date()): number {
  const today = read(now);
  // Midnight is at most 24 hours away; find it to the minute, then add a one-second margin so the timer fires on the new day.
  let lo = 0;
  let hi = 25 * 60; // minutes
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (read(new Date(now.getTime() + mid * 60_000)) === today) lo = mid + 1;
    else hi = mid;
  }
  const minuteOfChange = new Date(now.getTime() + lo * 60_000);
  // The change happened inside that minute: start of that minute, plus one second.
  const start = new Date(minuteOfChange);
  start.setSeconds(0, 0);
  const ms = start.getTime() + 1000 - now.getTime();
  return Math.max(1000, ms);
}

/**
 * A day that stays current. `initial` is what the server (or the first
 * client read) decided; `read` is how to read the clock, the visitor's own
 * day by default. The value updates at the next midnight and every one after.
 */
export function useToday(initial: string, read: (d: Date) => string = dayHere): string {
  const [today, setToday] = useState(initial);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      const now = new Date();
      setToday((t) => (t === read(now) ? t : read(now)));
      timer = setTimeout(arm, msUntilNextDay(read, now));
    };
    timer = setTimeout(arm, msUntilNextDay(read));
    // A tab that was asleep (laptop lid closed) checks the day again when it wakes.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const now = read(new Date());
        setToday((t) => (t === now ? t : now));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [read]);
  return today;
}

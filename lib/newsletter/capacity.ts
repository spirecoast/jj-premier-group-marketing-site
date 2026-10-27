import { remainingToday, utcDayStart } from "./batch";

/**
 * Whether an issue can reach everyone before it expires. Pure.
 *
 * Every subscriber email in a UTC day counts against NEWSLETTER_DAILY_CAP:
 * confirmations and welcomes as well as issues (lib/newsletter/batch.ts).
 * What doesn't fit waits for the daily catch-up run (vercel.json,
 * /api/newsletter/send/all, 13:30 UTC). An Encore issue expires the Monday
 * after its week and a Tide issue fourteen days after it was due, so a list
 * bigger than the days left times the cap would expire with people unsent.
 * This says so before it happens.
 */

/** The daily catch-up send, the last run of each UTC day (vercel.json). */
export const CATCH_UP_UTC = { hour: 13, minute: 30 } as const;
/** A run that started a little before `now` is still going. */
const IN_PROGRESS_MS = 30 * 60_000;
const DAY_MS = 86_400_000;

export type Capacity = {
  /** Issue emails that can still go before the send expires. */
  emails: number;
  /** UTC days with a send run left before expiry, today included. */
  days: number;
};

/**
 * How many issue emails can still go before `expiresAt`: what's left of
 * today's cap when today's last run is ahead (or under way), then for every
 * later day with a run before the expiry, the cap less the confirmations and
 * welcomes a day usually takes (`reservePerDay`).
 */
export function capacityBeforeExpiry(opts: { cap: number; usedToday: number; reservePerDay: number; now: Date; expiresAt: Date }): Capacity {
  const { cap, now, expiresAt } = opts;
  const reserve = Math.max(0, Math.ceil(opts.reservePerDay));
  let emails = 0;
  let days = 0;
  for (let day = utcDayStart(now).getTime(); day < expiresAt.getTime(); day += DAY_MS) {
    const run = day + (CATCH_UP_UTC.hour * 60 + CATCH_UP_UTC.minute) * 60_000;
    if (run >= expiresAt.getTime()) break;
    const today = day === utcDayStart(now).getTime();
    if (today) {
      if (now.getTime() > run + IN_PROGRESS_MS) continue;
      emails += remainingToday(cap, opts.usedToday);
    } else {
      emails += Math.max(0, Math.floor(cap) - reserve);
    }
    days += 1;
  }
  return { emails, days };
}

export type CapacityCheck = Capacity & { pending: number; short: number; fits: boolean };

export function checkCapacity(pending: number, capacity: Capacity): CapacityCheck {
  const short = Math.max(0, pending - capacity.emails);
  return { ...capacity, pending, short, fits: short === 0 };
}

/**
 * How many emails a list can take per issue at this cap, for the health
 * detail: Encore has seven days, Tide fourteen, each day less the usual
 * confirmations and welcomes.
 */
export function perIssueCapacity(cap: number, reservePerDay: number, windowDays: number): number {
  return Math.max(0, Math.floor(cap) - Math.max(0, Math.ceil(reservePerDay))) * windowDays;
}

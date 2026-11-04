import type { EventCategory } from "../content/types";
import type { Occ } from "../encore/select";
import { addDays, easternDay, isDay, rangeLabel, weekdayOf } from "../issues/render";
import { nominalSendTime } from "../newsletter/schedule";

/**
 * Which Monday issues of Encore have a page on the site, and the small facts
 * their tiles draw. Pure: the time and the record of sends come in.
 *
 * An issue is the week from its Monday to its Sunday (lib/issues/encore-weekly.ts).
 * It counts as out from its send time, Monday 12:00 UTC (8am in Sarasota in
 * daylight time); before that, last week's is the newest.
 */

/** How many Monday issues the page keeps when the sends are on record: this one and the three before. */
export const ENCORE_LETTER_WEEKS = 4;

/** Where a Monday issue lives on the site. */
export function encoreLetterPath(monday: string): string {
  return `/calendar/letters/${monday}`;
}

export function isMonday(day: string | null | undefined): day is string {
  return isDay(day) && weekdayOf(day) === 1;
}

/** The Monday on or before `day`. */
export function mondayOf(day: string): string {
  return addDays(day, -((weekdayOf(day) + 6) % 7));
}

/** The newest Monday issue that's out at `now`: this week's from its send time, last week's before it. */
export function currentEncoreMonday(now: Date): string {
  const monday = mondayOf(easternDay(now));
  return now.getTime() >= nominalSendTime("encore", monday, now).getTime() ? monday : addDays(monday, -7);
}

/**
 * The Mondays with a page, newest first. When the sends are on record
 * (`sent`: the weeks issue_sends has as sent), those of the last
 * ENCORE_LETTER_WEEKS; when nothing is on record (subscriber email off, no
 * database), this week's alone, which the Monday cron builds either way.
 */
export function listedEncoreWeeks(current: string, sent: readonly string[] | null): string[] {
  const oldest = addDays(current, -7 * (ENCORE_LETTER_WEEKS - 1));
  const recorded = [...new Set(sent ?? [])].filter((m) => isMonday(m) && m <= current && m >= oldest).sort().reverse();
  return recorded.length ? recorded : [current];
}

/** What a Monday address answers: its page, a pointer to the newsletters page (an issue no longer kept), or nothing. */
export function encoreLetterAnswer(date: string, listed: readonly string[], current: string): "page" | "gone" | "missing" {
  if (!isMonday(date)) return "missing";
  if (listed.includes(date)) return "page";
  return date < current ? "gone" : "missing";
}

export type WeekMark = { c: EventCategory; pick?: 1 };
export type WeekDay = { day: string; marks: WeekMark[] };

/**
 * The cover's drawing: the seven days, and on each every dated performance
 * in start order, the issue's picks marked. From the same performances the
 * issue counts (`occurrences` over the week).
 */
export function weekDrawing(occs: readonly Occ[], picks: readonly Occ[], from: string): WeekDay[] {
  const picked = new Set(picks.map((o) => `${o.e.s}@${o.start}`));
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(from, i);
    const marks = occs
      .filter((o) => o.day === day)
      .sort((a, b) => a.start - b.start || a.e.t.localeCompare(b.e.t))
      .map((o): WeekMark => (picked.has(`${o.e.s}@${o.start}`) ? { c: o.e.c, pick: 1 } : { c: o.e.c }));
    return { day, marks };
  });
}

/** "November 2 to 8, 2026"; across a new year the range already names both years. */
export function rangeWithYear(from: string, to: string): string {
  const range = rangeLabel(from, to);
  return from.slice(0, 4) === to.slice(0, 4) ? `${range}, ${from.slice(0, 4)}` : range;
}

import { MAX_DAYS, PLAN_AHEAD_DAYS } from "./plan";
import { DAYS, MONTHS, addDays, weekday } from "./select";

/**
 * The Planner's calendar (components/encore/range-calendar.tsx), the pure
 * side: the months it can show, the weeks in a month, what a tap does to the
 * days chosen, where a key moves the focus, and the words for a day or a
 * range. Days are YYYY-MM-DD in the site's timezone; months are YYYY-MM.
 *
 * A tap picks one day, which is a plan on its own. A second tap on a later
 * day (inside MAX_DAYS) makes a range; any tap after that starts again, and
 * so does a tap on an earlier day or one too far out.
 */

/** The days the calendar offers: today through a year ahead, the Planner's own limits (normalizeDates). */
export function planBounds(today: string): { min: string; max: string } {
  return { min: today, max: addDays(today, PLAN_AHEAD_DAYS) };
}

export const clampDay = (day: string, min: string, max: string): string => (day < min ? min : day > max ? max : day);

export const monthOf = (day: string): string => day.slice(0, 7);

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const i = y * 12 + (m - 1) + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "November 2026" */
export function monthTitle(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${y}`;
}

/** The month's weeks, Sunday first; the days outside the month are null. */
export function monthWeeks(month: string): (string | null)[][] {
  const first = `${month}-01`;
  const lead = weekday(first);
  const count = daysInMonth(month);
  const cells: (string | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/** The days chosen, and the first tap of a range that's waiting for its second (null when the next tap starts again). */
export type RangePick = { from: string; to: string; anchor: string | null };

/** What a tap on `day` does. */
export function pickDay(sel: RangePick, day: string, maxDays: number = MAX_DAYS): RangePick {
  const a = sel.anchor;
  if (a && day === a) return { from: day, to: day, anchor: null };
  if (a && day > a && day <= addDays(a, maxDays - 1)) return { from: a, to: day, anchor: null };
  return { from: day, to: day, anchor: day };
}

/** The range a pointer (or the keyboard focus) would make with the waiting first tap, for the preview; null when it wouldn't make one. */
export function previewRange(anchor: string | null, over: string | null, maxDays: number = MAX_DAYS): [string, string] | null {
  if (!anchor || !over || over <= anchor || over > addDays(anchor, maxDays - 1)) return null;
  return [anchor, over];
}

/**
 * Where a key moves the focus from `day`, or null for a key the calendar
 * doesn't use: the arrows a day or a week, Home and End the start and end of
 * the week, Page Up and Page Down the same date a month back or on (the
 * last day of a shorter month). The caller keeps it inside the bounds.
 */
export function keyTarget(day: string, key: string): string | null {
  switch (key) {
    case "ArrowLeft":
      return addDays(day, -1);
    case "ArrowRight":
      return addDays(day, 1);
    case "ArrowUp":
      return addDays(day, -7);
    case "ArrowDown":
      return addDays(day, 7);
    case "Home":
      return addDays(day, -weekday(day));
    case "End":
      return addDays(day, 6 - weekday(day));
    case "PageUp":
    case "PageDown": {
      const month = addMonths(monthOf(day), key === "PageUp" ? -1 : 1);
      const d = Math.min(Number(day.slice(8, 10)), daysInMonth(month));
      return `${month}-${String(d).padStart(2, "0")}`;
    }
    default:
      return null;
  }
}

const yearOf = (day: string) => day.slice(0, 4);

/** "Saturday, November 8", with the year when it isn't this year. */
export function dayWords(day: string, today: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return `${DAYS[weekday(day)]}, ${MONTHS[m - 1]} ${d}${yearOf(day) !== yearOf(today) ? `, ${y}` : ""}`;
}

/**
 * The days chosen, in words: "Saturday, November 8" for one day,
 * "November 8 to 11" inside a month, "November 29 to December 2" across
 * two, with the year when it isn't this year.
 */
export function rangeWords(from: string, to: string, today: string): string {
  if (from === to) return dayWords(from, today);
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  const end = fy === ty && fm === tm ? `${td}` : `${MONTHS[tm - 1]} ${td}`;
  const year = fy !== ty || yearOf(to) !== yearOf(today) ? `, ${ty}` : "";
  const startYear = fy !== ty && String(fy) !== yearOf(today) ? `, ${fy}` : "";
  return `${MONTHS[fm - 1]} ${fd}${startYear} to ${end}${year}`;
}

/** How many days a range covers, both ends counted. */
export function spanDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

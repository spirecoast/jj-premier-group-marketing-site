/**
 * Dates and times as the venues write them, turned into the dataset's local
 * YYYY-MM-DD and HH:MM (America/New_York). Pure, no timezone library: the
 * runtime's Intl does the conversion.
 */

const TZ = "America/New_York";
const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Local date and time for an instant. */
export function localParts(ms: number): { date: string; time: string } {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${String(Number(p.hour) % 24).padStart(2, "0")}:${p.minute}` };
}

export function todayLocal(ms = Date.now()): string {
  return localParts(ms).date;
}

/**
 * An ISO-ish timestamp to local date and time. With an offset or Z it is
 * converted; without one it is already local wall-clock time. A bare date
 * gives time "".
 */
export function isoToLocal(s: string | undefined | null): { date: string; time: string } | null {
  if (!s) return null;
  const t = s.trim();
  const m = t.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/);
  if (!m) return null;
  const [, date, hh, mm, zone] = m;
  if (!hh) return { date: date!, time: "" };
  if (!zone) return { date: date!, time: `${hh}:${mm}` };
  const ms = Date.parse(`${date}T${hh}:${mm}:00${zone === "Z" ? "Z" : zone.length === 5 ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone}`);
  return Number.isNaN(ms) ? null : localParts(ms);
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export function monthNumber(s: string): number | undefined {
  return MONTHS[s.toLowerCase().replace(/\./g, "").slice(0, 3)];
}

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/**
 * The year for a month/day printed without one: the occurrence closest to
 * `today` that is not more than two months behind it (season listings run
 * forward from now).
 */
export function inferYear(month: number, day: number, today: string): number {
  const y = Number(today.slice(0, 4));
  const candidate = ymd(y, month, day);
  const twoMonthsBack = shiftMonths(today, -2);
  return candidate < twoMonthsBack ? y + 1 : y;
}

function shiftMonths(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1 + n, d));
  return t.toISOString().slice(0, 10);
}

/** "7:30 PM", "7:30pm", "7 p.m.", "19:30", "noon" → "19:30". Undefined when there is no time. */
export function parseTime(s: string | undefined | null): string | undefined {
  if (!s) return undefined;
  const t = s.toLowerCase().replace(/\s+/g, " ");
  if (/\bnoon\b/.test(t)) return "12:00";
  if (/\bmidnight\b/.test(t)) return "00:00";
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?)/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3]!.startsWith("p")) h += 12;
    return `${pad(h)}:${m[2] ?? "00"}`;
  }
  const h24 = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (h24) return `${pad(Number(h24[1]))}:${h24[2]}`;
  return undefined;
}

const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";

/** The first "Month Day[, Year]" in the text. */
export function parseMonthDay(s: string, today: string): string | undefined {
  const m = s.match(new RegExp(`${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, "i"));
  if (!m) return undefined;
  const month = monthNumber(m[1]!)!;
  const day = Number(m[2]);
  const year = m[3] ? Number(m[3]) : inferYear(month, day, today);
  return ymd(year, month, day);
}

/** Every "Month Day[, Year]" in the text, in order (a year applies to the dates before it that lack one). */
export function parseAllMonthDays(s: string, today: string): string[] {
  const re = new RegExp(`${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, "gi");
  const found: { month: number; day: number; year?: number }[] = [];
  for (const m of s.matchAll(re)) found.push({ month: monthNumber(m[1]!)!, day: Number(m[2]), year: m[3] ? Number(m[3]) : undefined });
  let carry: number | undefined;
  for (let i = found.length - 1; i >= 0; i -= 1) {
    if (found[i]!.year) carry = found[i]!.year;
    else if (carry) found[i]!.year = found[i]!.month > found[i + 1]!.month ? carry - 1 : carry;
  }
  return found.map((f) => ymd(f.year ?? inferYear(f.month, f.day, today), f.month, f.day));
}

/**
 * A printed range: "Oct 20 - 25, 2026", "Oct 30 – Nov 2, 2026",
 * "October 3, 2026 – January 4, 2027", "Through Jan 3, 2027" (start
 * undefined). A single date gives start === end.
 */
export function parseDateRange(s: string, today: string): { start?: string; end?: string } | undefined {
  const t = s.replace(/\s+/g, " ").trim();
  const through = t.match(new RegExp(`(?:through|thru|until|closes)\\s+(.*)$`, "i"));
  if (through && !new RegExp(`${MONTH_RE}\\s+\\d{1,2}.*(?:through|thru|until)`, "i").test(t)) {
    const end = parseMonthDay(through[1]!, today);
    return end ? { end } : undefined;
  }
  // "Oct 20 - 25, 2026": second part is a bare day.
  const sameMonth = t.match(new RegExp(`${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:-|–|—|to|through|thru)\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?(?!\\s*:)`, "i"));
  if (sameMonth && !new RegExp(`(?:-|–|—|to|through|thru)\\s*${MONTH_RE}`, "i").test(t)) {
    const month = monthNumber(sameMonth[1]!)!;
    const a = Number(sameMonth[2]);
    const b = Number(sameMonth[3]);
    const year = sameMonth[4] ? Number(sameMonth[4]) : inferYear(month, a, today);
    return { start: ymd(year, month, a), end: ymd(year, month, b) };
  }
  const all = parseAllMonthDays(t, today);
  if (!all.length) return undefined;
  if (all.length === 1) return { start: all[0], end: all[0] };
  let [start, end] = [all[0]!, all[all.length - 1]!];
  if (end < start) end = `${Number(end.slice(0, 4)) + 1}${end.slice(4)}`;
  return { start, end };
}

/** Every date from start to end inclusive. */
export function eachDay(start: string, end: string, limit = 400): string[] {
  const out: string[] = [];
  const [y, m, d] = start.split("-").map(Number) as [number, number, number];
  for (let i = 0; i < limit; i += 1) {
    const day = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    if (day > end) break;
    out.push(day);
  }
  return out;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

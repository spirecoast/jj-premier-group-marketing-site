/**
 * The buyer's and seller's guides as a personal checklist (/buy, /sell):
 * each step can be marked done (on the day it was marked) and given a date
 * the reader means to have it done by. Kept in this browser only, one
 * localStorage key per guide (`guide:buy`, `guide:sell`); nothing leaves the
 * device except the calendar file the reader asks for, which is built here,
 * in the browser. Pure: the store and the components live in
 * components/guide-checklist.tsx.
 *
 * Steps are keyed by their number on the page (1-based), so the owners can
 * rewrite a step's words without anyone losing their place.
 */

export type GuideKey = "buy" | "sell";

export type StepMark = {
  /** YYYY-MM-DD: the day the reader marked it done. */
  done?: string;
  /** YYYY-MM-DD: the day they mean to have it done by. */
  due?: string;
};

/** Step number (1-based) to its marks. Only steps with a mark are kept. */
export type Checklist = Record<number, StepMark>;

export const CHECKLIST_KEY: Record<GuideKey, string> = { buy: "guide:buy", sell: "guide:sell" };

/** The guide's name as a calendar and a reader see it. */
export const GUIDE_NAME: Record<GuideKey, string> = { buy: "Buyer’s guide", sell: "Seller’s guide" };

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Steps a guide may have; anything past this in storage is noise. */
const MAX_STEPS = 20;

/** A real calendar day as YYYY-MM-DD, or null. */
export function validDay(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = DAY.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? s : null;
}

/** Whatever is in storage, read safely: unknown keys, bad dates and empty marks are dropped. */
export function parseChecklist(raw: string | null): Checklist {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Checklist = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const n = Number(k);
    if (!Number.isInteger(n) || n < 1 || n > MAX_STEPS || !v || typeof v !== "object") continue;
    const mark: StepMark = {};
    const done = validDay((v as StepMark).done);
    const due = validDay((v as StepMark).due);
    if (done) mark.done = done;
    if (due) mark.due = due;
    if (mark.done || mark.due) out[n] = mark;
  }
  return out;
}

function put(list: Checklist, step: number, mark: StepMark): Checklist {
  const next = { ...list };
  if (mark.done || mark.due) next[step] = mark;
  else delete next[step];
  return next;
}

/** Mark a step done on `today`, or take the mark off. */
export function setDone(list: Checklist, step: number, today: string | null): Checklist {
  const mark = { ...list[step] };
  if (today && validDay(today)) mark.done = today;
  else delete mark.done;
  return put(list, step, mark);
}

/** Give a step a date to have it done by, or take the date off (an empty or invalid day). */
export function setDue(list: Checklist, step: number, day: string | null): Checklist {
  const mark = { ...list[step] };
  const d = validDay(day);
  if (d) mark.due = d;
  else delete mark.due;
  return put(list, step, mark);
}

export type ChecklistSummary = {
  total: number;
  done: number;
  /** The first step not yet done, with its date if it has one. */
  next: { step: number; due?: string } | null;
  /** Steps with a date and not yet done, soonest first. */
  dated: { step: number; due: string }[];
  /** Any mark at all: the summary shows only then. */
  any: boolean;
};

export function summarize(list: Checklist, total: number): ChecklistSummary {
  let done = 0;
  let next: ChecklistSummary["next"] = null;
  const dated: ChecklistSummary["dated"] = [];
  for (let step = 1; step <= total; step++) {
    const m = list[step];
    if (m?.done) done += 1;
    else if (!next) next = m?.due ? { step, due: m.due } : { step };
    if (m?.due && !m.done) dated.push({ step, due: m.due });
  }
  dated.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.step - b.step));
  const any = Object.keys(list).some((k) => Number(k) <= total);
  return { total, done, next, dated, any };
}

/** "Tue, Nov 4" (and the year when it isn't `today`'s). Read as a calendar day, never shifted by a time zone. */
export function formatDay(day: string, today?: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const sameYear = today ? today.slice(0, 4) === day.slice(0, 4) : true;
  return date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

/* ---- The calendar file. The same rules as lib/ics.ts (RFC 5545 escaping,
   folding at 75 octets, all-day events ending the day after), written
   without Node's Buffer so it runs in the browser. ---- */

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const compact = (day: string) => day.replace(/-/g, "");
function dayAfter(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, "");
}
const encoder = new TextEncoder();
const octets = (s: string) => encoder.encode(s).length;
function fold(line: string): string {
  if (octets(line) <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (octets(current + ch) > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

/**
 * The dated steps that aren't done, as an iCalendar file: one all-day event
 * on each step's date, titled with the guide and the step, linking back to
 * the step on the page. `titles[i]` is step i+1's title as the page shows it.
 */
export function checklistIcs(opts: { guide: GuideKey; list: Checklist; titles: string[]; pageUrl: string; domain: string; siteName: string; now: Date }): string {
  const { guide, list, titles, pageUrl, domain, siteName, now } = opts;
  const name = GUIDE_NAME[guide];
  const events = summarize(list, titles.length).dated.flatMap(({ step, due }) => {
    const url = `${pageUrl}#step-${step}`;
    return [
      "BEGIN:VEVENT",
      `UID:guide-${guide}-step-${step}@${domain}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${compact(due)}`,
      `DTEND;VALUE=DATE:${dayAfter(due)}`,
      `SUMMARY:${esc(`Step ${step}: ${titles[step - 1]}`)}`,
      `DESCRIPTION:${esc(`${name}, step ${step} of ${titles.length}.\n${url}`)}`,
      `URL:${url}`,
      "END:VEVENT",
    ];
  });
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${siteName}//${name}//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(`${name} · ${siteName}`)}`,
      ...events,
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}

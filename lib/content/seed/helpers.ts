import { IMAGE_DIMS } from "../image-dims";
import type { ImageRef, RichText } from "../types";

/** Reference an image under /public/images by its library name. */
export function img(name: string, alt: string, position?: string): ImageRef {
  const src = name.startsWith("/") ? name : `/images/${name}.jpg`;
  const dims = IMAGE_DIMS[src];
  if (!dims) throw new Error(`Unknown seed image: ${src}`);
  return { src, alt, ...dims, ...(position ? { position } : {}) };
}

let keyCounter = 0;
const key = (prefix: string) => `${prefix}${(keyCounter += 1)}`;

/** Portable Text paragraphs from plain strings. */
export function p(...paragraphs: string[]): RichText {
  return paragraphs.map((text) => ({
    _type: "block",
    _key: key("b"),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: key("s"), text, marks: [] }],
  }));
}

/** A Portable Text heading (h2 or h3). */
export function h(level: 2 | 3, text: string): RichText {
  return [
    {
      _type: "block",
      _key: key("h"),
      style: `h${level}`,
      markDefs: [],
      children: [{ _type: "span", _key: key("s"), text, marks: [] }],
    },
  ];
}

/** A Portable Text pull quote. */
export function quote(text: string): RichText {
  return [
    {
      _type: "block",
      _key: key("q"),
      style: "blockquote",
      markDefs: [],
      children: [{ _type: "span", _key: key("s"), text, marks: [] }],
    },
  ];
}

/** Concatenate rich text fragments. */
export function rich(...parts: RichText[]): RichText {
  return parts.flat();
}

/* ---- Relative dates for the sample calendar ---------------------------------
   The seed calendar has to stay "upcoming" whatever the date, so events are
   placed relative to the time the process started. Wall-clock times are in
   the site timezone (America/New_York), whatever the server's clock says.
   Sanity content carries real dates and never touches this. ------------------ */

const TZ = "America/New_York";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

function zoneParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour) % 24,
    min: Number(p.minute),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday as string),
  };
}

/** The instant at which the site timezone reads y-m-d h:min. */
function zonedDate(y: number, m: number, d: number, h: number, min: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, min, 0, 0);
  const zp = zoneParts(new Date(guess));
  const asIfUtc = Date.UTC(zp.y, zp.m - 1, zp.d, zp.h, zp.min, 0, 0);
  const offset = asIfUtc - guess;
  return new Date(guess - offset);
}

const now = new Date();

/** Next occurrence of a weekday (0 = Sunday) at least `minDays` out, at a local hour. */
export function next(
  weekday: number,
  opts: { weeks?: number; hour?: number; minute?: number; minDays?: number } = {},
): Date {
  const { weeks = 0, hour = 19, minute = 0, minDays = 1 } = opts;
  const today = zoneParts(now);
  let delta = (weekday - today.weekday + 7) % 7;
  if (delta < minDays) delta += 7;
  // Step forward in calendar days via UTC arithmetic, then pin the wall-clock time.
  const target = new Date(Date.UTC(today.y, today.m - 1, today.d + delta + weeks * 7, 12));
  return zonedDate(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), hour, minute);
}

export function plusHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

export const iso = (d: Date) => d.toISOString();

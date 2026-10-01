import "server-only";
import { SITE_TIMEZONE, formatAddress } from "@/lib/content/format";
import type { Occurrence } from "@/lib/content/types";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * The iCalendar pieces the feeds share: escaping, folding, timestamps, one
 * VEVENT per performance, and the VCALENDAR wrapper with the site's PRODID.
 */

/** RFC 5545 text escaping. */
export const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** UTC timestamp in iCalendar basic format. */
export const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** Calendar date (YYYYMMDD) in the site timezone, for all-day events. */
const localDateFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
export function localDate(d: Date): string {
  const p = Object.fromEntries(localDateFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}`;
}
export function nextLocalDate(d: Date): string {
  return localDate(new Date(d.getTime() + 24 * 60 * 60 * 1000));
}

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
export function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (Buffer.byteLength(current + ch, "utf8") > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

/** One performance of a production as a VEVENT. */
export function vevent(o: Occurrence, now: Date): string[] {
  const e = o.event;
  const start = new Date(o.startsAt);
  const end = o.endsAt ? new Date(o.endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const allDay = o.allDay;
  const url = absoluteUrl(`/calendar/${e.slug}`);
  const description = [e.summary, e.presenter ? `Presented by ${e.presenter}` : undefined, e.priceNote ? `Tickets: ${e.priceNote}` : undefined, e.ticketUrl, url].filter(Boolean).join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:${e.slug}-${stamp(start)}@${site.domain}`,
    `DTSTAMP:${stamp(now)}`,
    allDay ? `DTSTART;VALUE=DATE:${localDate(start)}` : `DTSTART:${stamp(start)}`,
    allDay ? `DTEND;VALUE=DATE:${nextLocalDate(o.endsAt ? end : start)}` : `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(`${e.venue.name}, ${formatAddress(e.venue.address)}`)}`,
    `URL:${url}`,
    `CATEGORIES:${esc(e.category.toUpperCase())}`,
    ...(e.venue.geo ? [`GEO:${e.venue.geo.lat};${e.venue.geo.lng}`] : []),
    "END:VEVENT",
  ];
}

/** The whole file: header, the events' lines, footer, folded and CRLF-joined. */
export function vcalendar({ name, description, events }: { name: string; description: string; events: string[] }): string {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${site.name}//Encore Arts Calendar//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(name)}`,
      `X-WR-TIMEZONE:${SITE_TIMEZONE}`,
      `X-WR-CALDESC:${esc(description)}`,
      ...events,
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}

export function icsResponse(body: string, filename: string, cacheControl = "public, max-age=900, s-maxage=3600"): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": cacheControl,
    },
  });
}

import type { NextRequest } from "next/server";
import { getEvent, getUpcomingEvents } from "@/lib/content";
import { SITE_TIMEZONE, formatAddress } from "@/lib/content/format";
import type { Event } from "@/lib/content/types";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 3600;

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** UTC timestamp in iCalendar basic format. */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** Calendar date (YYYYMMDD) in the site timezone, for all-day events. */
const localDateFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
function localDate(d: Date): string {
  const p = Object.fromEntries(localDateFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}`;
}
function nextLocalDate(d: Date): string {
  return localDate(new Date(d.getTime() + 24 * 60 * 60 * 1000));
}

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string {
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

function vevent(e: Event, now: Date): string[] {
  const start = new Date(e.startsAt);
  const end = e.endsAt ? new Date(e.endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const url = absoluteUrl(`/calendar/${e.slug}`);
  const description = [e.summary, e.priceNote ? `Tickets: ${e.priceNote}` : undefined, e.ticketUrl, url].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${e.slug}@${site.domain}`,
    `DTSTAMP:${stamp(now)}`,
    e.allDay ? `DTSTART;VALUE=DATE:${localDate(start)}` : `DTSTART:${stamp(start)}`,
    e.allDay ? `DTEND;VALUE=DATE:${nextLocalDate(e.endsAt ? end : start)}` : `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(`${e.venue.name}, ${formatAddress(e.venue.address)}`)}`,
    `URL:${url}`,
    `CATEGORIES:${esc(e.category.toUpperCase())}`,
    ...(e.venue.geo ? [`GEO:${e.venue.geo.lat};${e.venue.geo.lng}`] : []),
    "END:VEVENT",
  ];
  return lines;
}

/**
 * GET /api/calendar.ics            → every upcoming event
 * GET /api/calendar.ics?event=slug → one event
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("event");
  const events = slug ? [await getEvent(slug)].filter((e): e is Event => Boolean(e)) : await getUpcomingEvents();
  if (slug && !events.length) return new Response("Not found", { status: 404 });

  const now = new Date();
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Encore Arts Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Encore Arts Calendar · ${site.name}`)}`,
    "X-WR-TIMEZONE:America/New_York",
    `X-WR-CALDESC:${esc("Theater, music and art this week in Sarasota, Bradenton, Lakewood Ranch and Tampa.")}`,
    ...events.flatMap((e) => vevent(e, now)),
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug ? `${slug}.ics` : "encore-arts-calendar.ics"}"`,
      "Cache-Control": "public, max-age=900, s-maxage=3600",
    },
  });
}

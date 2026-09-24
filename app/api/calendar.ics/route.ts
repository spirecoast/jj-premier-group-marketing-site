import type { NextRequest } from "next/server";
import { getEvent, getOccurrences, getOnView } from "@/lib/content";
import { EVENT_CATEGORY_LABEL, SITE_TIMEZONE, formatAddress } from "@/lib/content/format";
import { isRegionSlug, marketName } from "@/lib/content/markets";
import { isEventCategory } from "@/lib/encore/categories";
import type { Event, Occurrence } from "@/lib/content/types";
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

function vevent(o: Occurrence, now: Date): string[] {
  const e = o.event;
  const start = new Date(o.startsAt);
  const end = o.endsAt ? new Date(o.endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const allDay = o.allDay;
  const url = absoluteUrl(`/calendar/${e.slug}`);
  const description = [e.summary, e.presenter ? `Presented by ${e.presenter}` : undefined, e.priceNote ? `Tickets: ${e.priceNote}` : undefined, e.ticketUrl, url].filter(Boolean).join("\n");
  const lines = [
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
  return lines;
}

/**
 * GET /api/calendar.ics                       → every upcoming event
 * GET /api/calendar.ics?event=slug            → one production, every date
 * GET /api/calendar.ics?event=slug&at=<iso>   → one performance
 * GET /api/calendar.ics?category=music&market=sarasota&venue=van-wezel
 *                                             → a subscription feed of just that filter
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const slug = sp.get("event");
  const at = sp.get("at");
  const categoryParam = sp.get("category");
  const category = isEventCategory(categoryParam) ? categoryParam : undefined;
  const marketParam = sp.get("market");
  const market = isRegionSlug(marketParam) ? marketParam : undefined;
  const venue = sp.get("venue")?.match(/^[a-z0-9-]{1,120}$/) ? sp.get("venue")! : undefined;
  const now = new Date();
  const horizon = new Date(now.getTime() + 183 * 24 * 60 * 60 * 1000);
  let events: Occurrence[];
  if (slug) {
    const e = await getEvent(slug);
    if (!e) return new Response("Not found", { status: 404 });
    const perfs = e.performances?.length ? e.performances : [{ startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay }];
    const chosen = at ? perfs.filter((p) => p.startsAt === at) : perfs;
    events = (chosen.length ? chosen : perfs).map((p) => ({ event: e, ...p }));
  } else {
    const [dated, onView] = await Promise.all([getOccurrences({ from: now, to: horizon, category, market, venue }), getOnView({ category, market })]);
    events = [...dated, ...onView.filter((e) => !venue || e.venue.slug === venue).map((e) => ({ event: e, startsAt: e.startsAt, endsAt: e.endsAt, allDay: true }))];
  }
  const feedName = [category ? EVENT_CATEGORY_LABEL[category] : undefined, market ? marketName(market) : undefined, venue ? events[0]?.event.venue.name : undefined]
    .filter(Boolean)
    .join(" · ");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Encore Arts Calendar//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Encore${feedName ? ` · ${feedName}` : ""} · ${site.name}`)}`,
    "X-WR-TIMEZONE:America/New_York",
    `X-WR-CALDESC:${esc("Theater, music and art this week in Lakewood Ranch, Sarasota and Bradenton.")}`,
    ...events.flatMap((e) => vevent(e, now)),
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n") + "\r\n";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug ? `${slug}${at ? `-${at.slice(0, 10)}` : ""}.ics` : "encore-arts-calendar.ics"}"`,
      "Cache-Control": "public, max-age=900, s-maxage=3600",
    },
  });
}

import type { NextRequest } from "next/server";
import { getEvent, getOccurrences, getOnView } from "@/lib/content";
import { EVENT_CATEGORY_LABEL } from "@/lib/content/format";
import { isRegionSlug, marketName } from "@/lib/content/markets";
import { isEventCategory } from "@/lib/encore/categories";
import type { Occurrence } from "@/lib/content/types";
import { icsResponse, vcalendar, vevent } from "@/lib/ics";
import { site } from "@/lib/site";

export const revalidate = 3600;

/** The unfiltered feed's window: a phone calendar refreshes this every few hours, so it stays small. */
const DEFAULT_DAYS = 90;
/** Filtered feeds, and the full feed (`?all=1`), run six months out. */
const FULL_DAYS = 183;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/calendar.ics                       → the next 90 days, every category and market
 * GET /api/calendar.ics?all=1                 → every upcoming event, six months out
 * GET /api/calendar.ics?event=slug            → one production, every date
 * GET /api/calendar.ics?event=slug&at=<iso>   → one performance
 * GET /api/calendar.ics?category=music&market=sarasota&venue=van-wezel
 *                                             → a subscription feed of just that filter
 *
 * A visit plan (showing blocks plus the evenings' picks) is /api/calendar/plan.ics.
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
  const all = sp.get("all") === "1";
  const now = new Date();
  // Unfiltered and not asked for in full: the rolling 90-day window.
  const windowed = !(all || category || market || venue);
  const days = windowed ? DEFAULT_DAYS : FULL_DAYS;
  const horizon = new Date(now.getTime() + days * DAY_MS);
  let events: Occurrence[];
  if (slug) {
    const e = await getEvent(slug);
    if (!e) return new Response("Not found", { status: 404 });
    const perfs = e.performances?.length ? e.performances : [{ startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay }];
    const chosen = at ? perfs.filter((p) => p.startsAt === at) : perfs;
    events = (chosen.length ? chosen : perfs).map((p) => ({ event: e, ...p }));
  } else {
    const [dated, onView] = await Promise.all([getOccurrences({ from: now, to: horizon, category, market, venue }), getOnView({ category, market })]);
    // Exhibitions: every current run, plus (in the 90-day feed) only the ones opening inside the window.
    const runs = onView.filter((e) => (!venue || e.venue.slug === venue) && (!windowed || Date.parse(e.startsAt) <= horizon.getTime()));
    events = [...dated, ...runs.map((e) => ({ event: e, startsAt: e.startsAt, endsAt: e.endsAt, allDay: true }))];
  }
  const feedName = [category ? EVENT_CATEGORY_LABEL[category] : undefined, market ? marketName(market) : undefined, venue ? events[0]?.event.venue.name : undefined]
    .filter(Boolean)
    .join(" · ");
  const body = vcalendar({
    name: `Encore${feedName ? ` · ${feedName}` : ""} · ${site.name}`,
    description: "Theater, music and art this week in Lakewood Ranch, Sarasota and Bradenton.",
    events: events.flatMap((e) => vevent(e, now)),
  });
  return icsResponse(body, slug ? `${slug}${at ? `-${at.slice(0, 10)}` : ""}.ics` : "encore-arts-calendar.ics");
}

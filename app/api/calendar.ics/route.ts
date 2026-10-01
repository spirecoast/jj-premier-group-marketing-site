import type { NextRequest } from "next/server";
import { getEvent, getOccurrences, getOnView } from "@/lib/content";
import { EVENT_CATEGORY_LABEL } from "@/lib/content/format";
import { isRegionSlug, marketName } from "@/lib/content/markets";
import { isEventCategory } from "@/lib/encore/categories";
import type { Occurrence } from "@/lib/content/types";
import { icsResponse, vcalendar, vevent } from "@/lib/ics";
import { site } from "@/lib/site";

export const revalidate = 3600;

/**
 * GET /api/calendar.ics                       → every upcoming event
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
  const body = vcalendar({
    name: `Encore${feedName ? ` · ${feedName}` : ""} · ${site.name}`,
    description: "Theater, music and art this week in Lakewood Ranch, Sarasota and Bradenton.",
    events: events.flatMap((e) => vevent(e, now)),
  });
  return icsResponse(body, slug ? `${slug}${at ? `-${at.slice(0, 10)}` : ""}.ics` : "encore-arts-calendar.ics");
}

import type { NextRequest } from "next/server";
import { getEvent } from "@/lib/content";
import { zonedInstant } from "@/lib/content/encore";
import type { Event } from "@/lib/content/types";
import { getEncoreIndex, localDay } from "@/lib/encore/data";
import { SHOWINGS, buildPlan, marketList, parsePlanState, planHref, stayDays } from "@/lib/encore/plan";
import { daysInRange, longDay } from "@/lib/encore/select";
import { esc, icsResponse, stamp, vcalendar, vevent } from "@/lib/ics";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * GET /api/calendar/plan.ics?from=&to=&market=&cat=&evenings=&pick=slug:start…
 *
 * A visit plan as a calendar file: one "Showings with us" block from ten to
 * four on every day of the stay, then the evenings' picks. The picks come
 * from the page as `pick=slug:startMs` so the file matches what was on
 * screen; without them the plan is rebuilt here from the same index.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const now = new Date();
  const today = localDay(now.getTime());
  const { state } = parsePlanState(sp, today);
  const url = absoluteUrl(planHref(state));

  // Which performances: the page's picks, or a fresh build.
  let wanted: { slug: string; start: number }[] = sp
    .getAll("pick")
    .map((p) => {
      const at = p.lastIndexOf(":");
      return { slug: p.slice(0, at), start: Number(p.slice(at + 1)) };
    })
    .filter((p) => /^[a-z0-9-]{1,120}$/.test(p.slug) && Number.isFinite(p.start))
    .filter((p, i, all) => all.findIndex((q) => q.slug === p.slug && q.start === p.start) === i)
    .slice(0, 80);
  if (!wanted.length) {
    const plan = buildPlan(getEncoreIndex(), state, today, now.getTime());
    wanted = plan.days.flatMap((d) => [...(d.matinee ? [d.matinee] : []), ...d.picks]).map((o) => ({ slug: o.e.s, start: o.start }));
  }

  const showings = stayDays(state).flatMap((d) => {
    const start = zonedInstant(d.day, SHOWINGS.from);
    const end = zonedInstant(d.day, SHOWINGS.to);
    return [
      "BEGIN:VEVENT",
      `UID:visit-${d.day}@${site.domain}`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`Showings with us · ${marketList(d.markets)}`)}`,
      `DESCRIPTION:${esc(`${SHOWINGS.description}\n${marketList(d.markets)}, ${longDay(d.day)}.\n${url}`)}`,
      `LOCATION:${esc(marketList(d.markets))}`,
      `URL:${url}`,
      "CATEGORIES:SHOWINGS",
      "END:VEVENT",
    ];
  });

  const cache = new Map<string, Promise<Event | undefined>>();
  const events = await Promise.all(
    wanted.map(async ({ slug, start }) => {
      if (!cache.has(slug)) cache.set(slug, getEvent(slug));
      const e = await cache.get(slug);
      if (!e) return [];
      const perfs = e.performances?.length ? e.performances : [{ startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay }];
      const p = perfs.find((x) => Date.parse(x.startsAt) === start);
      return p ? vevent({ event: e, ...p }, now) : [];
    }),
  );

  const body = vcalendar({
    name: `Encore visit plan · ${site.name}`,
    description: `Showings by day and Encore by night, ${daysInRange(state.from, state.to).length} days from ${longDay(state.from)}.`,
    events: [...showings, ...events.flat()],
  });
  return icsResponse(body, `encore-visit-plan-${state.from}.ics`, "private, max-age=0, no-store");
}

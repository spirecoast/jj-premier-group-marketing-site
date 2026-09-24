import type { Metadata, Route } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { FilterChips, type Chip } from "@/components/filter-chips";
import { LetterForm } from "@/components/letter-form";
import { SectionHeading } from "@/components/section-heading";
import { getOccurrences, getOnView, getVenues } from "@/lib/content";
import { zonedInstant } from "@/lib/content/encore";
import { EVENT_CATEGORY_LABEL, SITE_TIMEZONE, formatRun, formatTime } from "@/lib/content/format";
import { REGIONS, isRegionSlug, marketName } from "@/lib/content/markets";
import type { Event, EventCategory, Occurrence, RegionSlug } from "@/lib/content/types";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Encore Arts Calendar",
  description:
    "Theater, concerts, galleries and festivals in Lakewood Ranch, Sarasota and Bradenton, by date and by venue. The Encore Arts Calendar from JJ Premier Group.",
  path: "/calendar",
});

type SearchParams = Record<string, string | string[] | undefined>;
const CATEGORIES = Object.keys(EVENT_CATEGORY_LABEL) as EventCategory[];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/* ---- Local-date helpers (site timezone, no client JS) -------------------- */
const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});
function localParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), weekday: p.weekday as string };
}
const dayKey = (d: Date) => {
  const { y, m, d: day } = localParts(d);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
const dayHeading = new Intl.DateTimeFormat("en-US", {
  timeZone: SITE_TIMEZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});
const monthHeading = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, month: "long", year: "numeric" });
const shortRange = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, month: "short", day: "numeric" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;
/** The list view shows one week at a time; if a filter comes up empty, it looks ahead to the end of the season. */
const LIST_DAYS = 7;
const LIST_DAYS_FALLBACK = 120;
const isoDay = (d: Date) => dayKey(d);
const MAX_PER_CELL = 6;
const ON_VIEW_PREVIEW = 12;

function hrefFor(q: { view?: string; category?: string; market?: string; month?: string; day?: string; from?: string; onview?: string }): Route {
  const sp = new URLSearchParams();
  if (q.view === "month") sp.set("view", "month");
  if (q.category) sp.set("category", q.category);
  if (q.market) sp.set("market", q.market);
  if (q.month) sp.set("month", q.month);
  if (q.day) sp.set("day", q.day);
  if (q.from) sp.set("from", q.from);
  if (q.onview) sp.set("onview", q.onview);
  const qs = sp.toString();
  return (qs ? `/calendar?${qs}` : "/calendar") as Route;
}

function MonthGrid({ occurrences, year, month }: { occurrences: Occurrence[]; year: number; month: number }) {
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const offset = WEEKDAYS.indexOf(localParts(first).weekday);
  const byDay = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const k = dayKey(new Date(o.startsAt));
    byDay.set(k, [...(byDay.get(k) ?? []), o]);
  }
  const todayKey = dayKey(new Date());
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px] border border-hairline bg-hairline">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((w) => (
            <div key={w} className="t-mono-sm bg-linen-100 px-3 py-2 text-graphite-600">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            const key = day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : `blank-${i}`;
            const dayItems = day ? (byDay.get(key) ?? []) : [];
            const shown = dayItems.slice(0, MAX_PER_CELL);
            const more = dayItems.length - shown.length;
            const isToday = key === todayKey;
            return (
              <div key={key} className={cn("relative flex min-h-[112px] flex-col gap-1.5 bg-white p-2.5", !day && "bg-paper")}>
                {day ? (
                  <span className={cn("font-mono text-[12px] tabular-nums", isToday ? "text-sky-700" : "text-graphite-500")}>
                    <span aria-hidden="true">
                      {String(day).padStart(2, "0")}
                      {isToday ? " · today" : ""}
                    </span>
                    <span className="sr-only">{dayHeading.format(new Date(Date.UTC(year, month - 1, day, 12)))}{isToday ? ", today" : ""}</span>
                  </span>
                ) : null}
                {shown.map((o) => (
                  <Link
                    key={`${o.event.slug}-${o.startsAt}`}
                    href={`/calendar/${o.event.slug}`}
                    className="flex flex-col gap-0.5 border-l-2 border-sky-300 pl-2 text-[13px] leading-tight text-navy transition-colors hover:border-navy"
                  >
                    <span className="font-display text-[15px] font-normal">{o.event.title}</span>
                    <span className="t-mono-sm text-graphite-500">
                      {o.allDay ? "All day" : formatTime(o.startsAt)} · {marketName(o.event.venue.market)}
                    </span>
                  </Link>
                ))}
                {more > 0 ? (
                  <Link href={hrefFor({ day: key })} className="t-mono-sm pl-2 text-harbor-700 underline underline-offset-4 hover:text-navy">
                    + {more} more
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OnViewStrip({ events, limit, moreHref }: { events: Event[]; limit?: number; moreHref: Route }) {
  if (!events.length) return null;
  const shown = limit ? events.slice(0, limit) : events;
  const more = events.length - shown.length;
  return (
    <section aria-labelledby="on-view-title" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hairline pb-3">
        <h2 id="on-view-title" className="t-record uppercase text-graphite-600">
          On view now
        </h2>
        {more > 0 ? (
          <Link href={moreHref} className="link-rule whitespace-nowrap">
            All {events.length} on view →
          </Link>
        ) : null}
      </div>
      <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((e) => (
          <li key={e.slug} className="flex flex-col gap-0.5 border-l-2 border-amber pl-3">
            <Link href={`/calendar/${e.slug}`} className="t-h4 text-navy transition-colors hover:text-harbor-700">
              {e.title}
            </Link>
            <span className="t-mono-sm text-graphite-500">
              {e.venue.name} · {formatRun(e)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The calendar. List view groups by day; month view is a plain grid.
 * Both are links and server rendering, so every view is a URL.
 */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const view = one(params.view) === "month" ? "month" : "list";
  const categoryParam = one(params.category);
  const category = CATEGORIES.includes(categoryParam as EventCategory) ? (categoryParam as EventCategory) : undefined;
  const marketParam = one(params.market);
  const market = isRegionSlug(marketParam) ? (marketParam as RegionSlug) : undefined;

  const now = new Date();
  const monthParam = one(params.month)?.match(/^(\d{4})-(\d{2})$/);
  const current = localParts(now);
  const year = monthParam ? Number(monthParam[1]) : current.y;
  const month = monthParam ? Number(monthParam[2]) : current.m;

  const dayParam = one(params.day)?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dayStart = dayParam ? zonedInstant(dayParam[0], "00:00") : undefined;
  const allOnView = one(params.onview) === "all";
  const fromParam = one(params.from)?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const todayKey = isoDay(now);
  const weekStartKey = fromParam && fromParam[0] > todayKey ? fromParam[0] : todayKey;
  const weekStart = weekStartKey === todayKey ? now : zonedInstant(weekStartKey, "00:00");

  const monthStart = zonedInstant(`${year}-${String(month).padStart(2, "0")}-01`, "00:00");
  const monthEnd = zonedInstant(month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`, "00:00");
  const listFrom = dayStart ?? weekStart;
  const listTo = dayStart ? new Date(dayStart.getTime() + DAY_MS + 3_600_000) : zonedInstant(isoDay(new Date(weekStart.getTime() + LIST_DAYS * DAY_MS)), "00:00");
  const nextWeekKey = isoDay(listTo);
  const prevWeekKey = isoDay(new Date(weekStart.getTime() - LIST_DAYS * DAY_MS));
  const weekRange = `${shortRange.format(new Date(weekStart.getTime() + (weekStartKey === todayKey ? 0 : 12 * 3_600_000)))} – ${shortRange.format(new Date(listTo.getTime() - 12 * 3_600_000))}`;

  const [firstPass, monthOccurrences, onView, venues] = await Promise.all([
    view === "list" ? getOccurrences({ from: listFrom, to: listTo, category, market }) : Promise.resolve([] as Occurrence[]),
    view === "month" ? getOccurrences({ from: monthStart, to: monthEnd, category, market }) : Promise.resolve([] as Occurrence[]),
    view === "list" && !dayStart && weekStartKey === todayKey ? getOnView({ category, market }) : Promise.resolve([] as Event[]),
    getVenues(market),
  ]);
  const lookedAhead = view === "list" && !dayStart && firstPass.length === 0;
  const upcoming = lookedAhead
    ? (await getOccurrences({ from: weekStart, to: new Date(weekStart.getTime() + LIST_DAYS_FALLBACK * DAY_MS), category, market })).slice(0, 40)
    : firstPass;
  const listing = dayStart ? upcoming.filter((o) => dayKey(new Date(o.startsAt)) === dayParam![0]) : upcoming;

  const grouped = new Map<string, Occurrence[]>();
  for (const o of listing) {
    const k = dayKey(new Date(o.startsAt));
    grouped.set(k, [...(grouped.get(k) ?? []), o]);
  }
  const listLabel = dayStart
    ? dayHeading.format(new Date(dayStart.getTime() + 12 * 3_600_000))
    : lookedAhead
      ? "Nothing this week on this filter. Here is what is coming."
      : weekStartKey === todayKey
        ? `This week · ${weekRange}`
        : weekRange;

  const base = { category, market };
  const categoryChips: Chip[] = [
    { label: "Everything", href: hrefFor({ ...base, category: undefined, view }), active: !category },
    ...CATEGORIES.map((c) => ({ label: EVENT_CATEGORY_LABEL[c], href: hrefFor({ ...base, category: c, view }), active: category === c })),
  ];
  const marketChips: Chip[] = [
    { label: "Everywhere", href: hrefFor({ ...base, market: undefined, view }), active: !market },
    ...REGIONS.map((m) => ({ label: m.name, href: hrefFor({ ...base, market: m.slug, view }), active: market === m.slug })),
  ];
  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthLabel = monthHeading.format(new Date(Date.UTC(year, month - 1, 1, 12)));
  const toggle = "t-label flex h-11 items-center px-4 transition-colors";

  return (
    <>
      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="calendar-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="Encore Arts Calendar"
          title={<span id="calendar-title">What&rsquo;s on stage, in the hall and on the walls, close to home.</span>}
          titleClassName="max-w-[860px]"
        />

        <div className="flex flex-col gap-5 border-y border-hairline py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex border border-rule" role="group" aria-label="View">
              <Link href={hrefFor({ ...base, view: "list" })} aria-current={view === "list" ? "true" : undefined} className={cn(toggle, view === "list" ? "bg-navy text-linen-200" : "text-navy hover:bg-linen-100")}>
                List
              </Link>
              <Link href={hrefFor({ ...base, view: "month" })} aria-current={view === "month" ? "true" : undefined} className={cn(toggle, view === "month" ? "bg-navy text-linen-200" : "text-navy hover:bg-linen-100")}>
                Month
              </Link>
            </div>
            <a href="/api/calendar.ics" className="link-rule">
              Add to your calendar
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="t-mono-sm text-graphite-500">What</p>
            <FilterChips label="Category" chips={categoryChips} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="t-mono-sm text-graphite-500">Where</p>
            <FilterChips label="Market" chips={marketChips} />
          </div>
        </div>

        {view === "month" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href={hrefFor({ ...base, view: "month", month: prevMonth })} className="link-rule whitespace-nowrap">
                ← Previous
              </Link>
              <h2 className="t-h2 order-first w-full text-center text-navy sm:order-none sm:w-auto">{monthLabel}</h2>
              <Link href={hrefFor({ ...base, view: "month", month: nextMonth })} className="link-rule whitespace-nowrap">
                Next →
              </Link>
            </div>
            <MonthGrid occurrences={monthOccurrences} year={year} month={month} />
          </div>
        ) : grouped.size || onView.length ? (
          <div className="flex flex-col gap-12">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="t-eyebrow text-amber">{listLabel}</p>
              {dayStart ? (
                <Link href={hrefFor({ ...base })} className="link-rule">
                  Back to this week
                </Link>
              ) : !lookedAhead ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {weekStartKey !== todayKey ? (
                    <Link href={hrefFor({ ...base, from: prevWeekKey > todayKey ? prevWeekKey : undefined })} className="link-rule whitespace-nowrap">
                      ← Previous week
                    </Link>
                  ) : null}
                  <Link href={hrefFor({ ...base, from: nextWeekKey })} className="link-rule whitespace-nowrap">
                    Next week →
                  </Link>
                </div>
              ) : null}
            </div>
            {[...grouped.entries()].map(([key, items]) => (
              <section key={key} aria-labelledby={`day-${key}`} className="flex flex-col gap-5">
                <h2 id={`day-${key}`} className="t-record border-b border-hairline pb-3 uppercase text-graphite-600">
                  {dayHeading.format(new Date(items[0]!.startsAt))}
                </h2>
                <ul className="grid gap-4 lg:grid-cols-2">
                  {items.map((o) => (
                    <li key={`${o.event.slug}-${o.startsAt}`} className="flex min-w-0">
                      <EventCard variant="row" event={o.event} at={{ startsAt: o.startsAt, endsAt: o.endsAt, allDay: o.allDay }} showMeta className="w-full" />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <OnViewStrip events={onView} limit={allOnView ? undefined : ON_VIEW_PREVIEW} moreHref={hrefFor({ ...base, onview: "all" })} />
            {!dayStart && !lookedAhead ? (
              <div className="flex flex-wrap justify-between gap-4 border-t border-hairline pt-6">
                {weekStartKey !== todayKey ? (
                  <Link href={hrefFor({ ...base, from: prevWeekKey > todayKey ? prevWeekKey : undefined })} className="link-rule whitespace-nowrap">
                    ← Previous week
                  </Link>
                ) : (
                  <span />
                )}
                <Link href={hrefFor({ ...base, from: nextWeekKey })} className="link-rule whitespace-nowrap">
                  Next week →
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4 border border-hairline bg-white p-8 md:p-10">
            <p className="t-eyebrow text-amber">Nothing yet</p>
            <h2 className="t-h1 text-navy">A quiet week on this filter.</h2>
            <p className="t-body max-w-measure text-body">
              Widen the filter and there&rsquo;s usually something on. The box below gets the week&rsquo;s list to your inbox.
            </p>
            <div>
              <Link href="/calendar" className="link-rule">
                Clear the filters
              </Link>
            </div>
          </div>
        )}
      </section>

      {venues.length ? (
        <section className="container-site flex flex-col gap-6 pb-section" aria-labelledby="venues-title">
          <h2 id="venues-title" className="t-eyebrow text-amber">
            The venues
          </h2>
          <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <li key={v.slug} className="flex flex-wrap items-baseline gap-x-2">
                <Link href={`/venues/${v.slug}`} className="t-h4 -my-1.5 inline-block py-1.5 text-navy transition-colors hover:text-harbor-700">
                  {v.name}
                </Link>
                <span className="t-mono-sm text-graphite-500">{marketName(v.market)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="subscribe" className="scroll-mt-header bg-linen-200">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-amber">Every Monday</p>
            <h2 className="t-h1 text-navy">Get Encore in your inbox.</h2>
            <p className="t-body max-w-measure text-body">
              The week&rsquo;s shows, concerts and openings, in one email every Monday.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <LetterForm form="calendar" label="Subscribe" />
            <p className="t-small text-linen-700">
              Prefer your own calendar app?{" "}
              <a href="/api/calendar.ics" className="text-navy underline underline-offset-4 hover:text-harbor-700">
                Subscribe to the feed
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

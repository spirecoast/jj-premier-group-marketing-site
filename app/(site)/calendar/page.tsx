import type { Metadata, Route } from "next";
import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { FilterChips, type Chip } from "@/components/filter-chips";
import { LetterForm } from "@/components/letter-form";
import { SectionHeading } from "@/components/section-heading";
import { getUpcomingEvents, getVenues } from "@/lib/content";
import { EVENT_CATEGORY_LABEL, SITE_TIMEZONE, formatTime } from "@/lib/content/format";
import { REGIONS, isRegionSlug, marketName } from "@/lib/content/markets";
import type { Event, EventCategory, RegionSlug } from "@/lib/content/types";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Encore Arts Calendar",
  description:
    "Theater, music, galleries and festivals this week in Lakewood Ranch, Sarasota and Bradenton. The Encore Arts Calendar from JJ Premier Group.",
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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hrefFor(q: { view?: string; category?: string; market?: string; month?: string }): Route {
  const sp = new URLSearchParams();
  if (q.view === "month") sp.set("view", "month");
  if (q.category) sp.set("category", q.category);
  if (q.market) sp.set("market", q.market);
  if (q.month) sp.set("month", q.month);
  const qs = sp.toString();
  return (qs ? `/calendar?${qs}` : "/calendar") as Route;
}

function MonthGrid({ events, year, month }: { events: Event[]; year: number; month: number }) {
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
  const offset = WEEKDAYS.indexOf(localParts(first).weekday);
  const byDay = new Map<string, Event[]>();
  for (const e of events) {
    const k = dayKey(new Date(e.startsAt));
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
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
            const dayEvents = day ? (byDay.get(key) ?? []) : [];
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
                {dayEvents.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/calendar/${e.slug}`}
                    className="flex flex-col gap-0.5 border-l-2 border-sky-300 pl-2 text-[13px] leading-tight text-navy transition-colors hover:border-navy"
                  >
                    <span className="font-display text-[15px] font-normal">{e.title}</span>
                    <span className="t-mono-sm text-graphite-500">
                      {formatTime(e.startsAt)} · {marketName(e.venue.market)}
                    </span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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

  const [upcoming, allEvents, venues] = await Promise.all([
    getUpcomingEvents({ category, market }),
    view === "month" ? getUpcomingEvents({ category, market, includePast: true }) : Promise.resolve([] as Event[]),
    getVenues(market),
  ]);

  const monthEvents = allEvents.filter((e) => {
    const p = localParts(new Date(e.startsAt));
    return p.y === year && p.m === month;
  });

  const grouped = new Map<string, Event[]>();
  for (const e of upcoming) {
    const k = dayKey(new Date(e.startsAt));
    grouped.set(k, [...(grouped.get(k) ?? []), e]);
  }

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
          title={<span id="calendar-title">Theater, music and art this week, close to home.</span>}
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
            <MonthGrid events={monthEvents} year={year} month={month} />
          </div>
        ) : grouped.size ? (
          <div className="flex flex-col gap-12">
            {[...grouped.entries()].map(([key, events]) => (
              <section key={key} aria-labelledby={`day-${key}`} className="flex flex-col gap-5">
                <h2 id={`day-${key}`} className="t-record border-b border-hairline pb-3 uppercase text-graphite-600">
                  {dayHeading.format(new Date(events[0]!.startsAt))}
                </h2>
                <ul className="grid gap-4 lg:grid-cols-2">
                  {events.map((e) => (
                    <li key={e.slug} className="flex">
                      <EventCard variant="row" event={e} showMeta className="w-full" />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 border border-hairline bg-white p-8 md:p-10">
            <p className="t-eyebrow text-amber">Nothing yet</p>
            <h2 className="t-h1 text-navy">A quiet week on this filter.</h2>
            <p className="t-body max-w-measure text-body">
              Widen it and there’s usually something on. The full list lands every Monday; the box below gets you on it.
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
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {venues.map((v) => (
              <li key={v.slug}>
                <Link href={`/venues/${v.slug}`} className="t-h4 -my-1.5 inline-block py-1.5 text-navy transition-colors hover:text-harbor-700">
                  {v.name}
                </Link>
                <span className="t-mono-sm ml-2 text-graphite-500">{marketName(v.market)}</span>
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

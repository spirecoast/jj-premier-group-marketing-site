import type { Metadata, Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CompareAsk, CompareEmpty, CompareGoal, CompareShare } from "@/components/atlas/compare-client";
import { CompareTable, type ComparePlace } from "@/components/atlas/compare-table";
import { JsonLd } from "@/components/json-ld";
import { getUpcomingEvents } from "@/lib/content";
import { SITE_TIMEZONE } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import type { Event, MarketSlug } from "@/lib/content/types";
import { compareRows } from "@/lib/neighborhoods/compare";
import { DATASET_VERSION, getAncestors, getRecord } from "@/lib/neighborhoods/data";
import { monthYear } from "@/lib/neighborhoods/format";
import { COMPARE_MAX } from "@/lib/neighborhoods/my-places";
import { parseList } from "@/lib/neighborhoods/url";
import { PLACE_SALES_COPY } from "@/components/sales/copy";
import { fmtDate, int, usd } from "@/components/sales/format";
import { getSalesManifest, salesForPlace } from "@/lib/sales";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { dayIn } from "@/lib/time";

export const metadata: Metadata = pageMetadata({
  title: "Compare places · Atlas",
  description: "Two to four saved neighborhoods side by side: every fact with its source and the day it was checked.",
  path: "/neighborhoods/compare",
  // The page is a view of a visitor's own list; the places have their own pages.
  noIndex: true,
});

type Search = Promise<Record<string, string | string[] | undefined>>;

/** Productions in the place's market with a date this month (site time), soonest first. */
function thisMonth(events: Event[], today: string): Event[] {
  const month = today.slice(0, 7);
  return events.filter((e) => {
    const days = (e.performances?.length ? e.performances.map((p) => p.startsAt) : [e.startsAt]).map((iso) => dayIn(SITE_TIMEZONE, new Date(iso)));
    return days.some((d) => d.slice(0, 7) === month && d >= today);
  });
}

/**
 * /neighborhoods/compare?places=a,b,c: up to four saved places side by side.
 * The rows are the record's own facts, each with its source and checked
 * date (lib/neighborhoods/compare.ts), then Encore's month in each place's
 * market. Nothing invented: a fact the record doesn't hold says so. Read per
 * request, since the list is the visitor's.
 */
export default async function ComparePage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const raw = sp.places;
  const slugs = parseList(Array.isArray(raw) ? raw[0] : raw).slice(0, COMPARE_MAX);
  const found = (await Promise.all(slugs.map(async (slug) => {
    const record = await getRecord(slug);
    return record ? { record, ancestors: await getAncestors(slug) } : null;
  }))).filter((p): p is ComparePlace => p !== null);
  const asOf = monthYear(DATASET_VERSION) ?? DATASET_VERSION;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Atlas", path: "/neighborhoods" },
    { name: "Compare", path: "/neighborhoods/compare" },
  ];

  if (found.length < 2) {
    return (
      <>
        <JsonLd data={breadcrumbJsonLd(crumbs)} />
        <section className="container-site flex flex-col gap-8 py-section">
          <div className="flex flex-col gap-3">
            <h1 className="t-display text-navy">Compare</h1>
            <p className="t-body max-w-measure text-body">Two to four saved places, side by side.</p>
          </div>
          <CompareEmpty given={found.length} />
        </section>
      </>
    );
  }

  const rows = compareRows(found.map((p) => p.record));
  const today = dayIn(SITE_TIMEZONE);
  const markets = [...new Set(found.map((p) => p.record.market as MarketSlug))];
  const encore = new Map(await Promise.all(markets.map(async (m) => [m, thisMonth(await getUpcomingEvents({ market: m, includePast: true }), today)] as const)));
  const encoreCells: ReactNode[] = found.map(({ record: r }) => {
    const m = r.market as MarketSlug;
    const list = encore.get(m) ?? [];
    const calendar = `/calendar?market=${m}` as Route;
    return (
      <span key={r.slug} className="compare-cell">
        {list.length ? (
          <>
            <span className="t-small text-body">
              {list.length} in {marketName(m)} ·{" "}
              {list.slice(0, 3).map((e, i) => (
                <span key={e.slug}>
                  {i ? ", " : ""}
                  <Link href={`/calendar/${e.slug}`}>{e.title}</Link>
                </span>
              ))}
              {list.length > 3 ? ", …" : ""}
            </span>
            <Link href={calendar} className="t-note">
              Encore Arts Calendar · {monthYear(today)}
            </Link>
          </>
        ) : (
          <>
            <span className="t-small text-graphite-500">Nothing listed this month in {marketName(m)}.</span>
            <Link href={calendar} className="t-note">
              See {marketName(m)} on the calendar
            </Link>
          </>
        )}
      </span>
    );
  });
  // Sales: the county's qualified sales in each place's own subdivisions (lib/sales/places.ts), or its ZIP area, labelled which.
  const [salesByPlace, manifest] = await Promise.all([Promise.all(found.map(({ record: r }) => salesForPlace(r.slug))), getSalesManifest().catch(() => null)]);
  const salesCells: ReactNode[] = found.map(({ record: r }, i) => {
    const s = salesByPlace[i];
    const own = s?.joined ?? null;
    const figures = own?.summary ?? s?.zipArea?.summary ?? null;
    const through = s?.counties
      .map((c) => manifest?.counties[c]?.to)
      .filter((t): t is string => Boolean(t))
      .sort()
      .pop();
    if (!s || !figures || !figures.count) {
      return (
        <span key={r.slug} className="t-small text-graphite-500">
          {PLACE_SALES_COPY.compareNone}
        </span>
      );
    }
    return (
      <span key={r.slug} className="compare-cell">
        <span className="t-small text-body">
          {PLACE_SALES_COPY.compareCell(int.format(figures.count), figures.medianResalePrice ? usd.format(figures.medianResalePrice) : null, figures.medianPricePerSqft ? usd.format(figures.medianPricePerSqft) : null)}
        </span>
        <Link href={`/sell/sold?${new URLSearchParams({ place: r.slug })}` as Route} className="t-note">
          {own ? PLACE_SALES_COPY.compareOwn : PLACE_SALES_COPY.compareZip(s.place.zips.join(", "))}
          {through ? ` · through ${fmtDate(through)}` : ""}
        </Link>
      </span>
    );
  });
  const extra = [
    ...(manifest ? [{ id: "sales", label: PLACE_SALES_COPY.compareLabel(manifest.windowMonths), cells: salesCells }] : []),
    { id: "encore", label: "Encore · this month", cells: encoreCells },
  ];

  const names = found.map((p) => p.record.name);
  const market = markets.length === 1 ? markets[0] : undefined;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <CompareGoal count={found.length} />
      <section className="container-site flex flex-col gap-8 py-section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="t-display text-navy">Compare</h1>
            <p className="t-body max-w-measure text-body">
              {found.length === 2 ? "Two" : found.length === 3 ? "Three" : "Four"} saved places, side by side. Every fact carries its source and the day we checked it.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <CompareShare slugs={found.map((p) => p.record.slug)} />
            <Link href={"/neighborhoods" as Route} className="link-rule">
              Back to the map
            </Link>
          </div>
        </div>

        <p className="t-mono-sm text-graphite-500 lg:hidden" aria-hidden="true">
          Swipe sideways for {names.slice(1).join(" and ")}.
        </p>
        <CompareTable places={found} rows={rows} extra={extra} />
        <p className="t-note">
          “Not known yet” means the record has no checked source for it. Catalog as of {asOf}. The sales row is the county’s public record, not MLS data. Nothing here is a rating or a description of who lives where.
        </p>

        <CompareAsk names={names} slugs={found.map((p) => p.record.slug)} market={market} />
      </section>
    </>
  );
}

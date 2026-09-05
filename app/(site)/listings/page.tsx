import type { Metadata, Route } from "next";
import Link from "next/link";
import { RuleLink } from "@/components/buttons";
import { EqualHousingMark } from "@/components/equal-housing";
import { FilterChips, type Chip } from "@/components/filter-chips";
import { LeadForm } from "@/components/lead-form";
import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import { getActiveListingCount, getListings, getSiteSettings } from "@/lib/content";
import {
  FEATURE_OPTIONS,
  PRICE_OPTIONS,
  filtersToSearchParams,
  parseListingFilters,
} from "@/lib/content/filters";
import { formatDateRecord, formatPriceShort } from "@/lib/content/format";
import { MARKETS, marketName } from "@/lib/content/markets";
import type { ListingFilters, SiteSettings } from "@/lib/content/types";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Every listing between Tampa and Venice",
  description:
    "Every active, pending and sold home across Lakewood Ranch, Sarasota, Bradenton and Tampa, with the days on market on every card and the flood zone on every page. Filter by market, price, beds, baths, status and feature.",
  path: "/listings",
});

const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

const STATUS_LABEL: Record<NonNullable<ListingFilters["status"]>, string> = {
  active: "Active",
  pending: "Under contract",
  sold: "Sold",
  all: "Active, under contract and sold",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** /listings?… for a filter set and page, dropping anything that is default. */
function hrefFor(f: ListingFilters, page?: number): Route {
  const sp = filtersToSearchParams(f);
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return (qs ? `/listings?${qs}` : "/listings") as Route;
}

/** One chip per active filter; each link is the same search with that filter removed. */
function activeChips(f: ListingFilters): Chip[] {
  const chips: Chip[] = [];
  const without = (patch: Partial<ListingFilters>) => hrefFor({ ...f, ...patch });
  if (f.market) chips.push({ label: marketName(f.market), href: without({ market: undefined }), remove: true });
  if (f.minPrice) chips.push({ label: `From ${formatPriceShort(f.minPrice)}`, href: without({ minPrice: undefined }), remove: true });
  if (f.maxPrice) chips.push({ label: `To ${formatPriceShort(f.maxPrice)}`, href: without({ maxPrice: undefined }), remove: true });
  if (f.beds) chips.push({ label: `${f.beds}+ beds`, href: without({ beds: undefined }), remove: true });
  if (f.baths) chips.push({ label: `${f.baths}+ baths`, href: without({ baths: undefined }), remove: true });
  if (f.status && f.status !== "active") chips.push({ label: STATUS_LABEL[f.status], href: without({ status: undefined }), remove: true });
  if (f.feature) {
    const label = FEATURE_OPTIONS.find((o) => o.value === f.feature)?.label ?? f.feature;
    chips.push({ label, href: without({ feature: undefined }), remove: true });
  }
  if (f.q) chips.push({ label: `“${f.q}”`, href: without({ q: undefined }), remove: true });
  return chips;
}

function Select({
  id,
  name,
  label,
  defaultValue,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="field-input">
        {children}
      </select>
    </div>
  );
}

/** The MLS attribution and the Equal Housing line, as a band on every listing page. */
function ComplianceStrip({ settings }: { settings: SiteSettings }) {
  return (
    <div className="flex flex-col gap-3 border-y border-hairline py-4 md:flex-row md:items-center md:justify-between md:gap-10">
      <p className="t-mono-sm max-w-[820px] text-graphite-500">{settings.mlsAttribution}</p>
      <p className="t-mono-sm flex shrink-0 items-center gap-2 text-graphite-500">
        <span aria-hidden="true">
          <EqualHousingMark />
        </span>
        Equal Housing Opportunity · {settings.brokerageName}
      </p>
    </div>
  );
}

/**
 * The search. A GET form, so every result set is a URL that can be sent to
 * the other agent, and nothing here needs JavaScript to work.
 */
export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseListingFilters(params);
  const [results, settings, activeCount] = await Promise.all([
    getListings(filters),
    getSiteSettings(),
    getActiveListingCount(),
  ]);

  const total = results.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number.parseInt(one(params.page) ?? "1", 10);
  const page = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), pageCount) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const shown = results.slice(start, start + PAGE_SIZE);
  const updated = formatDateRecord(new Date());
  const chips = activeChips(filters);
  const marketCount =
    total === 0 && filters.market ? (await getListings({ market: filters.market })).length : undefined;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const pageLink =
    "t-record flex h-11 min-w-11 items-center justify-center border border-rule px-3 text-navy transition-colors hover:border-navy";

  return (
    <>
      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="listings-title">
        <div className="flex flex-col gap-7">
          <SectionHeading
            as="h1"
            size="display"
            eyebrow="Search"
            title={
              <span id="listings-title">Every listing between Tampa and Venice.</span>
            }
            titleClassName="max-w-[760px]"
            aside={
              <p className="t-record uppercase text-graphite-600">
                {activeCount} active · {MARKETS.length} markets · updated {updated}
              </p>
            }
          />
          <p className="t-body max-w-measure text-body">
            Lakewood Ranch, Sarasota, Bradenton and Tampa, from the Skyway to the Venice jetty. Days on
            market on every card, the flood zone on every page. Start with the street; the square footage
            can wait.
          </p>
        </div>

        <form action="/listings" method="get" aria-label="Filter listings" className="border border-hairline bg-white p-6 md:p-8">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <Select id="f-market" name="market" label="Where" defaultValue={filters.market ?? ""}>
              <option value="">Anywhere on the coast</option>
              {MARKETS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}, FL
                </option>
              ))}
            </Select>
            <Select id="f-min" name="min" label="Min price" defaultValue={filters.minPrice ? String(filters.minPrice) : ""}>
              <option value="">No minimum</option>
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select id="f-max" name="max" label="Max price" defaultValue={filters.maxPrice ? String(filters.maxPrice) : ""}>
              <option value="">No maximum</option>
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
            <Select id="f-beds" name="beds" label="Beds" defaultValue={filters.beds ? String(filters.beds) : ""}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </Select>
            <Select id="f-baths" name="baths" label="Baths" defaultValue={filters.baths ? String(filters.baths) : ""}>
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </Select>
            <Select id="f-status" name="status" label="Status" defaultValue={filters.status && filters.status !== "active" ? filters.status : ""}>
              <option value="">Active</option>
              <option value="pending">Under contract</option>
              <option value="sold">Sold</option>
              <option value="all">All</option>
            </Select>
            <Select id="f-feature" name="feature" label="Feature" defaultValue={filters.feature ?? ""}>
              <option value="">Any</option>
              {FEATURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
            <div className="flex items-end">
              <button type="submit" className="btn btn-navy w-full sm:w-auto">
                Search
                <span className="btn-dash" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>

        {chips.length ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="t-mono-sm text-graphite-500">Filtered by</p>
            <FilterChips label="Active filters" chips={chips} />
            <RuleLink href="/listings">Clear all</RuleLink>
          </div>
        ) : null}
      </section>

      <section className="container-site flex flex-col gap-8 pb-section" aria-label="Results">
        <div className="flex flex-col gap-2 border-y border-hairline py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-record uppercase text-graphite-600" aria-live="polite">
            {total} {total === 1 ? "home" : "homes"} · updated {updated}
          </p>
          <p className="t-record uppercase text-graphite-500">
            {total
              ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} · page ${page} of ${pageCount}`
              : "Stellar MLS · Lakewood Ranch · Sarasota · Bradenton · Tampa"}
          </p>
        </div>

        {shown.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((l, i) => (
              <li key={l.slug} className="flex">
                <ListingCard listing={l} className="w-full" priority={i < 3} as="h2" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-10 border border-hairline bg-white p-8 md:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="flex flex-col gap-5">
              <p className="t-eyebrow text-amber">No matches</p>
              <h2 className="t-h1 text-navy">Nothing on that street right now.</h2>
              <p className="t-body max-w-measure text-body">
                {filters.market && marketCount
                  ? `${marketName(filters.market)} has ${marketCount} active ${marketCount === 1 ? "home" : "homes"} at the moment, none of them inside these filters. Loosen one, usually the price, or tell us what you are looking for.`
                  : "The median listing between Tampa and Venice went under contract in 23 days last quarter (Stellar MLS, Q2 2026), so a search that comes up empty on a Friday is often full by the next one."}
              </p>
              <p className="t-body max-w-measure text-body">
                Tell us the street and the number. We usually know what is about to list a week or two
                before it does, and we will call you first.
              </p>
              <div>
                <RuleLink href="/listings">Clear the filters</RuleLink>
              </div>
            </div>
            <LeadForm
              form="buy"
              fields={["name", "email", "phone", "message"]}
              submitLabel="Tell us the street"
              placeholderMessage="The street, the number, and when you need to be in."
            />
          </div>
        )}

        {pageCount > 1 ? (
          <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 border-t border-hairline pt-6">
            {page > 1 ? (
              <Link href={hrefFor(filters, page - 1)} className={pageLink}>
                <span aria-hidden="true">←</span>
                <span className="sr-only">Previous page</span>
              </Link>
            ) : null}
            {pages.map((n) => (
              <Link
                key={n}
                href={hrefFor(filters, n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(pageLink, n === page && "border-navy bg-navy text-linen-200 hover:border-navy")}
              >
                {String(n).padStart(2, "0")}
              </Link>
            ))}
            {page < pageCount ? (
              <Link href={hrefFor(filters, page + 1)} className={pageLink}>
                <span aria-hidden="true">→</span>
                <span className="sr-only">Next page</span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        <ComplianceStrip settings={settings} />
      </section>
    </>
  );
}

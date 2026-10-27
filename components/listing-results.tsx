"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { PRICE_OPTIONS, filterListings } from "@/lib/content/filters";
import { MARKETS } from "@/lib/content/markets";
import type { Listing, MarketSlug } from "@/lib/content/types";
import { listingCountLine, listingSearchHref, parseListingSearch, type ListingSearch } from "@/lib/listings-url";
import { replaceQuery, useUrlInitial } from "@/lib/url-state";

/**
 * The team's own listings on /listings, held to the place and the price the
 * home page's search sent (`?market=&max=`). The page is static: the server
 * renders every active listing, and the browser applies the address once,
 * after hydration (lib/url-state.ts). The two controls are the home page's
 * own, so the search continues here; a change replaces the address, never
 * adds an entry. When nothing fits, the form below is the next step.
 */
export function ListingResults({ listings }: { listings: Listing[] }) {
  const { initial, key } = useUrlInitial<ListingSearch>(parseListingSearch, {});
  return <Results key={key} listings={listings} initial={initial} />;
}

function Results({ listings, initial }: { listings: Listing[]; initial: ListingSearch }) {
  const [search, setSearch] = useState<ListingSearch>(initial);
  const shown = useMemo(() => filterListings(listings, { status: "active", market: search.market, maxPrice: search.max }), [listings, search]);

  const update = (next: ListingSearch) => {
    setSearch(next);
    replaceQuery(listingSearchHref(next));
  };

  return (
    <div className="flex flex-col gap-8" data-url-island>
      <form className="grid gap-5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:max-w-[560px]" onSubmit={(e) => e.preventDefault()} aria-label="Narrow the listings">
        <div className="field min-w-0">
          <label htmlFor="listings-market" className="field-label">
            Where
          </label>
          <select
            id="listings-market"
            name="market"
            value={search.market ?? ""}
            onChange={(e) => update({ ...search, market: (e.target.value || undefined) as MarketSlug | undefined })}
            className="field-input"
          >
            <option value="">Anywhere on the coast</option>
            {MARKETS.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}, FL
              </option>
            ))}
          </select>
        </div>
        <div className="field min-w-0">
          <label htmlFor="listings-max" className="field-label">
            Up to
          </label>
          <select
            id="listings-max"
            name="max"
            value={search.max ? String(search.max) : ""}
            onChange={(e) => update({ ...search, max: e.target.value ? Number(e.target.value) : undefined })}
            className="field-input"
          >
            <option value="">No limit</option>
            {PRICE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      <p className="t-note" aria-live="polite">
        {listingCountLine(shown.length, search)}
      </p>

      {shown.length ? (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((l, i) => (
            <li key={l.slug} className="flex">
              <ListingCard listing={l} className="w-full" priority={i < 3} as="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex max-w-measure flex-col gap-3 border border-hairline bg-white p-6 sm:p-8">
          <p className="t-h3 text-navy">Nothing of ours fits that yet.</p>
          <p className="t-body text-body">Widen the place or the price, or tell us below what you&rsquo;re after and we&rsquo;ll do the looking.</p>
        </div>
      )}
    </div>
  );
}

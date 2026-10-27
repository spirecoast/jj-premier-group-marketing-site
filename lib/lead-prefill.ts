import { PRICE_OPTIONS } from "@/lib/content/filters";
import { formatPriceShort } from "@/lib/content/format";
import { isMarketSlug, marketName } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";

/**
 * What a link hands a lead form: /contact?place=…&message=…&market=… from
 * the Atlas and neighborhood pages, /listings?market=…&max=… from the home
 * page's search. The pages are static, so the browser reads these once
 * (components/url-lead-form.tsx) and puts them in the form.
 */

export type Prefill = { message?: string; placeholder?: string; market?: MarketSlug };

type Params = URLSearchParams;

function text(v: string | null): string | undefined {
  const s = v?.trim();
  return s ? s.slice(0, 1000) : undefined;
}

export function contactPrefill(p: Params): Prefill {
  const place = text(p.get("place"));
  const market = p.get("market") ?? undefined;
  return {
    message: text(p.get("message")) ?? (place ? `Asking about ${place}.` : undefined),
    market: isMarketSlug(market) ? market : undefined,
  };
}

/** The opening of the note on /listings, with or without a place and a budget. */
export function listingsOpening(market: MarketSlug | undefined, maxLabel: string | undefined): string {
  return [market ? `Looking in ${marketName(market)}` : "Looking on the coast", maxLabel ? `up to ${maxLabel}` : undefined].filter(Boolean).join(", ");
}

export function listingsPlaceholder(opening: string): string {
  return `${opening}. Two or three bedrooms, near the water if we can, and we’d like to be in by spring.`;
}

export function listingsPrefill(p: Params): Prefill {
  const marketRaw = p.get("market") ?? undefined;
  const market = isMarketSlug(marketRaw) ? marketRaw : undefined;
  const maxRaw = Number(p.get("max"));
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : undefined;
  const maxLabel = max ? (PRICE_OPTIONS.find((o) => Number(o.value) === max)?.label ?? formatPriceShort(max)) : undefined;
  const opening = listingsOpening(market, maxLabel);
  return {
    market,
    placeholder: listingsPlaceholder(opening),
    message: market || maxLabel ? `${opening}. ` : undefined,
  };
}

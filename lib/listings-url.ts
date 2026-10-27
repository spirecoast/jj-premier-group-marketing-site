import { PRICE_OPTIONS } from "@/lib/content/filters";
import { isMarketSlug, marketName } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";

/**
 * The home page's search and the results on /listings share one address:
 * `?market=<slug>&max=<price>`. Both are optional; anything else is ignored.
 * The same two keys fill the note on the form (lib/lead-prefill.ts), so a
 * visitor who finds nothing in the grid sends the search they just made.
 */
export type ListingSearch = { market?: MarketSlug; max?: number };

export const MAX_VALUES = new Set<number>(PRICE_OPTIONS.map((o) => Number(o.value)));

/** The search a link carries, or null when it carries neither key. */
export function parseListingSearch(sp: URLSearchParams): ListingSearch | null {
  const marketRaw = sp.get("market") ?? undefined;
  const maxRaw = Number(sp.get("max"));
  const market = isMarketSlug(marketRaw) ? marketRaw : undefined;
  const max = MAX_VALUES.has(maxRaw) ? maxRaw : undefined;
  if (!market && !max) return null;
  return { ...(market ? { market } : {}), ...(max ? { max } : {}) };
}

export function listingSearchHref(s: ListingSearch): string {
  const sp = new URLSearchParams();
  if (s.market) sp.set("market", s.market);
  if (s.max) sp.set("max", String(s.max));
  const q = sp.toString();
  return q ? `/listings?${q}` : "/listings";
}

/** "3 homes in Sarasota up to $1M", for the line over the grid. */
export function listingCountLine(n: number, s: ListingSearch): string {
  const homes = n === 1 ? "1 home" : `${n} homes`;
  const where = s.market ? ` in ${marketName(s.market)}` : "";
  const max = s.max ? ` up to ${PRICE_OPTIONS.find((o) => Number(o.value) === s.max)?.label ?? ""}`.replace(/ $/, "") : "";
  return `${homes}${where}${max}`;
}

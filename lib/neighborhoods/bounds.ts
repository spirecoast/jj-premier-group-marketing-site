import type { MarketSlug } from "@/lib/content/types";
import type { IndexEntry } from "./index-format";
import { search } from "./search";

/** [west, south, east, north] in degrees. */
export type Bounds = [west: number, south: number, east: number, north: number];

/** The box around every entry that has a point, or null when none does. */
export function boundsOf(entries: IndexEntry[]): Bounds | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const p of entries) {
    if (p.x === null || p.y === null) continue;
    if (p.x < w) w = p.x;
    if (p.x > e) e = p.x;
    if (p.y < s) s = p.y;
    if (p.y > n) n = p.y;
  }
  return Number.isFinite(w) ? [w, s, e, n] : null;
}

/** The explorer's opening views, computed once from the catalog: everything, and each market on its own. */
export type DefaultBounds = { all: Bounds | null; byMarket: Partial<Record<MarketSlug, Bounds>> };

/**
 * What the map should show before anyone touches it, for the plain page and
 * for a ?market= link. The server works this out from the index so the map
 * can start on its final view (one zoom level of tiles, no flight) instead of
 * zooming out through three after the index arrives in the browser.
 */
export function defaultBounds(entries: IndexEntry[], markets: readonly MarketSlug[]): DefaultBounds {
  const browse = (market?: MarketSlug) => boundsOf(search(entries, "", { market, registry: true }));
  const byMarket: Partial<Record<MarketSlug, Bounds>> = {};
  for (const m of markets) {
    const b = browse(m);
    if (b) byMarket[m] = b;
  }
  return { all: browse(), byMarket };
}

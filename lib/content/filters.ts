import type { Listing, ListingFilters, MarketSlug } from "./types";
import { isMarketSlug } from "./markets";

const PRICE_STEPS = [
  500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
] as const;

export const PRICE_OPTIONS = PRICE_STEPS.map((v) => ({
  value: v,
  label: v >= 1_000_000 ? `$${(v / 1_000_000).toString().replace(/\.0$/, "")}M` : `$${v / 1_000}K`,
}));

const FEATURE_MATCHERS: Record<string, (l: Listing) => boolean> = {
  waterfront: (l) =>
    /water|lake|canal|bay|gulf|beach|dock|seawall/i.test(
      [l.cardNote, ...l.features].filter(Boolean).join(" "),
    ),
  "new-construction": (l) => (l.yearBuilt ?? 0) >= new Date().getFullYear() - 2,
  pool: (l) => /pool/i.test([l.cardNote, ...l.features].filter(Boolean).join(" ")),
  condo: (l) => /unit|tower|#/i.test(l.address.street) || /condo|tower/i.test(l.title),
};

export const FEATURE_OPTIONS = [
  { value: "waterfront", label: "Waterfront" },
  { value: "pool", label: "Pool" },
  { value: "new-construction", label: "New construction" },
  { value: "condo", label: "Condominium" },
] as const;

const toInt = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Parse URL search params into a ListingFilters object, ignoring junk. */
export function parseListingFilters(
  params: Record<string, string | string[] | undefined>,
): ListingFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const status = one("status");
  const market = one("market") ?? one("where");
  return {
    market: isMarketSlug(market) ? (market as MarketSlug) : undefined,
    minPrice: toInt(one("min")),
    maxPrice: toInt(one("max")),
    beds: toInt(one("beds")),
    baths: toInt(one("baths")),
    status:
      status === "active" || status === "pending" || status === "sold" || status === "all"
        ? status
        : undefined,
    feature: one("feature") && one("feature")! in FEATURE_MATCHERS ? one("feature") : undefined,
    q: one("q")?.trim() || undefined,
  };
}

export function filterListings(listings: Listing[], f: ListingFilters = {}): Listing[] {
  const status = f.status ?? "active";
  return listings.filter((l) => {
    if (status !== "all") {
      if (status === "active" && l.status === "sold") return false;
      if (status === "pending" && l.status !== "pending") return false;
      if (status === "sold" && l.status !== "sold") return false;
    }
    if (f.market && l.market !== f.market) return false;
    if (f.minPrice && l.price < f.minPrice) return false;
    if (f.maxPrice && l.price > f.maxPrice) return false;
    if (f.beds && l.beds < f.beds) return false;
    if (f.baths && l.baths < f.baths) return false;
    if (f.feature && !FEATURE_MATCHERS[f.feature]?.(l)) return false;
    if (f.q) {
      const hay = [
        l.title,
        l.address.street,
        l.address.city,
        l.address.zip,
        l.neighborhood?.name,
        l.mlsNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(f.q.toLowerCase())) return false;
    }
    return true;
  });
}

/** Active first (newest listed), then pending, then sold (most recent sale). */
export function sortListings(listings: Listing[]): Listing[] {
  const rank: Record<string, number> = { active: 0, pending: 1, sold: 2 };
  return [...listings].sort((a, b) => {
    const r = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    if (r !== 0) return r;
    if (a.status === "sold" && b.status === "sold") {
      return (b.soldDate ?? "").localeCompare(a.soldDate ?? "");
    }
    return (b.listedAt ?? "").localeCompare(a.listedAt ?? "");
  });
}

/** Build a query string from filters, dropping empties. */
export function filtersToSearchParams(f: ListingFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.market) sp.set("market", f.market);
  if (f.minPrice) sp.set("min", String(f.minPrice));
  if (f.maxPrice) sp.set("max", String(f.maxPrice));
  if (f.beds) sp.set("beds", String(f.beds));
  if (f.baths) sp.set("baths", String(f.baths));
  if (f.status && f.status !== "active") sp.set("status", f.status);
  if (f.feature) sp.set("feature", f.feature);
  if (f.q) sp.set("q", f.q);
  return sp;
}

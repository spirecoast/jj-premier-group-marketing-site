import type { Route } from "next";
import { isMarketSlug } from "@/lib/content/markets";
import type { Filters } from "./search";
import { LEVELS, STATUSES, TYPES, type NeighborhoodLevel, type NeighborhoodStatus, type NeighborhoodType } from "./types";

/**
 * Every explorer view is a URL: the query, the filters, the selected place and
 * the map position. `map` is zoom/lat/lng, the way map sites have written it
 * for twenty years, so a pasted link lands on the same view.
 */
export type MapView = { zoom: number; lat: number; lng: number };

export type ExplorerState = {
  q: string;
  filters: Filters;
  place: string | null;
  map: MapView | null;
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const one = (p: Params, k: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};

const inList = <T extends string>(list: readonly T[], v: string | undefined): T | undefined =>
  v && (list as readonly string[]).includes(v) ? (v as T) : undefined;

export function parseState(p: Params): ExplorerState {
  const mapRaw = one(p, "map")?.match(/^(\d{1,2}(?:\.\d+)?)\/(-?\d{1,2}(?:\.\d+)?)\/(-?\d{1,3}(?:\.\d+)?)$/);
  const map = mapRaw ? { zoom: Number(mapRaw[1]), lat: Number(mapRaw[2]), lng: Number(mapRaw[3]) } : null;
  const marketRaw = one(p, "market");
  const placeRaw = one(p, "place");
  return {
    q: (one(p, "q") ?? "").slice(0, 80),
    filters: {
      market: isMarketSlug(marketRaw) ? marketRaw : undefined,
      level: inList<NeighborhoodLevel>(LEVELS, one(p, "level")),
      type: inList<NeighborhoodType>(TYPES, one(p, "type")),
      status: inList<NeighborhoodStatus>(STATUSES, one(p, "status")),
      gated: one(p, "gated") === "1" || undefined,
      registry: one(p, "all") === "1" || undefined,
    },
    place: placeRaw && /^[a-z0-9-]{1,120}$/.test(placeRaw) ? placeRaw : null,
    map: map && map.zoom >= 3 && map.zoom <= 20 && Math.abs(map.lat) <= 90 && Math.abs(map.lng) <= 180 ? map : null,
  };
}

export function stateToSearch(s: ExplorerState): string {
  const sp = new URLSearchParams();
  if (s.q) sp.set("q", s.q);
  if (s.filters.market) sp.set("market", s.filters.market);
  if (s.filters.level) sp.set("level", s.filters.level);
  if (s.filters.type) sp.set("type", s.filters.type);
  if (s.filters.status) sp.set("status", s.filters.status);
  if (s.filters.gated) sp.set("gated", "1");
  if (s.filters.registry) sp.set("all", "1");
  if (s.place) sp.set("place", s.place);
  if (s.map) sp.set("map", `${s.map.zoom.toFixed(2)}/${s.map.lat.toFixed(5)}/${s.map.lng.toFixed(5)}`);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function explorerHref(s: Partial<ExplorerState>): Route {
  return `/neighborhoods${stateToSearch({ q: "", filters: {}, place: null, map: null, ...s })}` as Route;
}

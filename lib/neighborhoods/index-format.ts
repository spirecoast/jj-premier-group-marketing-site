import type { MarketSlug } from "@/lib/content/types";
import type { EvacuationZone, NeighborhoodLevel, NeighborhoodRecord, NeighborhoodSearchEntry, NeighborhoodStatus, NeighborhoodType, WaterAccess } from "./types";

/**
 * The slim row the browser receives: the search index with short keys and
 * without the ancestor names (the client rebuilds them from parent links).
 * About 90KB gzipped for the whole dataset.
 */
export type IndexEntry = {
  s: string; // slug
  n: string; // name
  a: string[]; // aliases
  l: NeighborhoodLevel;
  p: string | null; // parent slug
  m: MarketSlug;
  c: string | null; // county
  j: string | null; // jurisdiction
  z: string[]; // zips
  t: NeighborhoodType | null;
  st: NeighborhoodStatus | null;
  h: string[]; // home types
  b: string[]; // active builders
  g: boolean | null; // gated
  y: number | null; // lat
  x: number | null; // lng
  r: 0 | 1; // 1 = researched in full, 0 = registry-only
  ba: 0 | 1; // Palmetto / Ellenton / Parrish group
  q: string; // normalized search text
  /** Atlas match reads these four; the search index file does not carry them, so the server fills them from the full record. */
  w: WaterAccess | null; // water access
  ho: 1 | null; // 1 = an association is on record; null = not known
  cd: 1 | null; // 1 = a community development district is on record; null = not known
  ev: EvacuationZone | null; // evacuation zone / level
};

/** The record fields the search index leaves out but the match needs. */
export type IndexExtra = Pick<NeighborhoodRecord, "waterAccess" | "hoa" | "cdd" | "evacuationZone">;

export function toIndexEntry(e: NeighborhoodSearchEntry, x?: IndexExtra): IndexEntry {
  return {
    s: e.slug,
    n: e.name,
    a: e.aliases,
    l: e.level,
    p: e.parentSlug,
    m: e.market,
    c: e.county,
    j: e.jurisdiction,
    z: e.zips,
    t: e.type,
    st: e.status,
    h: e.homeTypes,
    b: e.activeBuilders,
    g: e.gated,
    y: e.lat,
    x: e.lng,
    r: e.research === "full" ? 1 : 0,
    ba: e.bradentonArea ? 1 : 0,
    q: e.q,
    w: x?.waterAccess ?? null,
    ho: x?.hoa?.name ? 1 : null,
    cd: x?.cdd ? 1 : null,
    ev: x?.evacuationZone ?? null,
  };
}

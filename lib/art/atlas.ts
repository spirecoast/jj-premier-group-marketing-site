import type { MarketSlug } from "../content/types";
import type { NeighborhoodLevel } from "../neighborhoods/types";
import { ART } from "./palette";
import { dot, mark } from "./svg";

/**
 * Atlas's portrait: every place in the index as a point of light, on the
 * deep ground, like a star chart of the coast. Areas are the bright stars,
 * communities the field, enclaves the faint ones; each market has its own
 * light. Threads join the areas to their nearest areas (the constellation
 * figures) and each community to its nearest neighbour (the faint web), so
 * the coast reads as one drawing rather than a scatter.
 *
 * Pure: the places' coordinates come in (the index entries' lat and lng),
 * the paths go out. components/art/atlas-art.tsx draws it.
 */

export type Place = { lng: number; lat: number; level: NeighborhoodLevel; market: MarketSlug };

export const MARKET_LIGHT: Record<MarketSlug, string> = {
  "lakewood-ranch": ART.mango,
  sarasota: ART.sky,
  bradenton: ART.jade,
};

/** Dot radii at a 600px-wide drawing; scaled with the width. */
export const LEVEL_RADIUS: Record<NeighborhoodLevel, number> = { area: 2.6, community: 1.25, enclave: 0.85 };
export const LEVEL_OPACITY: Record<NeighborhoodLevel, number> = { area: 1, community: 0.85, enclave: 0.62 };

const LEVELS: NeighborhoodLevel[] = ["area", "community", "enclave"];
const MARKETS: MarketSlug[] = ["bradenton", "sarasota", "lakewood-ranch"];

export type StarChartOptions = {
  width: number;
  height: number;
  /** How far the places' vertical span overflows the frame: 1 shows all of it, 1.2 crops a tenth top and bottom. */
  zoom?: number;
  /** Nudges the frame's centre, as fractions of the width and height (positive moves the places right and down). */
  shift?: [number, number];
  /** Constellation figures: each area joined to this many nearest areas, within this many px. */
  figures?: { k: number; within: number };
  /** The faint web: each community or enclave joined to its nearest neighbour within this many px. */
  web?: { within: number };
};

export type DotGroup = {
  market: MarketSlug;
  level: NeighborhoodLevel;
  color: string;
  radius: number;
  opacity: number;
  count: number;
  d: string;
};

export type StarChart = {
  width: number;
  height: number;
  /** One path per market and level, faint levels first so the bright stars draw on top. */
  dots: DotGroup[];
  /** The soft halo behind each market's areas. */
  halos: { market: MarketSlug; color: string; radius: number; d: string }[];
  figures: { d: string; count: number };
  web: { d: string; count: number };
  /** How many places are in the frame. */
  shown: number;
};

type Projected = { x: number; y: number; level: NeighborhoodLevel; market: MarketSlug };

/** Equirectangular about the places' middle latitude, fitted to the frame's height. */
export function project(places: readonly Place[], o: StarChartOptions): Projected[] {
  if (!places.length) return [];
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  for (const p of places) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanY = Math.max(1e-9, maxLat - minLat);
  const scale = ((o.zoom ?? 1) * o.height) / spanY;
  const cx = ((minLng + maxLng) / 2) * cos;
  const cy = -(minLat + maxLat) / 2;
  const [sx, sy] = o.shift ?? [0, 0];
  return places.map((p) => ({
    x: o.width / 2 + (p.lng * cos - cx) * scale + sx * o.width,
    y: o.height / 2 + (-p.lat - cy) * scale + sy * o.height,
    level: p.level,
    market: p.market,
  }));
}

/** The indexes of the `k` nearest other points to `i` within `within` px, nearest first. */
function nearest(pts: readonly Projected[], i: number, k: number, within: number, among?: readonly number[]): number[] {
  const a = pts[i]!;
  const found: { j: number; d: number }[] = [];
  const w2 = within * within;
  const candidates = among ?? pts.map((_, j) => j);
  for (const j of candidates) {
    if (j === i) continue;
    const b = pts[j]!;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = dx * dx + dy * dy;
    if (d > w2) continue;
    if (found.length < k) {
      found.push({ j, d });
      found.sort((p, q) => p.d - q.d);
    } else if (d < found[k - 1]!.d) {
      found[k - 1] = { j, d };
      found.sort((p, q) => p.d - q.d);
    }
  }
  return found.map((f) => f.j);
}

export function starChart(places: readonly Place[], o: StarChartOptions): StarChart {
  const W = o.width;
  const H = o.height;
  const k = W / 600;
  const margin = 4 * k;
  const pts = project(places, o).filter((p) => p.x >= -margin && p.x <= W + margin && p.y >= -margin && p.y <= H + margin);

  const dots: DotGroup[] = [];
  for (const level of [...LEVELS].reverse()) {
    for (const market of MARKETS) {
      const mine = pts.filter((p) => p.level === level && p.market === market);
      if (!mine.length) continue;
      dots.push({
        market,
        level,
        color: MARKET_LIGHT[market],
        radius: LEVEL_RADIUS[level] * k,
        opacity: LEVEL_OPACITY[level],
        count: mine.length,
        d: mine.map((p) => dot(p.x, p.y)).join(""),
      });
    }
  }
  const halos = MARKETS.flatMap((market) => {
    const areas = pts.filter((p) => p.level === "area" && p.market === market);
    return areas.length ? [{ market, color: MARKET_LIGHT[market], radius: LEVEL_RADIUS.area * 3 * k, d: areas.map((p) => dot(p.x, p.y)).join("") }] : [];
  });

  const edges = new Set<string>();
  const edgeKey = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);
  const draw = (keys: Iterable<string>) => {
    let d = "";
    let count = 0;
    for (const key of keys) {
      const [i, j] = key.split("-").map(Number) as [number, number];
      const a = pts[i]!;
      const b = pts[j]!;
      d += mark(a.x, a.y, b.x, b.y);
      count += 1;
    }
    return { d, count };
  };

  const fig = o.figures ?? { k: 2, within: 70 * k };
  const areaIdx = pts.map((p, i) => (p.level === "area" ? i : -1)).filter((i) => i >= 0);
  for (const i of areaIdx) for (const j of nearest(pts, i, fig.k, fig.within, areaIdx)) edges.add(edgeKey(i, j));
  const figures = draw(edges);

  const webEdges = new Set<string>();
  const web = o.web ?? { within: 8 * k };
  pts.forEach((p, i) => {
    if (p.level === "area") return;
    for (const j of nearest(pts, i, 1, web.within)) {
      const key = edgeKey(i, j);
      if (!edges.has(key)) webEdges.add(key);
    }
  });

  return { width: W, height: H, dots, halos, figures, web: draw(webEdges), shown: pts.length };
}

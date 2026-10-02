import { starChart, type Place, type StarChartOptions } from "@/lib/art/atlas";
import { getIndexEntries } from "@/lib/neighborhoods/data";
import { StarField } from "./star-field";

/**
 * Atlas's portrait on the page: every place in the index as a point of
 * light (lib/art/atlas.ts), from the projected coordinates the index
 * entries already carry, computed on the server. The index itself stays
 * there; the drawing is what the browser gets. One 3:2 drawing, shown whole
 * in the 2:1 box where the cards stack (the ground simply widens).
 */
export const ATLAS_BOX: StarChartOptions = { width: 600, height: 400, zoom: 1.12, shift: [0.04, 0] };

export async function AtlasCard() {
  const entries = await getIndexEntries();
  const places = entries.flatMap((e): Place[] => (e.x === null || e.y === null ? [] : [{ lng: e.x, lat: e.y, level: e.l, market: e.m }]));
  return <StarField g={starChart(places, ATLAS_BOX)} className="card-img" />;
}

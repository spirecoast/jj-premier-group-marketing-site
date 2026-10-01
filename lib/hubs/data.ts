import "server-only";
import { getPosts } from "@/lib/content";
import type { MarketSlug, Post } from "@/lib/content/types";
import { getEncoreIndex, localDay } from "@/lib/encore/data";
import type { EncoreEvent } from "@/lib/encore/index-format";
import { addDays, occurrences, onView, type Occ } from "@/lib/encore/select";
import { getAllRecords } from "@/lib/neighborhoods/data";
import type { NeighborhoodRecord, NeighborhoodType } from "@/lib/neighborhoods/types";
import { HUBS } from "./copy";

/**
 * What a market hub reads at build time: the market's areas and the places
 * under them, counted honestly from the Atlas catalog; the next seven days on
 * the Encore index; and the Tide guides that belong to the place. Nothing here
 * is a rating, a price or a description of who lives where.
 */
export type HubArea = {
  slug: string;
  name: string;
  type: NeighborhoodType | null;
  county: string | null;
  /** Places under this area at any depth. */
  inside: number;
  /** Of those, researched in full (the rest are county-registry names, noindex). */
  researched: number;
};

export type HubAtlas = {
  areas: HubArea[];
  /** Every record in the market, areas included. */
  total: number;
  researched: number;
  /** Areas per county, most first. */
  counties: { name: string; areas: number }[];
  /** Records with a community development district on record. */
  cdd: number;
  /** Records with an evacuation zone checked, and how many of those sit outside every zone. */
  evacuation: { checked: number; outside: number };
  /** Mean of the areas' points, for Place JSON-LD. */
  centroid?: { lat: number; lng: number };
};

function topAreaOf(r: NeighborhoodRecord, by: Map<string, NeighborhoodRecord>): NeighborhoodRecord | undefined {
  let top: NeighborhoodRecord | undefined;
  let cur = r.parentSlug;
  let hops = 0;
  while (cur && by.has(cur) && hops++ < 6) {
    top = by.get(cur)!;
    cur = top.parentSlug;
  }
  return top;
}

export async function hubAtlas(market: MarketSlug): Promise<HubAtlas> {
  const all = await getAllRecords();
  const by = new Map(all.map((r) => [r.slug, r]));
  const mine = all.filter((r) => r.market === market);
  const areas = new Map<string, HubArea>();
  for (const r of mine) {
    if (r.level !== "area") continue;
    areas.set(r.slug, { slug: r.slug, name: r.name, type: r.type, county: r.county, inside: 0, researched: 0 });
  }
  for (const r of all) {
    if (r.level === "area") continue;
    const top = topAreaOf(r, by);
    const a = top ? areas.get(top.slug) : undefined;
    if (!a) continue;
    a.inside += 1;
    if (r.research === "full") a.researched += 1;
  }
  const countyCounts = new Map<string, number>();
  for (const a of areas.values()) {
    if (a.county) countyCounts.set(a.county, (countyCounts.get(a.county) ?? 0) + 1);
  }
  const pts = mine.filter((r) => r.level === "area" && r.lat !== null && r.lng !== null);
  const centroid = pts.length
    ? { lat: Number((pts.reduce((s, r) => s + r.lat!, 0) / pts.length).toFixed(4)), lng: Number((pts.reduce((s, r) => s + r.lng!, 0) / pts.length).toFixed(4)) }
    : undefined;
  const withZone = mine.filter((r) => r.evacuationZone !== null && r.evacuationZone !== undefined);
  return {
    areas: [...areas.values()].sort((a, b) => b.inside - a.inside || a.name.localeCompare(b.name)),
    total: mine.length,
    researched: mine.filter((r) => r.research === "full").length,
    counties: [...countyCounts.entries()].map(([name, n]) => ({ name, areas: n })).sort((a, b) => b.areas - a.areas),
    cdd: mine.filter((r) => r.cdd).length,
    evacuation: { checked: withZone.length, outside: withZone.filter((r) => r.evacuationZone === "none").length },
    centroid,
  };
}

export type HubEncoreItem = { kind: "perf"; o: Occ } | { kind: "run"; e: EncoreEvent };

/**
 * The next seven days in the market from the Encore index: up to six
 * performances, one per production, and if the week is thin, the exhibitions
 * on view to bring it to four.
 */
export function hubWeek(market: MarketSlug): { today: string; to: string; items: HubEncoreItem[]; performances: number } {
  const index = getEncoreIndex();
  const now = Date.now();
  const today = localDay(now);
  const to = addDays(today, 6);
  const occs = occurrences(index, today, to, { market }, now);
  const seen = new Set<string>();
  const items: HubEncoreItem[] = [];
  for (const o of occs) {
    if (seen.has(o.e.s)) continue;
    seen.add(o.e.s);
    items.push({ kind: "perf", o });
    if (items.length === 6) break;
  }
  if (items.length < 4) {
    for (const e of onView(index, today, { market })) {
      if (seen.has(e.s)) continue;
      seen.add(e.s);
      items.push({ kind: "run", e });
      if (items.length === 4) break;
    }
  }
  return { today, to, items, performances: occs.length };
}

/** The market's guides in the hub's order, topped up from the other guides so there are at least three. */
export async function hubGuides(market: MarketSlug): Promise<Post[]> {
  const posts = (await getPosts()).filter((p) => !p.categories.includes("Market report"));
  const wanted = HUBS[market].guides;
  const picked = wanted.map((slug) => posts.find((p) => p.slug === slug)).filter((p): p is Post => Boolean(p));
  for (const p of posts) {
    if (picked.length >= 3) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, 4);
}

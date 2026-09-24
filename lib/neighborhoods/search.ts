import type { MarketSlug } from "@/lib/content/types";
import type { IndexEntry } from "./index-format";
import type { NeighborhoodLevel, NeighborhoodStatus, NeighborhoodType } from "./types";

/** The same normalization scripts/build-search-index.mjs applies to `q`. */
export const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type Filters = {
  market?: MarketSlug;
  level?: NeighborhoodLevel;
  type?: NeighborhoodType;
  status?: NeighborhoodStatus;
  gated?: boolean;
  /** Include county-registry names that were not researched individually. */
  registry?: boolean;
};

const LEVEL_ORDER: Record<NeighborhoodLevel, number> = { area: 0, community: 1, enclave: 2 };

export function matchesFilters(e: IndexEntry, f: Filters): boolean {
  if (f.market && e.m !== f.market) return false;
  if (f.level && e.l !== f.level) return false;
  if (f.type && e.t !== f.type) return false;
  if (f.status && e.st !== f.status) return false;
  if (f.gated && e.g !== true) return false;
  return true;
}

/** Rank per the dataset handoff: exact, prefix, whole words, substring; then level, then research depth. */
function score(e: IndexEntry, q: string, tokens: string[]): number | null {
  const name = norm(e.n);
  if (name === q || e.a.some((a) => norm(a) === q)) return 0;
  if (name.startsWith(q) || e.a.some((a) => norm(a).startsWith(q))) return 1;
  const words = new Set(e.q.split(" "));
  if (tokens.every((t) => words.has(t))) return 2;
  if (e.q.includes(q)) return 3;
  if (tokens.every((t) => e.q.includes(t))) return 4;
  return null;
}

export function browseOrder(a: IndexEntry, b: IndexEntry): number {
  return LEVEL_ORDER[a.l] - LEVEL_ORDER[b.l] || b.r - a.r || a.n.localeCompare(b.n);
}

/**
 * Search and filter the index. With a query, registry-only records are
 * searchable; without one they stay out of the list unless `registry` is on.
 */
export function search(entries: IndexEntry[], query: string, f: Filters): IndexEntry[] {
  const q = norm(query);
  const tokens = q.split(" ").filter(Boolean);
  if (!tokens.length) {
    return entries.filter((e) => matchesFilters(e, f) && (f.registry || e.r === 1)).sort(browseOrder);
  }
  const scored: { e: IndexEntry; s: number }[] = [];
  for (const e of entries) {
    if (!matchesFilters(e, f)) continue;
    const s = score(e, q, tokens);
    if (s !== null) scored.push({ e, s });
  }
  return scored
    .sort((a, b) => a.s - b.s || LEVEL_ORDER[a.e.l] - LEVEL_ORDER[b.e.l] || b.e.r - a.e.r || a.e.n.localeCompare(b.e.n))
    .map((x) => x.e);
}

/** Ancestor names top-down, from parent links. */
export function pathOf(e: IndexEntry, by: Map<string, IndexEntry>): IndexEntry[] {
  const out: IndexEntry[] = [];
  let cur = e.p;
  while (cur && by.has(cur) && out.length < 4) {
    const p = by.get(cur)!;
    out.unshift(p);
    cur = p.p;
  }
  return out;
}

export function childrenOf(slug: string, entries: IndexEntry[]): IndexEntry[] {
  return entries.filter((e) => e.p === slug).sort(browseOrder);
}

/** Every descendant, for zooming to an area. */
export function descendantsOf(slug: string, entries: IndexEntry[]): IndexEntry[] {
  const out: IndexEntry[] = [];
  const queue = [slug];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of entries) {
      if (e.p === cur) {
        out.push(e);
        queue.push(e.s);
      }
    }
  }
  return out;
}

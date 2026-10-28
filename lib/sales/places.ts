import type { PlaceRow } from "./area";
import type { Sale } from "./types";

/**
 * Joining the county's sales to Atlas places by the names the counties
 * already publish: each sale carries its subdivision ("LAKE CLUB PH I") and
 * the appraiser's valuation neighborhood ("MALLORY PARK AT LAKEWOOD
 * RANCH"); an Atlas community or enclave whose name (or an alias) begins
 * one of those names, word for word, takes the sale. Pure, so
 * lib/sales/index.ts hands it the rows and the Atlas index and
 * lib/sales/places.test.ts hands it fixtures.
 *
 * The rules, so a sale never lands in the wrong place:
 * - A place named for a postal city (Bradenton, Palmetto, Lakewood Ranch)
 *   is left out: plats that open with a town's name are all over the town,
 *   and the town is read by its ZIPs instead. Other areas (Aurora, The Lake
 *   Club, Palmer Ranch) take the plats that carry their name.
 * - The longest matching name wins: "ARBOR LAKES ON PALMER RANCH" goes to
 *   Arbor Lakes on Palmer Ranch, not to Arbor Lakes.
 * - The place must list one of the name's ZIPs, when it lists any, so a
 *   "Country Meadows" in Bradenton never takes a Sarasota plat.
 * - A name two places answer to equally is left unassigned.
 * - A place's sales are its own and its descendants' (The Lake Club's
 *   enclaves roll up into it), each sale counted once.
 */

/** "The Lake Club" and "LAKE CLUB PH I" meet at "lake club": lower case, words only, no leading "the". */
export function normPlaceName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^the /, "")
    .trim();
}

export type PlaceNameIndex = Map<string, PlaceRow[]>;

/** Every place's name and aliases, normalized, four characters or more, without the postal cities' names (`skip`, normalized). */
export function placeNameIndex(places: PlaceRow[], skip: ReadonlySet<string> = new Set()): PlaceNameIndex {
  const out: PlaceNameIndex = new Map();
  for (const p of places) {
    if (skip.has(normPlaceName(p.name))) continue;
    for (const n of new Set([p.name, ...p.aliases].map(normPlaceName))) {
      if (n.length < 4 || skip.has(n)) continue;
      const list = out.get(n) ?? [];
      if (!list.some((x) => x.slug === p.slug)) list.push(p);
      out.set(n, list);
    }
  }
  return out;
}

/** The place a county name belongs to, by the rules above; null when none or more than one. */
export function assignPlace(name: string, zips: Iterable<string>, index: PlaceNameIndex): string | null {
  const words = normPlaceName(name).split(" ").filter(Boolean);
  const zipSet = new Set(zips);
  for (let i = words.length; i >= 1; i--) {
    const hits = index.get(words.slice(0, i).join(" "));
    if (!hits) continue;
    const fit = hits.filter((p) => !p.zips.length || p.zips.some((z) => zipSet.has(z)));
    if (!fit.length) continue;
    return fit.length === 1 ? fit[0]!.slug : null;
  }
  return null;
}

export type PlaceJoin = {
  /** Each place's own sales (not its descendants'), newest first as the rows came. */
  bySlug: Map<string, Sale[]>;
  /** Every slug's children, for the roll-up. */
  children: Map<string, string[]>;
  /** The place each joined row went to. */
  slugOf: Map<Sale, string>;
};

/** Assign every row to at most one place: by its subdivision, else by its appraiser neighborhood. `skip`: the postal cities' names. */
export function joinPlaces(rows: Sale[], places: PlaceRow[], skip: ReadonlySet<string> = new Set()): PlaceJoin {
  const index = placeNameIndex(places, skip);
  const zipsByName = new Map<string, Set<string>>();
  for (const r of rows) {
    for (const n of [r.subdivision, r.nbhd]) {
      if (!n) continue;
      const set = zipsByName.get(n) ?? new Set<string>();
      set.add(r.zip);
      zipsByName.set(n, set);
    }
  }
  const assigned = new Map<string, string | null>();
  for (const [n, zips] of zipsByName) assigned.set(n, assignPlace(n, zips, index));
  const bySlug = new Map<string, Sale[]>();
  const slugOf = new Map<Sale, string>();
  for (const r of rows) {
    const slug = (r.subdivision ? assigned.get(r.subdivision) : null) ?? (r.nbhd ? assigned.get(r.nbhd) : null) ?? null;
    if (!slug) continue;
    const list = bySlug.get(slug) ?? [];
    list.push(r);
    bySlug.set(slug, list);
    slugOf.set(r, slug);
  }
  const children = new Map<string, string[]>();
  for (const p of places) {
    if (!p.parentSlug) continue;
    children.set(p.parentSlug, [...(children.get(p.parentSlug) ?? []), p.slug]);
  }
  return { bySlug, children, slugOf };
}

/** A place's sales with its descendants', newest first, each once. */
export function placeSales(join: PlaceJoin, slug: string): Sale[] {
  const out = new Set<Sale>();
  const queue = [slug];
  const seen = new Set<string>();
  while (queue.length) {
    const s = queue.shift()!;
    if (seen.has(s)) continue;
    seen.add(s);
    for (const r of join.bySlug.get(s) ?? []) out.add(r);
    queue.push(...(join.children.get(s) ?? []));
  }
  return [...out].sort((a, b) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : 0));
}

/** Words that start the phase, unit or filing part of a plat name: "LORRAINE LAKES PH IIB-3 & …" is Lorraine Lakes. */
const PLAT_TAIL = new Set(["PH", "SP", "PHASE", "PHASES", "SUBPH", "SUBPHASE", "UNIT", "UNITS", "UN", "SEC", "SECT", "SECTION", "REPLAT", "REP", "ADD", "ADDITION", "NO", "BLK", "BLKS", "TRACT", "PARCEL", "PRCL", "---", "ET", "ONLY"]);
const SMALL = new Set(["AT", "OF", "ON", "THE", "AND", "IN", "BY", "A", "AN", "TO"]);
const ROMAN = /^(?=[IVXL])[IVXL]+[A-Z]?(-?\d+)?$/;

/** The county's name without its phase or unit, title-cased: "AZARIO ESPLANADE PH VI SUBPH A & B" → "Azario Esplanade". */
export function plainSubdivision(name: string): string {
  const words = (name || "").toUpperCase().replace(/[(),:/]+/g, " ").split(/\s+/).filter(Boolean);
  const cut = words.findIndex((w, i) => i > 0 && (PLAT_TAIL.has(w) || /^\d/.test(w)));
  const kept = cut === -1 ? words : words.slice(0, cut);
  return kept
    .map((w, i) => {
      if (ROMAN.test(w) && i > 0) return w;
      if (/\d/.test(w)) return w;
      // An abbreviation with no vowel (LWR, CC, MH) stays as the county writes it.
      if (!/[AEIOUY]/.test(w)) return w;
      if (i > 0 && SMALL.has(w)) return w.toLowerCase();
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\s*&\s*$/, "")
    .trim();
}

/** The distinct plain names among a set of sales, most sales first: "Aurora, Star Farms and 2 more". */
export function subdivisionNames(rows: Pick<Sale, "subdivision">[]): { name: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const n = r.subdivision ? plainSubdivision(r.subdivision) : "";
    if (n) m.set(n, (m.get(n) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

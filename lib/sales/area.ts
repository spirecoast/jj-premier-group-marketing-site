import type { Sale } from "./types";

/**
 * Searching the county record by an area rather than a street: a typed city
 * resolved to the ZIPs the county files it in, and a typed place name
 * matched to an Atlas entry and its ZIPs. Pure, so lib/sales/index.ts hands
 * these the rows and the Atlas index and the unit tests hand them fixtures.
 *
 * Why ZIPs and not the city label: the county labels one ZIP two ways
 * (34211 is LAKEWOOD RANCH on some rows and BRADENTON on others), so a
 * filter on the label hides half a street. The ZIP is the honest unit; the
 * stored label stays on each row.
 */

/** "Lakewood Ranch, FL" → "LAKEWOOD RANCH": upper case, one space, no state or punctuation. */
export function normalizeCity(typed: string): string {
  return (typed ?? "")
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+(FL|FLA|FLORIDA)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type CityZipTable = Map<string, string[]>;

/**
 * Which ZIPs each postal city reaches, from the record itself: a ZIP counts
 * for a city when that city labels at least `minShare` of the ZIP's rows or
 * at least `minRows` of them, so a stray mislabelled row never pulls a whole
 * ZIP in. ZIPs are listed in order.
 */
export function cityZipTable(rows: Pick<Sale, "city" | "zip">[], { minShare = 0.05, minRows = 25 }: { minShare?: number; minRows?: number } = {}): CityZipTable {
  const byZip = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const city = normalizeCity(r.city);
    if (!city || !/^\d{5}$/.test(r.zip)) continue;
    const m = byZip.get(r.zip) ?? new Map<string, number>();
    m.set(city, (m.get(city) ?? 0) + 1);
    byZip.set(r.zip, m);
  }
  const out: CityZipTable = new Map();
  for (const [zip, cities] of byZip) {
    const total = [...cities.values()].reduce((a, b) => a + b, 0);
    for (const [city, n] of cities) {
      if (n >= minRows || n / total >= minShare) out.set(city, [...(out.get(city) ?? []), zip]);
    }
  }
  for (const [city, zips] of out) out.set(city, zips.sort());
  return out;
}

/** The ZIPs a typed city resolves to, or null when the record has no such postal city. */
export function cityZips(table: CityZipTable, typed: string): string[] | null {
  const city = normalizeCity(typed);
  if (!city) return null;
  return table.get(city) ?? null;
}

/** The slice of an Atlas search-index row this module reads. */
export type PlaceRow = { slug: string; name: string; aliases: string[]; parentSlug: string | null; zips: string[]; level: string; market: string };

export type PlaceMatch = { slug: string; name: string; market: string; zips: string[] };

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** A place's ZIPs: its own and every descendant's, since an area often carries none of its own. */
export function placeZips(rows: PlaceRow[], slug: string): string[] {
  const kids = new Map<string, PlaceRow[]>();
  for (const r of rows) {
    if (!r.parentSlug) continue;
    const list = kids.get(r.parentSlug) ?? [];
    list.push(r);
    kids.set(r.parentSlug, list);
  }
  const zips = new Set<string>();
  const queue = [slug];
  const seen = new Set<string>();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  while (queue.length) {
    const cur = queue.shift()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const z of bySlug.get(cur)?.zips ?? []) if (/^\d{5}$/.test(z)) zips.add(z);
    for (const k of kids.get(cur) ?? []) queue.push(k.slug);
  }
  return [...zips].sort();
}

/**
 * The Atlas place the typed text names: an exact match on the name or an
 * alias, with the larger place winning a tie (an area over a community over
 * an enclave, then the name). Null when nothing matches whole, when the
 * text is too short to mean a place, or when the place reaches no ZIP.
 */
export function matchPlace(rows: PlaceRow[], typed: string): PlaceMatch | null {
  const q = norm(typed);
  if (q.length < 4 || /^\d+$/.test(q)) return null;
  const order: Record<string, number> = { area: 0, community: 1, enclave: 2 };
  const hits = rows
    .filter((r) => norm(r.name) === q || r.aliases.some((a) => norm(a) === q))
    .sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3) || a.name.localeCompare(b.name));
  for (const h of hits) {
    const zips = placeZips(rows, h.slug);
    if (zips.length) return { slug: h.slug, name: h.name, market: h.market, zips };
  }
  return null;
}

/** The place by its slug, with its ZIPs; null when unknown or without ZIPs. */
export function placeBySlug(rows: PlaceRow[], slug: string): PlaceMatch | null {
  const r = rows.find((x) => x.slug === slug);
  if (!r) return null;
  const zips = placeZips(rows, slug);
  return zips.length ? { slug: r.slug, name: r.name, market: r.market, zips } : null;
}

/** The distinct street-and-ZIP pairs in a set of rows, most sales first: the chips an ambiguous search offers. */
export function streetOptions(rows: Pick<Sale, "predir" | "street" | "suffix" | "postdir" | "zip">[]): { street: string; zip: string; count: number }[] {
  const m = new Map<string, { street: string; zip: string; count: number }>();
  for (const r of rows) {
    const street = [r.predir, r.street, r.suffix, r.postdir].filter(Boolean).join(" ");
    const k = `${street}|${r.zip}`;
    const cur = m.get(k);
    if (cur) cur.count += 1;
    else m.set(k, { street, zip: r.zip, count: 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.street.localeCompare(b.street) || a.zip.localeCompare(b.zip));
}

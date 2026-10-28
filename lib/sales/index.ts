import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { getIndexEntries } from "../neighborhoods/data";
import { cityZipTable, cityZips, matchPlace, placeBySlug, streetOptions, type CityZipTable, type PlaceMatch, type PlaceRow } from "./area";
import { matchParcel, stripTypedUnit, type ParcelQuery } from "./parcel";
import { joinPlaces, normPlaceName, placeSales, subdivisionNames, type PlaceJoin } from "./places";
import { similarSales, type SimilarResult } from "./similar";
import { parseTypedStreet, streetKey } from "./street";
import { fullStreet, summarize, type SalesSummary } from "./stats";
import type { County, PropertyUse, Sale } from "./types";

export { matchParcel, parcelCount, parseHouseNumber, parseTypedUnit, stripTypedUnit, type ParcelQuery } from "./parcel";
export { parseTypedStreet, streetKey } from "./street";
export type { County, PropertyUse, Sale } from "./types";
export { fullStreet, groupSummary, isResale, median, rollChanged, sizeBand, summarize, type GroupSummary, type SalesSummary } from "./stats";
export { normalizeCity, type PlaceMatch } from "./area";
export { plainSubdivision, subdivisionNames } from "./places";
export type { SimilarBasis, SimilarResult } from "./similar";

/**
 * County sales data: the qualified, arm's-length sales from the last 24
 * months as the Manatee and Sarasota County Property Appraisers publish
 * them, normalized by scripts/sales/ingest.mjs into data/sales/. Names are
 * stripped at ingest; this module only ever sees the property, the date and
 * the price. The whole set stays on the server; the route handler sends at
 * most 50 rows at a time.
 */

export type Manifest = {
  generatedAt: string;
  windowStart: string;
  windowMonths: number;
  qualifiedCodes: string[];
  namesStripped: boolean;
  licence: string;
  counties: Partial<
    Record<
      County,
      {
        label: string;
        page: string;
        sources: string[];
        rows: number;
        byUse: Partial<Record<PropertyUse, number>>;
        from: string | null;
        to: string | null;
        hasCoordinates: boolean;
        toUnchangedRuns?: number;
        file: string;
      }
    >
  >;
};

const DATA_DIR = path.join(process.cwd(), "data", "sales");
const COUNTIES: County[] = ["manatee", "sarasota"];

/** The address as it reads on the page: number, directionals, name, suffix, unit. Never a name. */
export function formatSaleAddress(s: Sale): string {
  const parts = [s.number, s.predir, s.street, s.suffix, s.postdir].filter(Boolean);
  const line = parts.join(" ");
  return s.unit ? `${line} #${s.unit}` : line;
}

type Index = {
  manifest: Manifest;
  rows: Sale[];
  byStreet: Map<string, Sale[]>;
  keys: string[];
  /** Which ZIPs each postal city reaches, from the rows (lib/sales/area.ts). */
  cities: CityZipTable;
  /** Rows by the county's subdivision name, for "other sales in {subdivision}". */
  bySubdivision: Map<string, Sale[]>;
};

let cache: Promise<Index> | null = null;

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const buf = await readFile(path.join(DATA_DIR, file));
    return JSON.parse(file.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function build(): Promise<Index> {
  const manifest = (await readJson<Manifest>("manifest.json")) ?? {
    generatedAt: "",
    windowStart: "",
    windowMonths: 24,
    qualifiedCodes: [],
    namesStripped: true,
    licence: "",
    counties: {},
  };
  const rows: Sale[] = [];
  for (const county of COUNTIES) {
    const file = manifest.counties[county]?.file ?? `${county}.json.gz`;
    const data = await readJson<Sale[]>(file);
    if (data) rows.push(...data.filter((r) => r.qualified && r.salePrice > 0));
  }
  rows.sort((a, b) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : 0));
  const byStreet = new Map<string, Sale[]>();
  for (const r of rows) {
    // The county already split the suffix off; r.street is the bare name.
    const k = streetKey(r.street, { stripSuffix: false });
    if (!k) continue;
    const list = byStreet.get(k);
    if (list) list.push(r);
    else byStreet.set(k, [r]);
  }
  const bySubdivision = new Map<string, Sale[]>();
  for (const r of rows) {
    if (!r.subdivision) continue;
    const list = bySubdivision.get(r.subdivision);
    if (list) list.push(r);
    else bySubdivision.set(r.subdivision, [r]);
  }
  return { manifest, rows, byStreet, keys: [...byStreet.keys()], cities: cityZipTable(rows), bySubdivision };
}

function index(): Promise<Index> {
  if (!cache) {
    cache = build().catch((e) => {
      cache = null;
      throw e;
    });
  }
  return cache;
}

/** The manifest, or null when the data has not been ingested yet. */
export async function getSalesManifest(): Promise<Manifest | null> {
  const { manifest, rows } = await index();
  return rows.length ? manifest : null;
}

/** True when at least one county file is present and non-empty. */
export async function hasSalesData(): Promise<boolean> {
  return (await index()).rows.length > 0;
}

export type StreetQuery = {
  street: string;
  /** A postal city, resolved to the ZIPs the county files it in; a city the record doesn't know matches nothing. */
  city?: string;
  zip?: string;
  county?: County;
  /** At most this many rows back, newest first; the summary is always over every match. Up to MAX_ROWS. */
  limit?: number;
};

/** The most rows one answer carries: a whole street in the 24-month window (the biggest has a few hundred). */
export const MAX_ROWS = 1000;

export type StreetResult = {
  /**
   * How the street matched: exact (name, and the typed suffix/directional
   * when given), partial (the name only, or a key containing the query),
   * fuzzy (one edit away), ambiguous (several full streets or ZIPs and no
   * ZIP or city to pick one), or none.
   */
  match: "exact" | "partial" | "fuzzy" | "ambiguous" | "none";
  /** Every street (as the county spells it) in the result, so the page names all of them. */
  streets: string[];
  /** Every ZIP in the result. */
  zips: string[];
  /** When ambiguous: each street-and-ZIP pair that answers, most sales first, for the page to offer as chips. */
  options: { street: string; zip: string; count: number }[];
  rows: Sale[];
  total: number;
  /** Computed over every match on the street, not only the rows returned. */
  summary: SalesSummary;
};

function editDistanceAtMost(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  const prev = new Array<number>(b.length + 1);
  const cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return false;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length] <= max;
}

/**
 * Sales on a street, newest first. The street name is matched after folding
 * suffix and directional variants; ZIP, city and county narrow it. With no
 * exact match the search widens to keys that contain the query (a visitor
 * typing "Midnight Pass" for "Midnight Pass Rd"), then to keys one edit
 * away, but only when a ZIP or city keeps the widening honest.
 */
export async function searchByStreet(q: StreetQuery): Promise<StreetResult> {
  const { byStreet, keys, cities } = await index();
  const typed = (q.street ?? "").trim();
  const none = (match: StreetResult["match"] = "none"): StreetResult => ({ match, streets: [], zips: [], options: [], rows: [], total: 0, summary: summarize([]) });
  // Guard on what was typed, not the folded key: "9th Ave" folds to "9" and is a real street.
  if (typed.length < 2) return none();
  // "Midnight Pass" is a whole name, "Lilac Sky Dr" carries a suffix: try the typed words as-is, then with one suffix folded.
  const asTyped = streetKey(typed, { stripSuffix: false });
  const folded = streetKey(typed);
  const key = byStreet.has(asTyped) ? asTyped : folded;
  if (!key) return none();
  const wanted = parseTypedStreet(typed);
  // When the typed words matched as a whole name (Midnight Pass), the last word is part of the name, not a suffix.
  if (key === asTyped && asTyped !== folded) wanted.suffix = "";
  const limit = Math.min(Math.max(q.limit ?? 50, 1), MAX_ROWS);
  const zip = (q.zip ?? "").replace(/\D/g, "").slice(0, 5);
  // A typed city narrows to the ZIPs the county files that city in, not to the label on the row:
  // 34211 is LAKEWOOD RANCH and BRADENTON row by row, and a seller means the place, not the label.
  const city = (q.city ?? "").trim();
  const cityZipSet = city ? new Set(cityZips(cities, city) ?? []) : null;
  if (cityZipSet && !cityZipSet.size) return none();
  const scoped = (rows: Sale[]) =>
    rows.filter((r) => (!zip || r.zip === zip) && (!cityZipSet || cityZipSet.has(r.zip)) && (!q.county || r.county === q.county));

  let match: StreetResult["match"] = "exact";
  let hit = scoped(byStreet.get(key) ?? []);
  if (!hit.length && key.length >= 4) {
    match = "partial";
    const partialKeys = keys.filter((k) => k.includes(key) || (key.length > k.length + 2 && key.includes(k) && k.length >= 4));
    hit = scoped(partialKeys.flatMap((k) => byStreet.get(k) ?? []));
    if (!hit.length && (zip || city) && key.length >= 5) {
      match = "fuzzy";
      const near = keys.filter((k) => editDistanceAtMost(k, key, 1));
      hit = scoped(near.flatMap((k) => byStreet.get(k) ?? []));
    }
  }
  if (!hit.length) return none();

  // The typed suffix and directionals pick among streets that share a name
  // (69th St W vs 69th St NW, 10th St W vs 10th Ave W). When some hits carry
  // them, keep only those; when none does, the county spells it another way.
  for (const part of ["suffix", "postdir", "predir"] as const) {
    if (!wanted[part]) continue;
    const same = hit.filter((r) => r[part] === wanted[part]);
    if (same.length) hit = same;
    else if (match === "exact") match = "partial";
  }

  hit.sort((a, b) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : 0));
  const streets = [...new Set(hit.map(fullStreet))];
  const zips = [...new Set(hit.map((r) => r.zip))].sort();
  // Several distinct streets or several ZIPs with nothing to pick one: ask for the ZIP rather than blend them.
  if (!zip && !cityZipSet && (streets.length > 1 || zips.length > 1)) {
    return { match: "ambiguous", streets, zips, options: streetOptions(hit), rows: [], total: hit.length, summary: summarize([]) };
  }
  return { match, streets, zips, options: [], rows: hit.slice(0, limit), total: hit.length, summary: summarize(hit) };
}

/** The ZIPs a typed city reaches in the record, or null when it isn't a postal city the county uses. */
export async function zipsForCity(city: string): Promise<string[] | null> {
  const { cities } = await index();
  return cityZips(cities, city);
}

export type AreaResult = {
  place: PlaceMatch;
  rows: Sale[];
  total: number;
  /** Over every sale in the area, not only the rows returned. */
  summary: SalesSummary;
  streets: string[];
};

/** The Atlas search index, in the shape lib/sales/area.ts reads. Read once per process. */
let places: Promise<PlaceRow[]> | null = null;
function placeRows(): Promise<PlaceRow[]> {
  if (!places) {
    places = getIndexEntries()
      .then((rows) => rows.map((e) => ({ slug: e.s, name: e.n, aliases: e.a, parentSlug: e.p, zips: e.z, level: e.l, market: e.m })))
      .catch((e) => {
        places = null;
        throw e;
      });
  }
  return places;
}

/**
 * The place a typed street box names, if it names one: an Atlas area,
 * community or enclave by its name or an alias, or a postal city the county
 * uses. Null for a street. Never throws: without the Atlas file there is no
 * place to offer.
 */
export async function placeFor(typed: string): Promise<PlaceMatch | null> {
  const t = (typed ?? "").trim();
  if (t.length < 4) return null;
  try {
    const atlas = matchPlace(await placeRows(), t);
    if (atlas) return atlas;
  } catch {
    // The Atlas index is optional here.
  }
  const zips = await zipsForCity(t);
  return zips?.length ? { slug: `city:${zips.join("-")}`, name: titleCity(t), market: "", zips } : null;
}

/** "lakewood ranch" → "Lakewood Ranch". */
function titleCity(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+(fl|fla|florida)\s*$/, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Every qualified sale in a place's ZIPs, newest first, with the summary
 * over all of them: "Sales in The Lake Club (ZIP area)". A place slug from
 * `placeFor`; `city:<zips>` is a postal city's set. Null when unknown.
 */
export async function searchByArea({ place: slug, limit = 200 }: { place: string; limit?: number }): Promise<AreaResult | null> {
  const { rows } = await index();
  let place: PlaceMatch | null = null;
  const city = /^city:((?:\d{5})(?:-\d{5})*)$/.exec(slug);
  if (city) {
    const zips = city[1]!.split("-");
    place = { slug, name: "", market: "", zips };
  } else {
    try {
      place = placeBySlug(await placeRows(), slug);
    } catch {
      place = null;
    }
  }
  if (!place) return null;
  const set = new Set(place.zips);
  const hit = rows.filter((r) => set.has(r.zip));
  const streets = [...new Set(hit.map(fullStreet))];
  return { place, rows: hit.slice(0, Math.min(Math.max(limit, 1), MAX_ROWS)), total: hit.length, summary: summarize(hit), streets };
}

/**
 * The qualified sales on one parcel, newest first: the exact house number
 * on the typed street in the typed ZIP (lib/sales/parcel.ts). Empty when
 * the number is not on the record, the ZIP is missing, or the street is
 * unknown; the page says so rather than guessing a neighbour.
 */
export async function findParcelSales(q: ParcelQuery): Promise<Sale[]> {
  const { byStreet } = await index();
  const typed = stripTypedUnit(q.street ?? "");
  if (typed.length < 2) return [];
  const asTyped = streetKey(typed, { stripSuffix: false });
  const folded = streetKey(typed);
  const rows = asTyped === folded ? (byStreet.get(folded) ?? []) : [...(byStreet.get(asTyped) ?? []), ...(byStreet.get(folded) ?? [])];
  return matchParcel(rows, q);
}

const EARTH_MILES = 3958.8;

/**
 * Sales within a radius of a point. The county files carry no coordinates
 * today (manifest.hasCoordinates is false for both), so this returns an
 * empty list until an ingest adds lat/lng; the shape is here so the page
 * can grow into it without a schema change.
 */
export async function nearby({ lat, lng, radiusMiles, limit = 50 }: { lat: number; lng: number; radiusMiles: number; limit?: number }): Promise<Sale[]> {
  const { rows } = await index();
  const toRad = (d: number) => (d * Math.PI) / 180;
  const out: { d: number; r: Sale }[] = [];
  for (const r of rows) {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") continue;
    const dLat = toRad(r.lat - lat);
    const dLng = toRad(r.lng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(r.lat)) * Math.sin(dLng / 2) ** 2;
    const d = 2 * EARTH_MILES * Math.asin(Math.sqrt(a));
    if (d <= radiusMiles) out.push({ d, r });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, Math.min(limit, 50)).map((o) => o.r);
}

/**
 * Every qualified sale dated in [from, to] (YYYY-MM-DD, inclusive), newest
 * first. For the Tide issue (lib/issues/tide-monthly.ts), which computes its
 * figures over a whole month; never sent to a browser.
 */
export async function salesBetween(from: string, to: string): Promise<Sale[]> {
  const { rows } = await index();
  return rows.filter((r) => r.saleDate >= from && r.saleDate <= to);
}

/* ---- Sales joined to places (lib/sales/places.ts) --------------------------- */

let joined: Promise<{ join: PlaceJoin; places: PlaceRow[] }> | null = null;
/** The county rows joined to Atlas places by subdivision name. Built once per process. */
function placeJoin(): Promise<{ join: PlaceJoin; places: PlaceRow[] }> {
  if (!joined) {
    joined = Promise.all([index(), placeRows()])
      // The postal cities the county files sales under are read by ZIP, never by a plat name.
      .then(([{ rows, cities }, places]) => ({ join: joinPlaces(rows, places, new Set([...cities.keys()].map(normPlaceName))), places }))
      .catch((e) => {
        joined = null;
        throw e;
      });
  }
  return joined;
}

export type PlaceSales = {
  place: { slug: string; name: string; zips: string[] };
  /**
   * The sales the county files under the place's own subdivisions (its
   * enclaves included), when the join finds any: the count and summary over
   * all of them, the newest few, and the plain subdivision names.
   */
  joined: { total: number; summary: SalesSummary; newest: Sale[]; names: { name: string; count: number }[] } | null;
  /** Every sale in the place's ZIPs, when it lists any. */
  zipArea: { zips: string[]; total: number; summary: SalesSummary } | null;
  /** The counties the figures come from, for the source line. */
  counties: County[];
};

/**
 * What sold in and around an Atlas place, for its page and the compare
 * table: the sales the county files under the place's subdivisions, and
 * every sale in its ZIPs. Null when there's no sales data or no such place;
 * either half is null when the record has nothing for it. Never throws.
 */
export async function salesForPlace(slug: string, { newest = 5 }: { newest?: number } = {}): Promise<PlaceSales | null> {
  try {
    const [{ rows }, { join, places }] = await Promise.all([index(), placeJoin()]);
    if (!rows.length) return null;
    const row = places.find((p) => p.slug === slug);
    if (!row) return null;
    const zips = placeBySlug(places, slug)?.zips ?? [];
    const own = placeSales(join, slug);
    const zipSet = new Set(zips);
    const zipRows = zips.length ? rows.filter((r) => zipSet.has(r.zip)) : [];
    const counties = [...new Set([...own, ...zipRows].map((r) => r.county))];
    return {
      place: { slug, name: row.name, zips },
      joined: own.length ? { total: own.length, summary: summarize(own), newest: own.slice(0, newest), names: subdivisionNames(own) } : null,
      zipArea: zipRows.length ? { zips, total: zipRows.length, summary: summarize(zipRows) } : null,
      counties,
    };
  } catch (e) {
    console.error("[sales] place join failed", e instanceof Error ? e.message : e);
    return null;
  }
}

/** The Atlas places a street's sales belong to (by subdivision), most sales first, then the areas that list its ZIP. At most `max`. */
export async function placesForRows(rows: Sale[], { max = 4 }: { max?: number } = {}): Promise<{ slug: string; name: string; level: string }[]> {
  try {
    const { join, places } = await placeJoin();
    const bySlug = new Map(places.map((p) => [p.slug, p]));
    const counts = new Map<string, number>();
    for (const r of rows) {
      const s = join.slugOf.get(r);
      if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    const out = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => bySlug.get(s)!).filter(Boolean);
    const zips = new Set(rows.map((r) => r.zip));
    for (const p of places) {
      if (out.length >= max) break;
      if (p.level === "area" && p.zips.some((z) => zips.has(z)) && !out.includes(p)) out.push(p);
    }
    return out.slice(0, max).map((p) => ({ slug: p.slug, name: p.name, level: p.level }));
  } catch {
    return [];
  }
}

/**
 * "Other sales in {subdivision}": for a street with fewer than three sales,
 * the rest of the subdivision most of its rows are in. Null when the street
 * has three or more, or no subdivision on record.
 */
export async function alsoInSubdivision(streetRows: Sale[], { limit = 10, below = 3 }: { limit?: number; below?: number } = {}): Promise<{ subdivision: string; total: number; summary: SalesSummary; rows: Sale[] } | null> {
  if (!streetRows.length || streetRows.length >= below) return null;
  const counts = new Map<string, number>();
  for (const r of streetRows) if (r.subdivision) counts.set(r.subdivision, (counts.get(r.subdivision) ?? 0) + 1);
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!top) return null;
  const { bySubdivision } = await index();
  const onStreet = new Set(streetRows);
  const rest = (bySubdivision.get(top[0]) ?? []).filter((r) => !onStreet.has(r));
  if (!rest.length) return null;
  return { subdivision: top[0], total: rest.length, summary: summarize(rest), rows: rest.slice(0, limit) };
}

/** Similar sales near one house (lib/sales/similar.ts), read against its county's newest sale. */
export async function similarForParcel(house: Sale): Promise<SimilarResult | null> {
  const { rows, manifest } = await index();
  const newest = manifest.counties[house.county]?.to ?? rows[0]?.saleDate;
  return newest ? similarSales(house, rows, newest) : null;
}

/* ---- Street Watch's inputs (lib/watch) ------------------------------------- */

export type NewSalesFile = { generatedAt: string; since: string | null; through: Partial<Record<County, string | null>>; rows: Sale[] };

/**
 * data/sales/new-sales.json.gz, written by the refresh's verify step
 * (scripts/sales/verify.mjs): the sales the county recorded since the
 * refresh before. Null when the file isn't there.
 */
export async function getNewSales(): Promise<NewSalesFile | null> {
  const file = await readJson<NewSalesFile>("new-sales.json.gz");
  return file && typeof file.generatedAt === "string" && Array.isArray(file.rows) ? file : null;
}

/** The key a sale keeps across refreshes (scripts/sales/verify-lib.mjs `saleKey`). */
export const saleKey = (r: Pick<Sale, "county" | "parcelId" | "saleDate">) => `${r.county}|${r.parcelId}|${r.saleDate}`;

/**
 * Which sales count as a place's for Street Watch: the ones the county files
 * under its subdivisions (by key), or, for a place the join finds nothing
 * for, every sale in its ZIPs. Null for an unknown place.
 */
export async function placeMatcher(slug: string): Promise<{ basis: "joined"; keys: Set<string>; rows: Sale[] } | { basis: "zip"; zips: string[]; rows: Sale[] } | null> {
  const [{ rows }, { join, places }] = await Promise.all([index(), placeJoin()]);
  if (!places.some((p) => p.slug === slug)) return null;
  const own = placeSales(join, slug);
  if (own.length) return { basis: "joined", keys: new Set(own.map(saleKey)), rows: own };
  const zips = placeBySlug(places, slug)?.zips ?? [];
  if (!zips.length) return null;
  const set = new Set(zips);
  return { basis: "zip", zips, rows: rows.filter((r) => set.has(r.zip)) };
}

/** Every sale on one street as the county spells it ("LILAC SKY TER") in one ZIP, newest first. */
export async function streetSales(street: string, zip: string): Promise<Sale[]> {
  const { byStreet } = await index();
  const want = street.toUpperCase().replace(/\s+/g, " ").trim();
  const out: Sale[] = [];
  for (const k of new Set([streetKey(street, { stripSuffix: false }), streetKey(street)])) {
    for (const r of byStreet.get(k) ?? []) if (r.zip === zip && fullStreet(r) === want && !out.includes(r)) out.push(r);
  }
  return out;
}

/** The record's newest sale date per county, for "records through …". */
export async function throughDates(): Promise<Partial<Record<County, string | null>>> {
  const { manifest } = await index();
  return Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, c?.to ?? null]));
}

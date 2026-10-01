import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * County sales data: the qualified, arm's-length sales from the last 24
 * months as the Manatee and Sarasota County Property Appraisers publish
 * them, normalized by scripts/sales/ingest.mjs into data/sales/. Names are
 * stripped at ingest; this module only ever sees the property, the date and
 * the price. The whole set stays on the server; the route handler sends at
 * most 50 rows at a time.
 */

export type County = "manatee" | "sarasota";
export type PropertyUse = "single-family" | "condo" | "townhome" | "villa" | "vacant" | "other";

export type Sale = {
  county: County;
  parcelId: string;
  number: string;
  predir: string;
  street: string;
  suffix: string;
  postdir: string;
  unit: string;
  city: string;
  zip: string;
  lat?: number;
  lng?: number;
  /** ISO date, YYYY-MM-DD. */
  saleDate: string;
  salePrice: number;
  qualified: boolean;
  /** FDOR qualification code: 01 deed, 02 evidence, 03/04 qualified but the roll changed since. */
  qualCode: string;
  instrument: string;
  livingArea: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  propertyUse: PropertyUse;
};

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
        file: string;
      }
    >
  >;
};

export type SalesSummary = {
  count: number;
  /** Sales the roll shows as a building (anything but vacant). */
  homes: number;
  /** Sales the roll still shows as vacant: lots, and new builds the roll has not caught up with. */
  lots: number;
  /** Median of price ÷ living area over homes with a recorded living area that are not roll-changed; null when fewer than two. */
  medianPricePerSqft: number | null;
  /** How many sales went into the $/sqft median. */
  sqftSampleSize: number;
  medianPrice: number | null;
  from: string | null;
  to: string | null;
};

const DATA_DIR = path.join(process.cwd(), "data", "sales");
const COUNTIES: County[] = ["manatee", "sarasota"];

/** The suffixes a visitor might type, each folded to nothing so "Lilac Sky Dr" and "Lilac Sky Drive" meet. */
const SUFFIX_WORDS = new Set([
  "st", "street", "dr", "drive", "blvd", "boulevard", "ct", "court", "ln", "lane", "way", "cir", "circle", "pl", "place",
  "ter", "terr", "terrace", "trl", "trail", "pkwy", "parkway", "ave", "av", "avenue", "rd", "road", "loop", "run", "path",
  "pt", "point", "cv", "cove", "sq", "square", "hwy", "highway", "bnd", "bend", "row", "walk", "pass", "xing", "crossing",
  "gln", "glen", "mnr", "manor", "plz", "plaza", "rdg", "ridge", "vw", "view", "lndg", "landing", "aly", "alley", "key", "ky",
  "cres", "crescent", "expy", "expressway", "trce", "trace", "holw", "hollow", "pike",
]);
const DIR_WORDS = new Set(["n", "s", "e", "w", "ne", "nw", "se", "sw", "north", "south", "east", "west"]);
/** Typed suffix → the abbreviation the counties store, so "Street" and "St" compare equal. */
const SUFFIX_ABBR: Record<string, string> = {
  street: "ST", st: "ST", drive: "DR", dr: "DR", boulevard: "BLVD", blvd: "BLVD", court: "CT", ct: "CT", lane: "LN", ln: "LN", way: "WAY",
  circle: "CIR", cir: "CIR", place: "PL", pl: "PL", terrace: "TER", terr: "TER", ter: "TER", trail: "TRL", trl: "TRL", parkway: "PKWY", pkwy: "PKWY",
  avenue: "AVE", ave: "AVE", av: "AVE", road: "RD", rd: "RD", loop: "LOOP", run: "RUN", path: "PATH", point: "PT", pt: "PT", cove: "CV", cv: "CV",
  square: "SQ", sq: "SQ", highway: "HWY", hwy: "HWY", bend: "BND", bnd: "BND", row: "ROW", walk: "WALK", pass: "PASS", crossing: "XING", xing: "XING",
  glen: "GLN", gln: "GLN", manor: "MNR", mnr: "MNR", plaza: "PLZ", plz: "PLZ", ridge: "RDG", rdg: "RDG", view: "VW", vw: "VW", landing: "LNDG", lndg: "LNDG",
  alley: "ALY", aly: "ALY", key: "KY", ky: "KY", crescent: "CRES", cres: "CRES", expressway: "EXPY", expy: "EXPY", trace: "TRCE", trce: "TRCE",
  hollow: "HOLW", holw: "HOLW", pike: "PIKE",
};
const DIR_ABBR: Record<string, string> = { north: "N", south: "S", east: "E", west: "W", n: "N", s: "S", e: "E", w: "W", ne: "NE", nw: "NW", se: "SE", sw: "SW" };

/** The suffix and directionals a visitor typed, normalized to the county's spelling; "" when not typed. */
export function parseTypedStreet(input: string): { predir: string; suffix: string; postdir: string } {
  const words = input
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length > 1 && /^\d+[a-z]?$/.test(words[0]) && !ORDINAL.test(words[0])) words.shift();
  const unitAt = words.findIndex((w) => UNIT_WORDS.has(w));
  if (unitAt > 0) words.splice(unitAt);
  let postdir = "";
  let suffix = "";
  let predir = "";
  if (words.length > 1 && DIR_WORDS.has(words[words.length - 1])) postdir = DIR_ABBR[words.pop() as string];
  if (words.length > 1 && SUFFIX_WORDS.has(words[words.length - 1])) suffix = SUFFIX_ABBR[words.pop() as string] ?? "";
  if (!postdir && words.length > 1 && DIR_WORDS.has(words[words.length - 1])) postdir = DIR_ABBR[words.pop() as string];
  if (words.length > 1 && DIR_WORDS.has(words[0])) predir = DIR_ABBR[words.shift() as string];
  return { predir, suffix, postdir };
}
const UNIT_WORDS = new Set(["unit", "apt", "ste", "suite", "bldg", "lot"]);
const ORDINAL = /^(\d+)(st|nd|rd|th)$/;

/**
 * "5133 96th St E" → "96", "Midnight Pass Road" → "midnightpass". A leading
 * house number and a trailing unit are dropped, directionals fold away, one
 * trailing suffix folds away (the county stores the name and the suffix
 * apart, so a name that ends in a suffix word, Midnight Pass, keeps it when
 * `stripSuffix` is false), ordinals keep their number, and what is left is
 * lower-case alphanumerics.
 */
export function streetKey(input: string, { stripSuffix = true }: { stripSuffix?: boolean } = {}): string {
  const words = input
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length > 1 && /^\d+[a-z]?$/.test(words[0]) && !ORDINAL.test(words[0])) words.shift();
  const unitAt = words.findIndex((w) => UNIT_WORDS.has(w));
  if (unitAt > 0) words.splice(unitAt);
  if (words.length > 1 && DIR_WORDS.has(words[words.length - 1])) words.pop();
  if (stripSuffix && words.length > 1 && SUFFIX_WORDS.has(words[words.length - 1])) words.pop();
  if (words.length > 1 && DIR_WORDS.has(words[words.length - 1])) words.pop();
  if (words.length > 1 && DIR_WORDS.has(words[0])) words.shift();
  return words
    .map((w) => {
      const m = w.match(ORDINAL);
      return m ? m[1] : w;
    })
    .join("");
}

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
  return { manifest, rows, byStreet, keys: [...byStreet.keys()] };
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
  city?: string;
  zip?: string;
  county?: County;
  limit?: number;
};

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
  const { byStreet, keys } = await index();
  const typed = (q.street ?? "").trim();
  const none = (match: StreetResult["match"] = "none"): StreetResult => ({ match, streets: [], zips: [], rows: [], total: 0, summary: summarize([]) });
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
  const limit = Math.min(Math.max(q.limit ?? 50, 1), 50);
  const zip = (q.zip ?? "").replace(/\D/g, "").slice(0, 5);
  const city = (q.city ?? "").trim().toUpperCase();
  const scoped = (rows: Sale[]) =>
    rows.filter((r) => (!zip || r.zip === zip) && (!city || r.city === city) && (!q.county || r.county === q.county));

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
  if (!zip && !city && (streets.length > 1 || zips.length > 1)) {
    return { match: "ambiguous", streets, zips, rows: [], total: hit.length, summary: summarize([]) };
  }
  return { match, streets, zips, rows: hit.slice(0, limit), total: hit.length, summary: summarize(hit) };
}

/** "N TAMIAMI TRL", "69TH ST NW": the street as the county spells it, without a house number. */
export function fullStreet(s: Sale): string {
  return [s.predir, s.street, s.suffix, s.postdir].filter(Boolean).join(" ");
}

/**
 * True when the roll's building facts are not the ones that were paid for:
 * a 03/04 code (the appraiser says so), or a year built after the sale year
 * (a new build the roll caught up with later). Such rows stay in the count
 * and the table but out of the $/sqft median.
 */
export function rollChanged(s: Sale): boolean {
  if (s.qualCode === "03" || s.qualCode === "04") return true;
  const saleYear = Number(s.saleDate.slice(0, 4));
  return Boolean(s.yearBuilt && saleYear && s.yearBuilt > saleYear);
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

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Computed, never typed: count, homes and lots, date range, median price,
 * and the median price per living square foot over the homes whose roll
 * facts are the ones that were paid for (see rollChanged).
 */
export function summarize(rows: Sale[]): SalesSummary {
  const perSqft = rows
    .filter((r) => r.propertyUse !== "vacant" && !rollChanged(r) && r.livingArea && r.livingArea > 0)
    .map((r) => r.salePrice / (r.livingArea as number));
  const lots = rows.filter((r) => r.propertyUse === "vacant").length;
  const dates = rows.map((r) => r.saleDate).sort();
  return {
    count: rows.length,
    homes: rows.length - lots,
    lots,
    medianPricePerSqft: perSqft.length >= 2 ? Math.round(median(perSqft) as number) : null,
    sqftSampleSize: perSqft.length,
    medianPrice: rows.length ? Math.round(median(rows.map((r) => r.salePrice)) as number) : null,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
  };
}

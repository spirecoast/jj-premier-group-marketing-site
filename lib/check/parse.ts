import { parseHouseNumber, parseTypedUnit, stripTypedUnit } from "../sales/parcel";
import { streetParts } from "../sales/street";

/**
 * Atlas Check, the pure half: what was typed, the county queries it becomes,
 * and what the public layers' answers mean. No I/O, so the unit tests run it
 * on fixtures. lib/check/lookup.ts does the fetching.
 */

export type County = "manatee" | "sarasota";

export type ParsedAddress = {
  number: string;
  /** The street's name as the county stores it: "TAMIAMI", "9TH", "LILY QUARTZ". */
  name: string;
  predir: string;
  suffix: string;
  postdir: string;
  unit: string;
  zip: string;
  /** "1660 Ringling Blvd, 34236", for the page and the share line. */
  display: string;
};

export type ParseError = "number" | "street" | "zip";

/** A pasted ZIP at the end of the address line wins over nothing, never over the ZIP field. */
const TAIL_ZIP = /\b(\d{5})(?:-\d{4})?\s*$/;

const titleWord = (w: string) => (/^(N|S|E|W|NE|NW|SE|SW)$/.test(w) ? w : /^\d+(ST|ND|RD|TH)$/.test(w) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase());

/**
 * "1660 Ringling Blvd" + "34236", or "6810 9th Ave W #204, Bradenton, FL
 * 34209" with the ZIP field empty. A number, a street and a ZIP are all
 * required: a number and a street repeat across towns.
 */
export function parseAddress(address: string, zipField = ""): ParsedAddress | { error: ParseError } {
  const raw = (address ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  const zipTyped = (zipField ?? "").trim();
  const zip = /^\d{5}(-\d{4})?$/.test(zipTyped) ? zipTyped.slice(0, 5) : (TAIL_ZIP.exec(raw.replace(/[\s,]+$/, ""))?.[1] ?? "");
  const first = raw.split(",")[0] ?? "";
  const { number, street: withUnit } = parseHouseNumber(first);
  if (!number) return { error: "number" };
  const unit = parseTypedUnit(withUnit);
  const street = stripTypedUnit(withUnit);
  const parts = streetParts(street);
  if (!parts.name || parts.name.length < 2 || !/^[A-Z0-9][A-Z0-9 '-]*$/.test(parts.name)) return { error: "street" };
  if (!zip) return { error: "zip" };
  const line = [number, parts.predir, ...parts.name.split(" ").map(titleWord), parts.suffix ? titleWord(parts.suffix) : "", parts.postdir].filter(Boolean).join(" ");
  return { number, ...parts, unit, zip, display: `${line}${unit ? ` #${unit}` : ""}, ${zip}` };
}

/** A string for an ArcGIS where clause: single quotes doubled, nothing but what an address holds. */
export const sqlText = (s: string) => s.replace(/[^A-Za-z0-9 '#-]/g, "").replace(/'/g, "''");

/**
 * The ZIPs each county's own sales file carries (scripts/sales/verify-lib.mjs,
 * KNOWN_ZIPS): a ZIP in one county's list asks that county's parcel layer
 * first. 34228, 34243 and 34251 are in both.
 */
const COUNTY_ZIPS: Record<County, ReadonlySet<string>> = {
  manatee: new Set(["33598", "34201", "34202", "34203", "34205", "34207", "34208", "34209", "34210", "34211", "34212", "34215", "34216", "34217", "34219", "34221", "34222", "34228", "34243", "34250", "34251"]),
  sarasota: new Set(["34223", "34224", "34228", "34229", "34231", "34232", "34233", "34234", "34235", "34236", "34237", "34238", "34239", "34240", "34241", "34242", "34243", "34251", "34275", "34285", "34286", "34287", "34288", "34289", "34291", "34292", "34293"]),
};

/** The counties to ask for a ZIP, in order; both when the ZIP is in neither list. */
export function countiesForZip(zip: string): County[] {
  const hits = (["manatee", "sarasota"] as const).filter((c) => COUNTY_ZIPS[c].has(zip));
  return hits.length ? hits : ["manatee", "sarasota"];
}

/* ---- The public layers ------------------------------------------------------------ */

/**
 * Every layer Atlas Check reads. Each is a public ArcGIS REST service that
 * needs no key, published by the county or by FEMA, and each has a page a
 * person can open to check the answer themselves.
 */
export const LAYERS = {
  manateeParcels: "https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/GIS_PARCELS/FeatureServer/0",
  sarasotaParcels: "https://ags3.scgov.net/server/rest/services/Hosted/Parcels/FeatureServer/0",
  manateeEvac: "https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/Evacuation%20Levels%20Feature%20Service/FeatureServer/0",
  sarasotaEvac: "https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0",
  floodZones: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
  firmPanels: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/3",
  census: "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress",
} as const;

/** The pages a person checks the answer on. */
export const PAGES = {
  manateeEvac: "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level",
  sarasotaEvac: "https://www.scgov.net/know-your-evacuation-zone",
  fema: (line: string) => `https://msc.fema.gov/portal/search?AddressQuery=${encodeURIComponent(line)}`,
  manateeParcel: (id: string) => `https://www.manateepao.gov/parcel/?parid=${encodeURIComponent(id)}`,
  manateeAppraiser: "https://www.manateepao.gov/",
  sarasotaAppraiser: "https://www.sc-pa.com/",
} as const;

/**
 * The fields read from each parcel layer: the address, the building and the
 * lot. Never an owner, a mailing address or anything about who: those
 * columns exist in both layers and are not requested.
 */
export const PARCEL_FIELDS = {
  manatee: ["PARCEL_ID", "PROP_HN", "PROP_DIR", "POSTAL_STREET", "POSTAL_SUFF", "UNIT", "PROP_CITYNAME", "PROP_ZIP", "SUBDIVISION", "LUC_DESCRIPTION", "SFLA", "YRBLT_RES", "YRBLT_COM", "ACRES", "LAT", "LON"],
  sarasota: ["account", "locn", "locd", "locs", "loct", "locd_suffix", "unit", "loccity", "loczip", "stcd", "living", "yrbl", "lsqft", "hyperlink"],
} as const;

/** The where clause for a parcel by its address. `like` widens the name to a prefix for the second try. */
export function parcelWhere(county: County, a: Pick<ParsedAddress, "number" | "name" | "zip">, like = false): string {
  const name = sqlText(a.name);
  const nameTest = (field: string) => (like ? `${field} LIKE '${name}%'` : `${field}='${name}'`);
  return county === "manatee"
    ? `PROP_HN='${sqlText(a.number)}' AND ${nameTest("POSTAL_STREET")} AND PROP_ZIP='${sqlText(a.zip)}'`
    : `locn='${sqlText(a.number)}' AND ${nameTest("locs")} AND loczip='${sqlText(a.zip)}'`;
}

/** The query string for an ArcGIS layer: JSON out, the fields asked for, geometry in WGS84 when wanted. */
export function arcgisParams(p: Record<string, string | number | boolean>): string {
  return new URLSearchParams(Object.entries({ f: "json", ...p }).map(([k, v]) => [k, String(v)])).toString();
}

/** A point query at lng, lat in WGS84. */
export const pointParams = (lng: number, lat: number) => ({
  geometry: `${lng.toFixed(6)},${lat.toFixed(6)}`,
  geometryType: "esriGeometryPoint",
  inSR: 4326,
  spatialRel: "esriSpatialRelIntersects",
  returnGeometry: false,
});

/* ---- A parcel as the layers return it ------------------------------------------------ */

export type Ring = [number, number][];

export type Parcel = {
  county: County;
  id: string;
  number: string;
  /** "RINGLING BLVD", "MANATEE AVE W". */
  street: string;
  name: string;
  suffix: string;
  dir: string;
  unit: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  rings: Ring[] | null;
  livingArea: number | null;
  yearBuilt: number | null;
  /** Lot size in square feet. */
  lotSqft: number | null;
  /** "Single family", "Condominium", "Vacant residential": the roll's use, in plain words, when we can say it. */
  use: string | null;
  /** The appraiser's own page for this parcel. */
  link: string;
};

type Attrs = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** "Single Family Residential (0100)" → "Single family residential". */
function plainUse(s: string): string | null {
  const t = s.replace(/\s*\(\d+\)\s*$/, "").trim();
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Sarasota's state use codes, the residential ones a visitor would type (docs/SALES-DATA.md reads the same codes). */
const SARASOTA_USE: Record<string, string> = {
  "0000": "Vacant residential",
  "0100": "Single family",
  "0101": "Townhouse or attached unit",
  "0102": "Townhouse or attached unit",
  "0105": "Single family",
  "0200": "Mobile home",
  "0400": "Condominium",
  "0403": "Condominium",
  "0800": "Multi-family, under 10 units",
};

/** The middle of a polygon's outer ring (the area-weighted centroid), for a parcel layer that sends no point. */
export function ringCentroid(ring: Ring): { lat: number; lng: number } | null {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j]!;
    const [x1, y1] = ring[i]!;
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (!a) return null;
  return { lng: cx / (3 * a), lat: cy / (3 * a) };
}

export function toParcel(county: County, f: { attributes?: Attrs; geometry?: { rings?: Ring[] }; centroid?: { x: number; y: number } }): Parcel | null {
  const a = f.attributes ?? {};
  const rings = Array.isArray(f.geometry?.rings) && f.geometry!.rings!.length ? f.geometry!.rings! : null;
  if (county === "manatee") {
    const id = str(a.PARCEL_ID);
    const lat = num(a.LAT);
    const lngRaw = typeof a.LON === "number" ? a.LON : Number(a.LON);
    const point = lat && Number.isFinite(lngRaw) ? { lat, lng: lngRaw } : rings ? ringCentroid(rings[0]!) : null;
    if (!id || !point) return null;
    const name = str(a.POSTAL_STREET);
    const suffix = str(a.POSTAL_SUFF);
    const dir = str(a.PROP_DIR);
    return {
      county,
      id,
      number: str(a.PROP_HN),
      street: [name, suffix, dir].filter(Boolean).join(" "),
      name,
      suffix,
      dir,
      unit: str(a.UNIT),
      city: str(a.PROP_CITYNAME),
      zip: str(a.PROP_ZIP),
      lat: point.lat,
      lng: point.lng,
      rings,
      livingArea: num(a.SFLA),
      yearBuilt: num(a.YRBLT_RES) ?? num(a.YRBLT_COM),
      lotSqft: num(a.ACRES) ? Math.round(num(a.ACRES)! * 43_560) : null,
      use: plainUse(str(a.LUC_DESCRIPTION)),
      link: PAGES.manateeParcel(id),
    };
  }
  const id = str(a.account);
  const point = f.centroid && Number.isFinite(f.centroid.x) ? { lat: f.centroid.y, lng: f.centroid.x } : rings ? ringCentroid(rings[0]!) : null;
  if (!id || !point) return null;
  const name = str(a.locs);
  const suffix = str(a.loct);
  const dir = str(a.locd_suffix) || str(a.locd);
  const link = str(a.hyperlink);
  return {
    county,
    id,
    number: str(a.locn),
    street: [str(a.locd), name, suffix, str(a.locd_suffix)].filter(Boolean).join(" "),
    name,
    suffix,
    dir,
    unit: str(a.unit),
    city: str(a.loccity),
    zip: str(a.loczip),
    lat: point.lat,
    lng: point.lng,
    rings,
    livingArea: num(a.living),
    yearBuilt: num(a.yrbl),
    lotSqft: num(a.lsqft),
    use: SARASOTA_USE[str(a.stcd)] ?? null,
    link: /^https:\/\/www\.sc-pa\.com\//.test(link) ? link : PAGES.sarasotaAppraiser,
  };
}

/**
 * The one parcel the typed address names, or the parcels it could be. A
 * typed suffix or directional picks among streets that share a name; a typed
 * unit picks the unit. Without a unit, a building's units all share the
 * address: the first stands for the location and the count is reported.
 */
export function pickParcel(parcels: Parcel[], a: Pick<ParsedAddress, "suffix" | "postdir" | "predir" | "unit">): { parcel: Parcel; units: number } | null {
  let list = parcels;
  if (a.suffix) {
    const s = list.filter((p) => !p.suffix || p.suffix === a.suffix);
    if (s.length) list = s;
  }
  const dir = a.postdir || a.predir;
  if (dir) {
    const d = list.filter((p) => !p.dir || p.dir === dir);
    if (d.length) list = d;
  }
  if (!list.length) return null;
  // Streets that differ only by a suffix or a direction the visitor didn't type: too many to pick from.
  const streets = new Set(list.map((p) => p.street));
  if (streets.size > 1) return null;
  if (a.unit) {
    const u = list.filter((p) => p.unit.replace(/^0+/, "").toUpperCase() === a.unit.replace(/^0+/, ""));
    if (u.length) return { parcel: u[0]!, units: 1 };
  }
  return { parcel: list[0]!, units: list.length };
}

/* ---- What the layers' answers mean --------------------------------------------------- */

export type EvacZone = "A" | "B" | "C" | "D" | "E" | "none";

/** Manatee's EVAC_ZONE ("A".."E", "N/A") or Sarasota's EvacuationZone ("A".."E"; no feature means none). */
export function evacFrom(county: County, features: { attributes?: Attrs }[]): EvacZone[] {
  const out = new Set<EvacZone>();
  for (const f of features) {
    const v = str(county === "manatee" ? f.attributes?.EVAC_ZONE : f.attributes?.EvacuationZone).toUpperCase();
    if (/^[A-E]$/.test(v)) out.add(v as EvacZone);
  }
  return out.size ? [...out].sort() : ["none"];
}

export type FloodZone = {
  /** FEMA's code: "AE", "VE", "X", "A", "AH", "AO", "D". */
  zone: string;
  /** "0.2 PCT ANNUAL CHANCE FLOOD HAZARD" (shaded X), "AREA OF MINIMAL FLOOD HAZARD"…, as FEMA writes it. */
  subtype: string | null;
  /** In the special flood hazard area (the 1% annual chance flood). */
  sfha: boolean;
  /** Base flood elevation in feet, when the map sets one. */
  bfe: number | null;
  datum: string | null;
};

export function floodFrom(features: { attributes?: Attrs }[]): FloodZone[] {
  const out = new Map<string, FloodZone>();
  for (const f of features) {
    const a = f.attributes ?? {};
    const zone = str(a.FLD_ZONE).toUpperCase();
    if (!zone) continue;
    const bfe = typeof a.STATIC_BFE === "number" && a.STATIC_BFE > -9000 ? a.STATIC_BFE : null;
    const z: FloodZone = { zone, subtype: str(a.ZONE_SUBTY) || null, sfha: str(a.SFHA_TF) === "T", bfe, datum: str(a.V_DATUM) || null };
    const key = `${z.zone}|${z.subtype}|${z.bfe}`;
    if (!out.has(key)) out.set(key, z);
  }
  // The riskiest first: the special flood hazard area, then the higher base flood elevation.
  return [...out.values()].sort((a, b) => Number(b.sfha) - Number(a.sfha) || (b.bfe ?? -1) - (a.bfe ?? -1) || a.zone.localeCompare(b.zone));
}

/** "Shaded X" is the 0.2% annual chance (500-year) area; plain X is minimal hazard. */
export const isShadedX = (z: FloodZone) => z.zone === "X" && /0\.2\s*PCT|0\.2%|500/i.test(z.subtype ?? "");

/** The flood guide's card for a zone code: VE and AE and X have their own; A, AH and AO read as AE's family. */
export const guideCardFor = (zone: string): "VE" | "AE" | "X" | null =>
  /^V/.test(zone) ? "VE" : /^A/.test(zone) ? "AE" : zone === "X" ? "X" : null;

export type FirmPanel = { id: string; effective: string | null };

/**
 * The FIRM panel at the point. Panels from a neighbouring county's map can
 * overlap at a county line, so the one from this county's own map (its
 * DFIRM id, 12081C for Manatee, 12115C for Sarasota) is preferred.
 */
export function panelFrom(features: { attributes?: Attrs }[], county?: County): FirmPanel | null {
  const own = county === "manatee" ? "12081C" : county === "sarasota" ? "12115C" : "";
  const all = features.map((f) => f.attributes ?? {}).filter((a) => str(a.FIRM_PAN));
  const a = all.find((x) => own && str(x.DFIRM_ID) === own) ?? all[0];
  if (!a) return null;
  const eff = typeof a.EFF_DATE === "number" ? new Date(a.EFF_DATE).toISOString().slice(0, 10) : null;
  return { id: str(a.FIRM_PAN), effective: eff };
}

/** The one-line address for the Census geocoder: "1 N Tamiami Trl, FL 34236". */
export function censusLine(a: Pick<ParsedAddress, "number" | "predir" | "name" | "suffix" | "postdir" | "zip">): string {
  return `${[a.number, a.predir, a.name, a.suffix, a.postdir].filter(Boolean).join(" ")}, FL ${a.zip}`;
}

/** The county a Census match falls in, by FIPS code. */
export function countyFromFips(geoid: string): County | null {
  return geoid === "12081" ? "manatee" : geoid === "12115" ? "sarasota" : null;
}

/** Round a parcel ring to six places (about 10 cm) and close it, for a polygon query. */
export function polygonParam(rings: Ring[]): string {
  return JSON.stringify({ rings: rings.map((r) => r.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))])), spatialReference: { wkid: 4326 } });
}

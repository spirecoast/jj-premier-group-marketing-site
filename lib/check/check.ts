import {
  LAYERS,
  PAGES,
  PARCEL_FIELDS,
  arcgisParams,
  censusLine,
  countyFromFips,
  evacFrom,
  floodFrom,
  panelFrom,
  parcelWhere,
  pickParcel,
  pointParams,
  polygonParam,
  toParcel,
  type County,
  type EvacZone,
  type FirmPanel,
  type FloodZone,
  type Parcel,
  type ParsedAddress,
} from "./parse";

/**
 * Atlas Check, the steps: find the parcel, then read the evacuation zone and
 * the flood zone at it, each from the public layer that publishes it. The
 * fetching is handed in (`deps.get`, `deps.post`), so the server wraps it in
 * a cache and the tests hand it fixtures. Every source is asked on its own:
 * one that fails leaves its own fact out, says so, and the rest still show.
 */

export type Deps = {
  /** GET a JSON document. Throws on a network error, a non-2xx or an ArcGIS error body. */
  get: (url: string) => Promise<unknown>;
  /** POST a form to an ArcGIS layer's /query (a parcel polygon is too long for a URL). */
  post: (url: string, form: string) => Promise<unknown>;
  /** The ZIPs each county's sales file holds: a ZIP in one only asks that county's layer first. */
  countiesForZip: (zip: string) => County[];
};

type Features = { features?: { attributes?: Record<string, unknown>; geometry?: { rings?: [number, number][][] }; centroid?: { x: number; y: number } }[] };
const features = (j: unknown) => ((j as Features)?.features ?? []) as NonNullable<Features["features"]>;

export type Located =
  | { kind: "parcel"; county: County; parcel: Parcel; units: number }
  | { kind: "geocoder"; county: County; lat: number; lng: number; matched: string }
  | { kind: "outside"; matched: string }
  | { kind: "none" };

async function findParcels(county: County, a: ParsedAddress, deps: Deps, like: boolean): Promise<Parcel[]> {
  const url = county === "manatee" ? LAYERS.manateeParcels : LAYERS.sarasotaParcels;
  const q = arcgisParams({
    where: parcelWhere(county, a, like),
    outFields: PARCEL_FIELDS[county].join(","),
    returnGeometry: true,
    outSR: 4326,
    geometryPrecision: 6,
    ...(county === "sarasota" ? { returnCentroid: true } : {}),
    resultRecordCount: 50,
  });
  const j = await deps.get(`${url}/query?${q}`);
  return features(j)
    .map((f) => toParcel(county, f))
    .filter((p): p is Parcel => p !== null);
}

/**
 * The parcel first, in the county the ZIP belongs to (both when it could be
 * either): the exact street name, then the name as a prefix when that finds
 * one street only. When neither county's roll has it (a house too new for
 * the roll, a typo), the Census geocoder places the address on its street,
 * which is close but not exact.
 */
export async function locate(a: ParsedAddress, deps: Deps): Promise<Located> {
  const counties = deps.countiesForZip(a.zip);
  const order: County[] = counties.length ? counties : ["manatee", "sarasota"];
  let parcelError: unknown = null;
  for (const like of [false, true]) {
    for (const county of order) {
      try {
        const found = await findParcels(county, a, deps, like);
        const pick = pickParcel(found, a);
        if (pick) return { kind: "parcel", county, parcel: pick.parcel, units: pick.units };
      } catch (err) {
        parcelError = err;
      }
    }
  }
  try {
    const q = new URLSearchParams({ address: censusLine(a), benchmark: "Public_AR_Current", vintage: "Current_Current", layers: "Counties", format: "json" });
    const j = (await deps.get(`${LAYERS.census}?${q}`)) as { result?: { addressMatches?: { matchedAddress: string; coordinates: { x: number; y: number }; geographies?: { Counties?: { GEOID: string }[] } }[] } };
    const m = j.result?.addressMatches?.[0];
    if (m) {
      const county = countyFromFips(m.geographies?.Counties?.[0]?.GEOID ?? "");
      if (!county) return { kind: "outside", matched: m.matchedAddress };
      return { kind: "geocoder", county, lat: m.coordinates.y, lng: m.coordinates.x, matched: m.matchedAddress };
    }
  } catch (err) {
    if (parcelError) throw err;
  }
  if (parcelError) throw parcelError;
  return { kind: "none" };
}

export type Fact<T> = { status: "ok"; value: T } | { status: "error" };

export type Evacuation = { zone: EvacZone; others: EvacZone[] };
export type Flood = { zone: FloodZone; others: FloodZone[]; panel: FirmPanel | null };

/**
 * What a layer says at the parcel: every value its polygon touches, and the
 * one at its middle first. One polygon query answers most parcels (one
 * value); only a parcel that straddles a line costs a second, point query.
 */
async function atParcel<T>(layer: string, outFields: string, read: (f: ReturnType<typeof features>) => T[], where: { lat: number; lng: number; rings: [number, number][][] | null }, deps: Deps, key: (t: T) => string): Promise<{ primary: T; others: T[] } | null> {
  if (where.rings && where.rings[0] && where.rings[0].length <= 400) {
    const all = read(features(await deps.post(`${layer}/query`, arcgisParams({ geometry: polygonParam(where.rings), geometryType: "esriGeometryPolygon", inSR: 4326, spatialRel: "esriSpatialRelIntersects", outFields, returnGeometry: false }))));
    if (all.length <= 1) return all[0] ? { primary: all[0], others: [] } : null;
    const atPoint = read(features(await deps.get(`${layer}/query?${arcgisParams({ ...pointParams(where.lng, where.lat), outFields })}`)));
    const primary = atPoint[0] ?? all[0]!;
    return { primary, others: all.filter((x) => key(x) !== key(primary)) };
  }
  const atPoint = read(features(await deps.get(`${layer}/query?${arcgisParams({ ...pointParams(where.lng, where.lat), outFields })}`)));
  return atPoint[0] ? { primary: atPoint[0], others: [] } : null;
}

export async function evacuationAt(county: County, where: { lat: number; lng: number; rings: [number, number][][] | null }, deps: Deps): Promise<Evacuation> {
  const layer = county === "manatee" ? LAYERS.manateeEvac : LAYERS.sarasotaEvac;
  const field = county === "manatee" ? "EVAC_ZONE" : "EvacuationZone";
  // evacFrom answers ["none"] for no feature (or Manatee's N/A), so a parcel outside every zone reads as one answer;
  // a parcel that touches a zone reads as that zone, the cautious reading.
  const r = await atParcel(layer, field, (fs) => evacFrom(county, fs), where, deps, (z) => z);
  if (!r) return { zone: "none", others: [] };
  return { zone: r.primary, others: r.others.filter((z) => z !== "none") };
}

export async function floodAt(county: County, where: { lat: number; lng: number; rings: [number, number][][] | null }, deps: Deps): Promise<Flood | null> {
  const [zones, panelJson] = await Promise.all([
    atParcel(LAYERS.floodZones, "FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,V_DATUM", floodFrom, where, deps, (z) => `${z.zone}|${z.subtype}|${z.bfe}`),
    deps.get(`${LAYERS.firmPanels}/query?${arcgisParams({ ...pointParams(where.lng, where.lat), outFields: "FIRM_PAN,EFF_DATE,DFIRM_ID" })}`).catch(() => null),
  ]);
  if (!zones) return null;
  return { zone: zones.primary, others: zones.others, panel: panelJson ? panelFrom(features(panelJson), county) : null };
}

export type CheckResult = {
  county: County;
  located: "parcel" | "geocoder";
  /** The address as the county's roll (or the Census geocoder) writes it. */
  address: string;
  city: string | null;
  zip: string;
  /** More than one when the address is a building of units and none was typed. */
  units: number;
  evacuation: Fact<Evacuation>;
  flood: Fact<Flood | null>;
  roll: Pick<Parcel, "id" | "livingArea" | "yearBuilt" | "lotSqft" | "use" | "link"> | null;
  /** For the sales file's parcel match and the street links. */
  parcel: { number: string; street: string; zip: string } | null;
  /** The day the layers were read (cached results keep the day they were first read). */
  checked: string;
  sources: { evacuation: { layer: string; page: string }; flood: { layer: string; page: string }; roll: { page: string } | null };
};

const settle = async <T>(p: Promise<T>): Promise<Fact<T>> => {
  try {
    return { status: "ok", value: await p };
  } catch {
    return { status: "error" };
  }
};

/** The whole check for an address that has been located in one of the two counties. */
export async function checkLocated(l: Extract<Located, { kind: "parcel" | "geocoder" }>, a: ParsedAddress, deps: Deps, today: string): Promise<CheckResult> {
  const where = l.kind === "parcel" ? { lat: l.parcel.lat, lng: l.parcel.lng, rings: l.parcel.rings } : { lat: l.lat, lng: l.lng, rings: null };
  const [evacuation, flood] = await Promise.all([settle(evacuationAt(l.county, where, deps)), settle(floodAt(l.county, where, deps))]);
  const p = l.kind === "parcel" ? l.parcel : null;
  const line =
    l.kind === "parcel" ? [l.parcel.number, l.parcel.street].filter(Boolean).join(" ") + (l.parcel.unit && l.units === 1 ? ` #${l.parcel.unit}` : "") : l.matched.replace(/, FL, \d{5}$/, "");
  return {
    county: l.county,
    located: l.kind,
    address: line,
    city: p?.city || null,
    zip: p?.zip || a.zip,
    units: l.kind === "parcel" ? l.units : 1,
    evacuation,
    flood,
    // A building's units share an address; the roll's facts belong to one unit, so they show only when the unit was typed.
    roll: p && (l.kind !== "parcel" || l.units === 1) ? { id: p.id, livingArea: p.livingArea, yearBuilt: p.yearBuilt, lotSqft: p.lotSqft, use: p.use, link: p.link } : null,
    parcel: p ? { number: p.number, street: p.street, zip: p.zip } : null,
    checked: today,
    sources: {
      evacuation: { layer: l.county === "manatee" ? LAYERS.manateeEvac : LAYERS.sarasotaEvac, page: l.county === "manatee" ? PAGES.manateeEvac : PAGES.sarasotaEvac },
      flood: { layer: LAYERS.floodZones, page: PAGES.fema(`${line}, ${p?.city || ""} FL ${p?.zip || a.zip}`.replace(/\s+/g, " ")) },
      roll: p ? { page: p.link } : null,
    },
  };
}

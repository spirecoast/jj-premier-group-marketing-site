/**
 * Types for data/neighborhoods.json and data/neighborhoods.search.json.
 * Generated with the dataset on 2026-09-23. Every fact in a record is backed by an entry in `sources`.
 * Unknown values are null (never guessed). `notes` is internal research context: never render it.
 */

export type MarketSlug = 'lakewood-ranch' | 'sarasota' | 'bradenton';
export type NeighborhoodLevel = 'area' | 'community' | 'enclave';
export type NeighborhoodType =
  | 'downtown district' | 'island' | 'historic district' | 'neighborhood' | 'master-planned community'
  | 'village' | 'golf community' | 'gated community' | 'condo community' | 'subdivision';
export type NeighborhoodStatus = 'established' | 'selling' | 'coming-soon' | 'built-out';
export type WaterAccess = 'gulf-front' | 'bayfront' | 'canal' | 'river' | 'lake' | 'none';
export type HomeType =
  | 'single-family' | 'villa' | 'paired villa' | 'townhome' | 'condominium' | 'carriage home' | 'coach home'
  | 'estate' | 'manufactured';
/** 'full' = researched individually; 'registry-only' = county map-layer name plus map-service facts only. */
export type ResearchDepth = 'full' | 'registry-only';
/** Manatee levels and Sarasota zones are A–E; 'none' = outside every zone. */
export type EvacuationZone = 'A' | 'B' | 'C' | 'D' | 'E' | 'none';

export interface NeighborhoodSource {
  url: string;
  /** Comma-separated field names (and short context) this source supports. */
  supports: string;
  /** Date the source was opened for this dataset (YYYY-MM-DD). */
  checked: string;
  /** The page's own published/updated date when it shows one. Older than ~2 years = stale. */
  sourceDate: string | null;
}

export interface ZonedSchools {
  /** Exactly as the district locator returns them. Sarasota names end in "Zone"; K-8 schools fill elementary and middle. */
  elementary: string | null;
  middle: string | null;
  high: string | null;
  /** The county address point the lookup used. */
  checkedAddress: string;
  /** Coordinates of that address point (used by scripts/refresh-gis.mjs). */
  checkedPoint?: { lat: number; lng: number };
  /** The district locator to link to. */
  sourceUrl: string;
  /** Always display: zoning is by address and can change. */
  note: string;
}

export interface Neighborhood {
  /** 'neighborhood-<slug>' — matches the site's Sanity seed convention. */
  _id: string;
  slug: string;
  name: string;
  aliases: string[];
  level: NeighborhoodLevel;
  /** Parent area/community slug; builds the area > community > enclave hierarchy. */
  parentSlug: string | null;
  market: MarketSlug;
  /** True for Palmetto, Ellenton, Parrish (and Palmetto-mailing places) inside the bradenton market. */
  bradentonArea: boolean;
  jurisdiction: string | null;
  county: 'Manatee' | 'Sarasota' | null;
  zips: string[];
  lat: number | null;
  lng: number | null;
  type: NeighborhoodType | null;
  developer: string | null;
  /** Builders selling there per the builder's own site on the checked date. */
  activeBuilders: string[];
  yearsBuilt: string | null;
  homeTypes: HomeType[];
  homeCount: number | null;
  gated: boolean | null;
  /** true ONLY with a community document citing HOPA. Currently null everywhere (see coverage.json). */
  ageRestricted: boolean | null;
  hoa: { name: string | null; website: string | null } | null;
  cdd: { name: string; source: string } | null;
  amenities: string[];
  waterAccess: WaterAccess | null;
  zonedSchools: ZonedSchools | null;
  evacuationZone: EvacuationZone | null;
  status: NeighborhoodStatus | null;
  officialUrl: string | null;
  /** 1–2 factual sentences; fair-housing checked. */
  description: string | null;
  research: ResearchDepth;
  sources: NeighborhoodSource[];
  /** Internal research notes, conflicts and flags. Not for display. */
  notes: string | null;
}

/** One row of data/neighborhoods.search.json. */
export interface NeighborhoodSearchEntry {
  slug: string;
  name: string;
  aliases: string[];
  level: NeighborhoodLevel;
  parentSlug: string | null;
  /** Ancestor names, top-down (e.g. ["Palmer Ranch"]). */
  path: string[];
  market: MarketSlug;
  bradentonArea: boolean;
  county: 'Manatee' | 'Sarasota' | null;
  jurisdiction: string | null;
  zips: string[];
  type: NeighborhoodType | null;
  status: NeighborhoodStatus | null;
  homeTypes: HomeType[];
  activeBuilders: string[];
  gated: boolean | null;
  lat: number | null;
  lng: number | null;
  research: ResearchDepth;
  /** Lower-cased, punctuation-stripped search text: name, aliases, ancestors, zips, builders, developer, HOA, jurisdiction, type. */
  q: string;
}

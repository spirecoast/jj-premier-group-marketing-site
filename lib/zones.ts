/**
 * What a flood zone and an evacuation zone mean, in plain words. This is the
 * one place the site says it: every page that shows a zone (Atlas Check, the
 * Atlas place pages, the explorer's card, Compare, Match, the search answers,
 * the market hubs, the editorial place pages, the sample listings and the
 * cards to post) takes its words from here, through components/zone-note.tsx.
 *
 * Flood zones are FEMA's. The high-risk zones (A, AE, AH, AO, AR, A99, V and
 * VE) make up the special flood hazard area: land with a 1% chance of flooding
 * in any year, where a mortgage from a government-backed lender comes with a
 * flood insurance requirement. Shaded X sits between that line and the 0.2%
 * (1 in 500) flood; unshaded X is above it; D hasn't been studied. The risk
 * names match the flood guide's zone cards (VE highest, AE high, X lower), and
 * lib/zones.test.ts holds them together.
 *
 * Evacuation zones are each county's: Manatee calls them levels, Sarasota
 * zones, both lettered A to E by how far storm surge could reach, A called
 * first. They're about storm surge, not the same as the flood zone, as the
 * hurricane guide says.
 *
 * Every source was opened on the day in ZONES_CHECKED. No imports, so the
 * copy check and the tests can load the file as it is.
 */

export type ZoneSource = { label: string; href: string };

/** The day the sources below were read. */
export const ZONES_CHECKED = "2026-11-04";

export const ZONE_SOURCES = {
  femaZones: { label: "FEMA, Flood zones (glossary)", href: "https://www.fema.gov/glossary/flood-zones" },
  femaCoastal: { label: "FEMA, Features of flood insurance rate maps in coastal areas", href: "https://www.fema.gov/flood-maps/coastal/insurance-rate-maps" },
  femaInsurance: { label: "FEMA, Flood insurance", href: "https://www.fema.gov/flood-insurance" },
  femaVE: { label: "FEMA, Zone VE and V1-30 (glossary)", href: "https://www.fema.gov/about/glossary/zone-ve-and-v1-30" },
  femaV: { label: "FEMA, Zone V (glossary)", href: "https://www.fema.gov/about/glossary/zone-v" },
  femaAE: { label: "FEMA, Zone AE and A1-30 (glossary)", href: "https://www.fema.gov/glossary/zone-ae-and-a1-30" },
  femaAH: { label: "FEMA, Zone AH (glossary)", href: "https://www.fema.gov/about/glossary/zone-ah" },
  femaAO: { label: "FEMA, Zone AO (glossary)", href: "https://www.fema.gov/about/glossary/zone-ao" },
  femaD: { label: "FEMA, Zone D (glossary)", href: "https://www.fema.gov/about/glossary/zone-d" },
  manateeEvac: {
    label: "Manatee County, Know your evacuation level",
    href: "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level",
  },
  sarasotaGuide: {
    label: "Sarasota County, Emergency preparedness guide (on the City of Sarasota’s site)",
    href: "https://www.sarasotafl.gov/I-Want-to/View-County-Hurricane-Preparedness-Guide",
  },
} as const satisfies Record<string, ZoneSource>;

/** Where the guides explain the zones at length. */
export const ZONE_GUIDES = {
  flood: "/guides/flood-zones-and-elevation-certificates-on-the-suncoast#the-three-zones",
  evacuation: "/guides/hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton#evacuation-zone-vs-flood-zone",
} as const;

/* ---- Flood zones ---------------------------------------------------------------------- */

export type FloodRisk = "highest" | "high" | "moderate" | "lower" | "unknown";

export type FloodZoneMeaning = {
  /** The code as the page shows it ("AE", "X"). */
  code: string;
  risk: FloodRisk;
  /** "High risk": the answer to "is that good or bad?" */
  label: string;
  /** One plain line, set beside the code. */
  line: string;
  sources: readonly ZoneSource[];
};

export const FLOOD_RISK_LABEL: Record<FloodRisk, string> = {
  highest: "Highest risk",
  high: "High risk",
  moderate: "Moderate risk",
  lower: "Lower risk",
  unknown: "Not studied",
};

const S = ZONE_SOURCES;
const SFHA = "Part of FEMA’s 1% annual chance flood area";
const REQUIRED = "Lenders usually require flood insurance here.";
const OPTIONAL = "U.S. rules don’t require flood insurance here, but a lender can.";

const meaning = (code: string, risk: FloodRisk, line: string, sources: readonly ZoneSource[]): FloodZoneMeaning => ({
  code,
  risk,
  label: FLOOD_RISK_LABEL[risk],
  line,
  sources,
});

/**
 * What a FEMA flood zone means, from its code as FEMA writes it (FLD_ZONE on the
 * flood map, or a code named in a sentence). `shaded` is true for shaded X, the
 * 0.2% annual chance area, false for unshaded X; left out, X gets the line that
 * holds for both. Null for a code that isn't a flood zone (open water, an area
 * the map leaves out).
 */
export function floodZoneMeaning(raw: string, opts: { shaded?: boolean } = {}): FloodZoneMeaning | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^V(E|\d{1,2})?$/.test(code)) {
    return meaning(code, "highest", `${SFHA}, on the coast, where storm waves can be 3 feet or more. ${REQUIRED}`, [S.femaVE, S.femaV, S.femaCoastal, S.femaInsurance]);
  }
  if (code === "AH") return meaning(code, "high", `${SFHA}, where water can pond 1 to 3 feet deep. ${REQUIRED}`, [S.femaAH, S.femaZones, S.femaInsurance]);
  if (code === "AO") return meaning(code, "high", `${SFHA}, where shallow water can run across the ground 1 to 3 feet deep. ${REQUIRED}`, [S.femaAO, S.femaZones, S.femaInsurance]);
  if (/^A(E|\d{1,2}|99|R(\/[A-Z0-9-]+)?)?$/.test(code)) return meaning(code, "high", `${SFHA}, where lenders usually require flood insurance.`, [S.femaAE, S.femaZones, S.femaInsurance]);
  if (code === "B" || (code === "X" && opts.shaded === true)) {
    return meaning(code, "moderate", `Outside FEMA’s 1% annual chance flood area, but inside the 0.2% (1 in 500) area. ${OPTIONAL}`, [S.femaZones, S.femaCoastal]);
  }
  if (code === "C" || (code === "X" && opts.shaded === false)) return meaning(code, "lower", `Higher ground, above FEMA’s 0.2% (1 in 500) annual chance flood. ${OPTIONAL}`, [S.femaZones, S.femaCoastal]);
  if (code === "X") return meaning(code, "lower", `Outside FEMA’s 1% annual chance flood area. ${OPTIONAL}`, [S.femaZones, S.femaCoastal]);
  if (code === "D") return meaning(code, "unknown", "FEMA hasn’t studied the flood risk here, so the map doesn’t say.", [S.femaD]);
  return null;
}

/* ---- Evacuation zones ----------------------------------------------------------------- */

export type EvacZone = "A" | "B" | "C" | "D" | "E" | "none";

/** Each county's own word: Manatee County calls them levels, Sarasota County zones. */
export type EvacWord = "zone" | "level";

export const evacWordFor = (county: string | null | undefined): EvacWord => (/manatee/i.test(county ?? "") ? "level" : "zone");

const EVAC_LINE: Record<EvacZone, (w: EvacWord) => string> = {
  A: () => "The first called to leave, and the most exposed to storm surge.",
  B: (w) => `Next in line after ${w} A, and less exposed to storm surge.`,
  C: (w) => `Next in line after ${w}s A and B.`,
  D: (w) => `Next in line after ${w}s A, B and C.`,
  E: () => "The last of the five called to leave, and the least exposed to storm surge.",
  none: (w) => `Outside all five ${w}s on the county’s storm surge map.`,
};

const MOST_EXPOSED = (w: EvacWord) => `${w === "level" ? "Level" : "Zone"} A is the most exposed to storm surge.`;

const EVAC_SHORT: Record<EvacZone, (w: EvacWord) => string> = {
  A: () => "Called to leave first. The most exposed to storm surge.",
  B: (w) => `Next in line after ${w} A. ${MOST_EXPOSED(w)}`,
  C: (w) => `Next in line after ${w}s A and B. ${MOST_EXPOSED(w)}`,
  D: (w) => `Next in line after ${w}s A to C. ${MOST_EXPOSED(w)}`,
  E: () => "Called to leave last of the five. The least exposed to storm surge.",
  none: (w) => `Outside every ${w} on the county’s storm surge map.`,
};

const EVAC_TAG: Record<EvacZone, (w: EvacWord) => string> = {
  A: () => "first called to leave",
  B: (w) => `next after ${w} A`,
  C: (w) => `next after ${w}s A and B`,
  D: (w) => `next after ${w}s A to C`,
  E: () => "last called to leave",
  none: (w) => `outside every ${w}`,
};

export type EvacZoneMeaning = {
  zone: EvacZone;
  word: EvacWord;
  /** One plain line, set beside the letter. */
  line: string;
  /** Two short sentences that stand alone, for a card or a table cell. */
  short: string;
  /** A few words, after the letter on a card to post: "Evacuation zone B, next after zone A". */
  tag: string;
  sources: readonly ZoneSource[];
};

export function evacZoneMeaning(zone: EvacZone, word: EvacWord = "zone"): EvacZoneMeaning {
  return { zone, word, line: EVAC_LINE[zone](word), short: EVAC_SHORT[zone](word), tag: EVAC_TAG[zone](word), sources: [S.manateeEvac, S.sarasotaGuide] };
}

/** What the letters mean, after "A to E": A first and most exposed, and not the flood zone. */
export const evacLetters = (word: EvacWord = "zone") =>
  `${word === "level" ? "Level" : "Zone"} A is called to leave first and is the most exposed to storm surge, the seawater a hurricane pushes ashore. They’re about storm surge, not the same as the flood zone.`;

/** What the letters are, said once beside a zone or a question about one. */
export const evacAbout = (word: EvacWord = "zone") => `Evacuation ${word}s run from A to E. ${evacLetters(word)}`;

/* ---- Zones named in a sentence -------------------------------------------------------- */

/**
 * A flood zone code standing on its own in a sentence: VE, AE, AH or AO, or a lone
 * capital X. A lone A, V or D reads as a word (or as an evacuation zone), so it
 * isn't matched. A code already followed by a bracket is left alone. (No
 * lookbehind: older Safari can't parse one, and this runs in the browser.)
 */
const CODE = /(^|[^\w-])(VE|AE|AH|AO|X)(?![\w-])(?!\s*\()/g;

/** The codes in a sentence with where each starts. */
const codeMatches = (text: string) => [...text.matchAll(CODE)].map((m) => ({ code: m[2]!, at: m.index + m[1]!.length }));

/** The flood zone codes a sentence names, each once, in the order it names them. */
export function floodCodesIn(text: string): string[] {
  return [...new Set(codeMatches(text).map((m) => m.code))];
}

/** Whether a sentence talks about evacuation zones or levels. */
export const namesEvacuation = (text: string) => /\bevacuation (zone|level)s?\b/i.test(text);

export type ZoneTextPart = { text: string } | { code: string; label: string };

/**
 * A sentence cut around its flood zone codes, so a page can set the risk after
 * the first mention of each: "zone AE (high risk) or VE (highest risk)".
 */
export function zoneTextParts(text: string): ZoneTextPart[] {
  const out: ZoneTextPart[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const { code, at } of codeMatches(text)) {
    if (seen.has(code)) continue;
    const meaning = floodZoneMeaning(code);
    if (!meaning) continue;
    seen.add(code);
    const end = at + code.length;
    out.push({ text: text.slice(last, end) }, { code, label: meaning.label.toLowerCase() });
    last = end;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** A sentence with each code's risk set after its first mention, as plain text. */
export const withZoneRisk = (text: string) => zoneTextParts(text).map((p) => ("code" in p ? ` (${p.label})` : p.text)).join("");

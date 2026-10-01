/**
 * Street parsing shared by lib/sales/index.ts (server) and the unit tests:
 * no file reads, no server-only marker. The county stores a house number,
 * directionals, a name and a suffix apart; these fold what a visitor types
 * into the same shape.
 */

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

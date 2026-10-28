import { parseHouseNumber } from "../sales/parcel";
import { parseTypedStreet } from "../sales/street";

/**
 * The suffixes that read as a street in a search box. The county's longer
 * list (lib/sales/street.ts) also folds Key, Pass, Point, Run and Walk, which
 * are place names and topics as often as streets ("Siesta Key"), so search
 * keeps to the ones that only ever end a street.
 */
const STREET_SUFFIXES = new Set(["st", "street", "dr", "drive", "blvd", "boulevard", "ct", "court", "ln", "lane", "way", "cir", "circle", "pl", "place", "ter", "terr", "terrace", "trl", "trail", "pkwy", "parkway", "ave", "av", "avenue", "rd", "road", "loop", "hwy", "highway"]);
const isStreetSuffix = (w: string) => STREET_SUFFIXES.has(w.toLowerCase().replace(/\.$/, ""));

/**
 * What a search box was asked for, before the index is queried. A street or
 * an address is a question for Tide Street (every qualified sale on that
 * street) or, with a house number, for Home Value (the record for that
 * house), not for the guides. Pure, no I/O: the page renders the lead card
 * from this and the zero-result state does the same.
 */

export type StreetIntent = {
  kind: "street";
  /** The street as typed, without the house number, ZIP or city. */
  street: string;
  /** The house number, when the query is an address. */
  number: string | null;
  zip: string | null;
};
export type ZipIntent = { kind: "zip"; zip: string };
export type SearchIntent = StreetIntent | ZipIntent | null;

const ZIP = /\b(\d{5})(?:-\d{4})?\s*$/;
/** ", Bradenton", ", Sarasota FL", " FL": a pasted tail after the street. */
const TAIL = /(?:,\s*[a-z .'-]+)?(?:[\s,]+(?:fl|fla|florida))?\s*$/i;

/**
 * "Lilac Sky Dr", "14447 lilac sky ter 34211", "9403 9th Ave NW, Bradenton, FL 34209"
 * read as a street; "34211" alone as a ZIP; a question or a place name as
 * neither. A street is one to four words ending in a suffix (Dr, Ln, Blvd,
 * Trl…) with an optional directional after it; the suffix is what tells a
 * street from a place or a topic.
 */
export function searchIntent(raw: string): SearchIntent {
  const q = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!q || q.length > 120) return null;
  if (/^\d{5}(?:-\d{4})?$/.test(q)) return { kind: "zip", zip: q.slice(0, 5) };
  if (/[?!]/.test(q)) return null;
  const zipMatch = ZIP.exec(q);
  const zip = zipMatch ? zipMatch[1]! : null;
  const head = (zipMatch ? q.slice(0, zipMatch.index) : q).replace(TAIL, "").trim();
  const { number, street } = parseHouseNumber(head);
  const words = street
    .replace(/[.,#]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 2 || words.length > 6) return null;
  const dir = parseTypedStreet(street);
  // The suffix is required: "Lilac Sky" alone could be a place or a person. A trailing directional ("Ave W") is fine.
  if (!dir.suffix) return null;
  const nameWords = words.length - 1 - (dir.postdir ? 1 : 0) - (dir.predir ? 1 : 0);
  if (nameWords < 1 || nameWords > 4) return null;
  // Every name word is letters, digits or an ordinal: "9th Ave", "Gulf of Mexico Dr".
  if (!words.every((w) => /^[a-z0-9'-]+$/i.test(w))) return null;
  if (!isStreetSuffix(words[words.length - 1 - (dir.postdir ? 1 : 0)]!)) return null;
  return { kind: "street", street, number: number || null, zip };
}

/** "lilac sky ter" → "Lilac Sky Ter", for the card; directionals and ordinals keep their case. */
export function titleStreet(s: string): string {
  return s
    .split(" ")
    .map((w) => (/^(n|s|e|w|ne|nw|se|sw)$/i.test(w) ? w.toUpperCase() : /^\d+(st|nd|rd|th)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/** The Tide Street link for an intent, with the street (and ZIP) prefilled. */
export function tideStreetHref(i: StreetIntent | ZipIntent): string {
  const p = new URLSearchParams();
  if (i.kind === "street") {
    p.set("street", i.street);
    if (i.zip) p.set("zip", i.zip);
  } else {
    p.set("zip", i.zip);
  }
  return `/sell/sold?${p}`;
}

/** The Home Value link for an address: the house number and street, and the ZIP when typed. */
export function homeValueHref(i: StreetIntent): string | null {
  if (!i.number) return null;
  const p = new URLSearchParams({ address: `${i.number} ${i.street}` });
  if (i.zip) p.set("zip", i.zip);
  return `/sell/home-value?${p}`;
}

/** The Atlas Check link for an address with its ZIP: the flood and evacuation zone for that house. */
export function checkHref(i: StreetIntent): string | null {
  if (!i.number || !i.zip) return null;
  return `/check?${new URLSearchParams({ address: `${i.number} ${i.street}`, zip: i.zip })}`;
}

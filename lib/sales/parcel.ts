import { parseTypedStreet, streetKey } from "./street";
import type { Sale } from "./types";

/**
 * One parcel's own sales: the rows whose house number, street and ZIP are
 * the ones typed. Pure, so lib/sales/index.ts hands it the street's rows
 * and the unit tests hand it a fixture. Never a name: the rows carry none.
 */

export type ParcelQuery = {
  /** The house number as typed; digits only, up to eight. */
  number: string;
  /** The street as typed, with or without a suffix, directional or unit. */
  street: string;
  /** Five digits. Required: a number and a name alone can repeat across towns. */
  zip: string;
};

const HOUSE_NUMBER = /^\s*(\d{1,8})[a-z]?(?:\s+|$)(.*)$/i;
/** A pasted tail: ", Bradenton, FL 34209", " FL 34209", " 34209-1234". */
const TRAILING_STATE_ZIP = /(?:[\s,]+(?:fl|florida))?(?:[\s,]+\d{5}(?:-\d{4})?)?[\s,]*$/i;

/**
 * "9403 9th Ave NW" → { number: "9403", street: "9th Ave NW" }. A pasted
 * full address is cut at the first comma, and a trailing "FL" or ZIP goes
 * too ("9403 9th Ave NW, Bradenton, FL 34209" and "9403 9th Ave NW FL 34209"
 * both give "9th Ave NW"). An ordinal ("9th Ave") is a street, not a
 * number, and a lone number has no street. Anything without a leading
 * number comes back with number "".
 */
export function parseHouseNumber(input: string): { number: string; street: string } {
  const line = (input ?? "").split(",")[0].replace(TRAILING_STATE_ZIP, "").trim();
  const m = line.match(HOUSE_NUMBER);
  if (!m) return { number: "", street: line };
  return { number: m[1], street: m[2].trim() };
}

const UNIT = /(?:#|\b(?:unit|apt|ste|suite))\s*([a-z0-9-]+)\s*$/i;

/** "6810 9th Ave W #204" → "204"; "" when no unit was typed. */
export function parseTypedUnit(input: string): string {
  const m = (input ?? "").match(UNIT);
  return m ? m[1].toUpperCase() : "";
}

/** The typed street without its unit, so "#204" never reaches the street key. */
export function stripTypedUnit(input: string): string {
  return (input ?? "").replace(UNIT, "").trim();
}

/**
 * The qualified sales on the parcel at number + street + ZIP, newest first.
 * The street is matched the way searchByStreet matches it: the typed words
 * as a whole name first, then with one suffix folded, and a typed suffix or
 * directional picks among streets that share a name. A typed unit picks the
 * unit (and nothing comes back when the roll has other units there but not
 * that one); without one, every unit at that number comes back and the
 * caller counts the parcels.
 */
export function matchParcel(rows: Sale[], q: ParcelQuery): Sale[] {
  const number = (q.number ?? "").replace(/\D/g, "");
  const zip = (q.zip ?? "").replace(/\D/g, "").slice(0, 5);
  const unit = parseTypedUnit(q.street ?? "");
  const typed = stripTypedUnit(q.street ?? "");
  if (!number || number.length > 8 || zip.length !== 5 || typed.length < 2) return [];

  const asTyped = streetKey(typed, { stripSuffix: false });
  const folded = streetKey(typed);
  const wanted = parseTypedStreet(typed);
  const keyOf = (r: Sale) => streetKey(r.street, { stripSuffix: false });

  const candidates = rows.filter((r) => r.qualified && r.salePrice > 0 && r.number === number && r.zip === zip);
  let hit = asTyped ? candidates.filter((r) => keyOf(r) === asTyped) : [];
  if (hit.length) {
    // The typed words matched as a whole name (Midnight Pass): the last word is part of the name, not a suffix.
    if (asTyped !== folded) wanted.suffix = "";
  } else if (folded) {
    hit = candidates.filter((r) => keyOf(r) === folded);
  }
  if (!hit.length) return [];

  for (const part of ["suffix", "postdir", "predir"] as const) {
    if (!wanted[part]) continue;
    const same = hit.filter((r) => r[part] === wanted[part]);
    if (same.length) hit = same;
  }
  // A typed unit is the unit: a number whose other units sold is not this
  // parcel's record. Only when the roll carries no unit at all for that
  // number (Manatee leaves it blank on many condos) does the number stand.
  if (unit) {
    const same = hit.filter((r) => r.unit.toUpperCase() === unit);
    hit = same.length ? same : hit.some((r) => r.unit) ? [] : hit;
  }
  return [...hit].sort((a, b) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : 0));
}

/** How many distinct parcels a match spans: more than one means the number has several units on the roll. */
export function parcelCount(rows: Sale[]): number {
  return new Set(rows.map((r) => `${r.county}:${r.parcelId}`)).size;
}

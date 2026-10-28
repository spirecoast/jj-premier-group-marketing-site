/**
 * The subdivision and appraiser-neighborhood names the counties publish,
 * kept on each sales row as the county spells them (upper case, one
 * space), minus the plat-book reference Manatee appends ("PB35/198",
 * "CB30/149"), which is a filing location and not a name. Pure, so the
 * unit tests run it; scripts/sales/ingest.mjs calls it.
 */

const PLAT_REF = /\s*\b(?:PB|CB|DB|OR|ORB|PG|MB)\s*\d+\s*[/-]\s*\d+[A-Z]?\b.*$/;

/** "THE WATCH AT WATERLEFE PH II CB30/149" → "THE WATCH AT WATERLEFE PH II". Empty for a placeholder. */
export function cleanPlaceName(raw) {
  const s = String(raw ?? "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(PLAT_REF, "")
    // A bare "0/0" or "12/34" left at the end is the same filing reference without its book letters.
    .replace(/\s+\d+\s*\/\s*\d+$/, "")
    .replace(/[\s,;:-]+$/, "")
    .trim();
  if (!s) return "";
  // The counties' "no subdivision" and "do not use" codes are not names.
  if (/^(NOT (PART OF|IN) (A )?SUBDIVISION|NO SUBDIVISION|NONE|UNKNOWN|BLANK NBHD.*|ACREAGE|UNPLATTED)$/i.test(s)) return "";
  return s;
}

/** Sarasota's code tables ("Code","Description") as a Map, codes as the parcel rows write them. */
export function codeTable(rows) {
  const m = new Map();
  for (const r of rows) {
    const code = String(r.Code ?? "").trim();
    if (code) m.set(code, cleanPlaceName(r.Description));
  }
  return m;
}

/** A Sarasota subdivision code as the parcel row writes it ("7002") → the table's key ("7002"; "154" → "0154"). */
export const subdivisionCode = (raw) => {
  const s = String(raw ?? "").trim();
  return /^\d+$/.test(s) ? s.padStart(4, "0") : s;
};

/** A Sarasota neighborhood code ("4204.6") → the table's key ("4204.60"). */
export const neighborhoodCode = (raw) => {
  const s = String(raw ?? "").trim();
  const n = Number(s);
  return s && Number.isFinite(n) ? n.toFixed(2) : s;
};

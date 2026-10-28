/**
 * What a Street Watch watches: one street in one ZIP, as the county spells
 * it ("LILAC SKY TER", 34211), or one Atlas place by its slug. Pure, so the
 * form's server check, the digest run and the tests share it.
 */

export type WatchTarget =
  | { kind: "street"; street: string; zip: string; key: string; label: string }
  | { kind: "place"; slug: string; name: string; key: string; label: string };

/** The county's spelling, tidied: upper case, single spaces, letters, digits and the few marks street names use. */
export function countyStreet(s: string): string {
  return (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 .'&/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DIRS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);

/** "LILAC SKY TER" → "Lilac Sky Ter", "69TH ST NW" → "69th St NW", "N TAMIAMI TRL" → "N Tamiami Trl". */
export function streetLabel(s: string): string {
  return countyStreet(s)
    .split(" ")
    .map((w) => (DIRS.has(w) ? w : /^\d/.test(w) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" ");
}

/** A street target, or null when the street or the ZIP isn't usable. */
export function streetTarget(street: string, zip: string): WatchTarget | null {
  const s = countyStreet(street).slice(0, 80);
  const z = (zip || "").trim();
  if (s.length < 2 || !/[A-Z0-9]/.test(s) || !/^\d{5}$/.test(z)) return null;
  return { kind: "street", street: s, zip: z, key: `street:${s}|${z}`, label: `${streetLabel(s)} · ${z}` };
}

/** A place target, or null when the slug isn't one. The name is checked against the catalog by the caller. */
export function placeTarget(slug: string, name: string): WatchTarget | null {
  const s = (slug || "").trim();
  const n = (name || "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) || s.length > 80 || !n) return null;
  return { kind: "place", slug: s, name: n, key: `place:${s}`, label: n };
}

/** Whether a county sale is on a watched street: the street as the county spells it, and the ZIP. */
export function onStreet(target: Extract<WatchTarget, { kind: "street" }>, sale: { predir: string; street: string; suffix: string; postdir: string; zip: string }): boolean {
  if (sale.zip !== target.zip) return false;
  return countyStreet([sale.predir, sale.street, sale.suffix, sale.postdir].filter(Boolean).join(" ")) === target.street;
}

/** Tide Street for a target: the street searched, or the place's area. */
export function tideStreetPath(target: WatchTarget): string {
  return target.kind === "street"
    ? `/sell/sold?${new URLSearchParams({ street: streetLabel(target.street), zip: target.zip })}`
    : `/sell/sold?${new URLSearchParams({ place: target.slug })}`;
}

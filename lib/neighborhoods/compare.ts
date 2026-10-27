import { STATUS_LABEL, TYPE_LABEL, hostOf, titleCase } from "./format";
import { WATER_LABEL } from "./match";
import type { NeighborhoodRecord, NeighborhoodSource } from "./types";

/**
 * The compare page's rows: one per fact the schema holds, read from the
 * full record on the server. Each cell is the value as the source stated it
 * and the source itself (its host and the day it was checked), or "not
 * known yet" when the record has no checked source for it. Pure, so the
 * page and its test read the same thing.
 */

export type CompareCell = {
  /** Absent when the record doesn't hold the fact. */
  value?: string;
  /** A link to put on the value (an association's site, a CDD's page, the official site). */
  href?: string;
  /** Where the fact came from and when it was checked. */
  source?: { host: string; url: string; checked: string };
};

export type CompareRow = { id: string; label: string; cells: CompareCell[] };

/** The source that supports a field, the most recently checked one when several do. */
export function sourceFor(r: NeighborhoodRecord, field: string): NeighborhoodSource | undefined {
  return r.sources
    .filter((s) =>
      s.supports
        .split(",")
        .map((f) => f.trim())
        .some((f) => f === field || f.startsWith(`${field} `) || f.startsWith(`${field}(`) || f.startsWith(`${field}:`) || f.startsWith(`${field}.`)),
    )
    .sort((a, b) => b.checked.localeCompare(a.checked))[0];
}

function cite(r: NeighborhoodRecord, field: string): CompareCell["source"] {
  const s = sourceFor(r, field);
  return s ? { host: hostOf(s.url), url: s.url, checked: s.checked } : undefined;
}

const cell = (r: NeighborhoodRecord, field: string, value: string | null | undefined, href?: string): CompareCell =>
  value ? { value, ...(href ? { href } : {}), source: cite(r, field) } : {};

/** The facts, in the order the detail page lists them, then the four Atlas Match reads. */
export const COMPARE_FACTS: { id: string; label: string; read: (r: NeighborhoodRecord) => CompareCell }[] = [
  { id: "type", label: "Type", read: (r) => cell(r, "type", r.type ? TYPE_LABEL[r.type] : null) },
  { id: "status", label: "Status", read: (r) => cell(r, "status", r.status ? STATUS_LABEL[r.status] : null) },
  { id: "jurisdiction", label: "Jurisdiction", read: (r) => cell(r, "jurisdiction", r.jurisdiction) },
  { id: "county", label: "County", read: (r) => cell(r, "county", r.county ? `${r.county} County` : null) },
  { id: "zips", label: "ZIP", read: (r) => cell(r, "zips", r.zips.length ? r.zips.join(", ") : null) },
  { id: "developer", label: "Developer", read: (r) => cell(r, "developer", r.developer) },
  { id: "builders", label: "Builders selling", read: (r) => cell(r, "activeBuilders", r.activeBuilders.length ? r.activeBuilders.join(", ") : null) },
  { id: "years", label: "Years built", read: (r) => cell(r, "yearsBuilt", r.yearsBuilt) },
  { id: "homes", label: "Home types", read: (r) => cell(r, "homeTypes", r.homeTypes.length ? r.homeTypes.map(titleCase).join(", ") : null) },
  { id: "count", label: "Homes", read: (r) => cell(r, "homeCount", r.homeCount ? r.homeCount.toLocaleString() : null) },
  { id: "gated", label: "Gated", read: (r) => cell(r, "gated", r.gated === null ? null : r.gated ? "Yes" : "No") },
  { id: "hoa", label: "HOA on record", read: (r) => cell(r, "hoa", r.hoa?.name ?? null, r.hoa?.website ?? undefined) },
  { id: "cdd", label: "CDD on record", read: (r) => (r.cdd ? { value: r.cdd.name, href: r.cdd.source, source: cite(r, "cdd") ?? { host: hostOf(r.cdd.source), url: r.cdd.source, checked: latestChecked(r) } } : {}) },
  { id: "water", label: "Water access", read: (r) => cell(r, "waterAccess", r.waterAccess ? WATER_LABEL[r.waterAccess] : null) },
  { id: "evac", label: "Evacuation zone", read: (r) => cell(r, "evacuationZone", r.evacuationZone === null ? null : r.evacuationZone === "none" ? "Outside every zone" : `Zone ${r.evacuationZone}`) },
  { id: "amenities", label: "Amenities per the association or builder", read: (r) => cell(r, "amenities", r.amenities.length ? r.amenities.join(" · ") : null) },
  { id: "site", label: "Official site", read: (r) => cell(r, "officialUrl", r.officialUrl ? hostOf(r.officialUrl) : null, r.officialUrl ?? undefined) },
];

/** The most recent checked date on the record, for a fact whose own source isn't tagged. */
export function latestChecked(r: NeighborhoodRecord): string {
  return r.sources.map((s) => s.checked).sort().at(-1) ?? "";
}

/** Every fact row; a row no place holds is left out, except the four Atlas Match reads, which always show. */
export function compareRows(records: NeighborhoodRecord[]): CompareRow[] {
  const always = new Set(["gated", "hoa", "cdd", "water", "evac"]);
  return COMPARE_FACTS.map((f) => ({ id: f.id, label: f.label, cells: records.map(f.read) })).filter((row) => always.has(row.id) || row.cells.some((c) => c.value));
}

/** "Sep 23, 2026" from a checked date. */
export function checkedLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}, ${y}`;
}

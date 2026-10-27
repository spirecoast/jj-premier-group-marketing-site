import { DESCRIPTION_MAX, DESCRIPTION_MIN, clampDescription } from "@/lib/seo";
import type { NeighborhoodRecord } from "./types";

type Facts = Pick<NeighborhoodRecord, "jurisdiction" | "county" | "gated" | "hoa" | "cdd" | "evacuationZone" | "zips">;

/** "In unincorporated Manatee County." · "In the City of Sarasota." From the record's jurisdiction, else its county. */
function jurisdictionLine(r: Facts): string | undefined {
  const j = r.jurisdiction;
  if (j) {
    if (/^unincorporated /i.test(j)) return `In unincorporated ${j.replace(/^unincorporated /i, "")}.`;
    if (/^(city|town|village) of /i.test(j)) return `In the ${j}.`;
    return `In ${j}.`;
  }
  return r.county ? `In ${r.county} County.` : undefined;
}

/** "Gated, with an HOA and a CDD on record." Only what the record holds with a source; nothing for an unknown. */
function governanceLine(r: Facts): string | undefined {
  const onRecord = [r.hoa?.name ? "an HOA" : null, r.cdd ? "a CDD" : null].filter(Boolean) as string[];
  const record = onRecord.length ? `${onRecord.join(" and ")} on record` : "";
  if (r.gated === true) return record ? `Gated, with ${record}.` : "Gated.";
  if (r.gated === false) return record ? `Not gated, with ${record}.` : "Not gated.";
  return record ? `${record[0]!.toUpperCase()}${record.slice(1)}.` : undefined;
}

function evacuationLine(r: Facts): string | undefined {
  if (!r.evacuationZone) return undefined;
  return r.evacuationZone === "none" ? "Outside every evacuation zone." : `Evacuation zone ${r.evacuationZone}.`;
}

function zipLine(r: Facts): string | undefined {
  const z = r.zips ?? [];
  if (!z.length) return undefined;
  if (z.length === 1) return `ZIP ${z[0]}.`;
  return `ZIPs ${z.slice(0, -1).join(", ")} and ${z[z.length - 1]}.`;
}

/** The last word when the facts run out: where the page lives. */
export const ATLAS_LINE = "On Atlas, from JJ Premier Group.";

/**
 * A place page's search description: its own words (the editorial tagline or the dataset's description),
 * then, while it's shorter than a search result has room for, the facts the page carries from county and
 * district sources, in the order the page lists them, and last where it lives. Nothing is said that the
 * record doesn't hold.
 */
export function placeDescription(base: string, r: Facts | undefined, min = DESCRIPTION_MIN): string {
  // A long description is cut to what a result shows first, so the facts follow what's left of it.
  let out = clampDescription(base.trim());
  if (!/[.!?…]$/.test(out)) out += ".";
  const lines = r ? [jurisdictionLine(r), governanceLine(r), evacuationLine(r), zipLine(r), ATLAS_LINE] : [ATLAS_LINE];
  for (const line of lines) {
    if (out.length >= min) break;
    if (!line) continue;
    // Skip a jurisdiction the words already name ("…in the Manatee County part of Lakewood Ranch").
    const place = line.replace(/^In (?:the |unincorporated )?/, "").replace(/\.$/, "");
    if (out.toLowerCase().includes(place.toLowerCase())) continue;
    // A line that would push the whole past a search result's room is left for the page to say.
    if (out.length + 1 + line.length > DESCRIPTION_MAX) continue;
    out += ` ${line}`;
  }
  return out;
}

type Sourced = Facts & Pick<NeighborhoodRecord, "sources" | "waterAccess">;

/** The source behind a field: the latest-checked one whose `supports` names it. */
function sourceFor(r: Sourced, field: string) {
  return r.sources
    .filter((s) => s.supports.split(",").some((f) => f.trim().toLowerCase().startsWith(field.toLowerCase())))
    .sort((a, b) => a.checked.localeCompare(b.checked))
    .at(-1);
}

/**
 * The page's place facts as schema.org PropertyValue rows (additionalProperty on the Place): gated,
 * HOA, CDD, evacuation zone and water access, each only when the record holds it, with the source's
 * address and the day it was checked. Where no source names the field, the row is left out.
 */
export function placeFactProperties(r: Sourced): Record<string, unknown>[] {
  const rows: [string, string, string | boolean | null | undefined][] = [
    ["Gated", "gated", r.gated],
    ["HOA on record", "hoa", r.hoa?.name ?? null],
    ["CDD on record", "cdd", r.cdd?.name ?? null],
    ["Evacuation zone", "evacuationZone", r.evacuationZone === "none" ? "Outside every evacuation zone" : r.evacuationZone],
    ["Water access", "waterAccess", r.waterAccess],
  ];
  const out: Record<string, unknown>[] = [];
  for (const [name, field, value] of rows) {
    if (value === null || value === undefined) continue;
    const src = sourceFor(r, field);
    if (!src) continue;
    out.push({
      "@type": "PropertyValue",
      name,
      value,
      url: src.url,
      description: `Checked ${src.checked}.`,
    });
  }
  return out;
}

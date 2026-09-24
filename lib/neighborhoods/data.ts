import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import manifest from "../../neighborhood-data/data/manifest.json";
import { toIndexEntry, type IndexEntry } from "./index-format";
import type { NeighborhoodRecord, NeighborhoodSearchEntry } from "./types";

/**
 * Server-side access to neighborhood-data/. The full dataset (8 MB) is read
 * once per process and never sent to the browser; pages get one record, its
 * children and ancestors. The search index is trimmed into IndexEntry rows
 * for the explorer.
 */
const DATA_DIR = path.join(process.cwd(), "neighborhood-data", "data");

/** The dataset's generation date, used to version the index the browser caches. */
export const DATASET_VERSION: string = manifest.generated;

let records: Promise<NeighborhoodRecord[]> | null = null;
let bySlug: Promise<Map<string, NeighborhoodRecord>> | null = null;
let index: Promise<IndexEntry[]> | null = null;

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8")) as T;
}

export function getAllRecords(): Promise<NeighborhoodRecord[]> {
  if (!records) records = readJson<NeighborhoodRecord[]>("neighborhoods.json");
  return records;
}

async function recordMap(): Promise<Map<string, NeighborhoodRecord>> {
  if (!bySlug) bySlug = getAllRecords().then((all) => new Map(all.map((r) => [r.slug, r])));
  return bySlug;
}

export async function getRecord(slug: string): Promise<NeighborhoodRecord | undefined> {
  return (await recordMap()).get(slug);
}

export async function getChildren(slug: string): Promise<NeighborhoodRecord[]> {
  const all = await getAllRecords();
  return all.filter((r) => r.parentSlug === slug).sort((a, b) => a.name.localeCompare(b.name));
}

/** Top-down ancestors: area, then community, for an enclave. */
export async function getAncestors(slug: string): Promise<NeighborhoodRecord[]> {
  const map = await recordMap();
  const out: NeighborhoodRecord[] = [];
  let cur = map.get(slug)?.parentSlug ?? null;
  while (cur && map.has(cur) && out.length < 4) {
    const p = map.get(cur)!;
    out.unshift(p);
    cur = p.parentSlug;
  }
  return out;
}

/** Every slug, for static generation. */
export async function getRecordSlugs(): Promise<string[]> {
  return (await getAllRecords()).map((r) => r.slug);
}

/** Slugs that belong in the sitemap: researched in full. Registry-only pages are noindex. */
export async function getIndexableSlugs(): Promise<string[]> {
  return (await getAllRecords()).filter((r) => r.research === "full").map((r) => r.slug);
}

export function getIndexEntries(): Promise<IndexEntry[]> {
  if (!index) index = readJson<NeighborhoodSearchEntry[]>("neighborhoods.search.json").then((rows) => rows.map(toIndexEntry));
  return index;
}

/** The county page for evacuation zones, from the record's own sources. */
export function evacuationSource(r: NeighborhoodRecord): string | undefined {
  return r.sources.find((s) => /know-your-evacuation/.test(s.url))?.url;
}

/** The latest checked date among sources that support a field, for "as of" lines. */
export function checkedDate(r: NeighborhoodRecord, field: string): string | undefined {
  const dates = r.sources.filter((s) => s.supports.split(",").some((f) => f.trim().startsWith(field))).map((s) => s.checked);
  return dates.sort().at(-1);
}

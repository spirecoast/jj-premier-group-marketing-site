import "server-only";
import { getNeighborhoods, getPosts, getUpcomingEvents, getVenues } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { isRebuiltGuide } from "@/lib/guides/slugs";
import { HUBS } from "@/lib/hubs/copy";
import { getAllRecords } from "@/lib/neighborhoods/data";
import { DIFFERENT, FAQS, FAQ_SECTION, FROM_AWAY } from "@/lib/relocate/copy";
import { TIDE_ISSUES } from "@/lib/tide/issues";
import { loadIssueModel } from "@/lib/tide/load";
import { PAGE_SUMMARIES } from "./copy";
import { assertUniqueIds, eventChunk, guideChunks, hubChunks, pageChunks, placeChunks, postChunks, relocateChunks, tideChunks, venueChunk } from "./sources";
import type { Chunk } from "./types";

/**
 * Every chunk the site has, read through the same data layer the pages use.
 * The indexer embeds these; the fallback search reads them when the database
 * or the Edge Function is down. Each source is loaded on its own, so one
 * failing (say, the county sales data for Tide) costs only its own chunks.
 */
export async function loadAllChunks(): Promise<{ chunks: Chunk[]; errors: string[] }> {
  const errors: string[] = [];
  const safe = async <T>(name: string, f: () => Promise<T[]> | T[]): Promise<T[]> => {
    try {
      return await f();
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };

  const [guides, places, posts, tide, encore, pages] = await Promise.all([
    safe("guides", () => GUIDES.flatMap(guideChunks)),
    safe("neighborhoods", async () => {
      const [records, editorial] = await Promise.all([getAllRecords(), getNeighborhoods()]);
      const bySlug = new Map(records.map((r) => [r.slug, r]));
      const editorialBySlug = new Map(editorial.map((n) => [n.slug, n]));
      const slugs = [...new Set([...editorial.map((n) => n.slug), ...records.filter((r) => r.research === "full").map((r) => r.slug)])];
      return slugs.flatMap((slug) => {
        const record = bySlug.get(slug);
        const parentName = record?.parentSlug ? bySlug.get(record.parentSlug)?.name : undefined;
        return placeChunks({ slug, record, parentName, editorial: editorialBySlug.get(slug) });
      });
    }),
    safe("posts", async () => (await getPosts()).filter((p) => !isRebuiltGuide(p.slug)).flatMap(postChunks)),
    safe("tide", async () => {
      const models = await Promise.all(TIDE_ISSUES.map((e) => loadIssueModel(e.issue)));
      return models.flatMap((m) => (m ? tideChunks(m) : []));
    }),
    safe("encore", async () => {
      const [events, venues] = await Promise.all([getUpcomingEvents(), getVenues()]);
      return [...events.map(eventChunk), ...venues.map((v) => venueChunk(v, events))];
    }),
    safe("pages", () => [
      ...pageChunks(PAGE_SUMMARIES),
      ...Object.values(HUBS).flatMap(hubChunks),
      ...relocateChunks({ different: DIFFERENT, fromAway: FROM_AWAY, faqs: FAQS, faqTitle: FAQ_SECTION.title }),
    ]),
  ]);

  const chunks = [...pages, ...guides, ...places, ...posts, ...tide, ...encore];
  assertUniqueIds(chunks);
  return { chunks, errors };
}

let cached: { at: number; value: Promise<Chunk[]> } | null = null;
const CHUNK_CACHE_MS = 60 * 60 * 1000;

/** The chunks for the in-memory fallback, built once an hour per server process. */
export function getChunksCached(): Promise<Chunk[]> {
  if (!cached || Date.now() - cached.at > CHUNK_CACHE_MS) {
    const value = loadAllChunks().then((r) => {
      if (r.errors.length) console.warn("[search] chunk sources failed:", r.errors.join("; "));
      return r.chunks;
    });
    value.catch(() => {
      cached = null;
    });
    cached = { at: Date.now(), value };
  }
  return cached.value;
}

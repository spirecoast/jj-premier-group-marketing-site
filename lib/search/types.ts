/**
 * Site search: shared shapes. No imports, so client components, tests and
 * scripts can all use them.
 */

/** What a chunk is. Stored in search_documents.kind (0010_search.sql checks the list). */
export type SearchKind = "guide" | "neighborhood" | "post" | "event" | "venue" | "page";

export const SEARCH_KINDS: readonly SearchKind[] = ["guide", "neighborhood", "post", "event", "venue", "page"];

/** How a kind is labelled on the results page: the site's own names. */
export const KIND_LABEL: Record<SearchKind, string> = {
  guide: "Guide",
  neighborhood: "Neighborhood",
  post: "Tide",
  event: "Encore",
  venue: "Encore",
  page: "Page",
};

/**
 * One searchable piece of the site: a guide section, a neighborhood, part of a
 * Tide issue, an Encore event or venue, a main page. `id` is stable across
 * runs ("guide:<slug>#<section>"), `url` is where the reader lands, with the
 * section's #anchor when it has one.
 */
export type Chunk = {
  id: string;
  kind: SearchKind;
  title: string;
  sectionTitle?: string;
  url: string;
  body: string;
};

/** One result as the API and the page see it. `snippet` carries highlight markers (see HIGHLIGHT). */
export type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  section: string | null;
  url: string;
  snippet: string;
  score: number;
};

/** "hybrid": Postgres full text + pgvector, fused. "keyword": the in-memory fallback. */
export type SearchSource = "hybrid" | "keyword";

export type SearchResponse = { q: string; source: SearchSource; results: SearchHit[] };

/**
 * Highlight markers inside a snippet: private-use characters that never occur
 * in the content, set by ts_headline in search_scored() and by the fallback.
 * The page splits on them and wraps the marked runs in <mark>, so no HTML
 * ever travels in a snippet.
 */
export const HIGHLIGHT = { start: "\uE000", stop: "\uE001" } as const;

/** The Plausible `Search` goal's `results` prop: a bucket, never the query (it could hold a name or an address). */
export function resultsBucket(n: number): "0" | "1-3" | "4-9" | "10+" {
  return n <= 0 ? "0" : n <= 3 ? "1-3" : n <= 9 ? "4-9" : "10+";
}

/** At most this many results from one page, so one long guide doesn't fill the list. */
export const MAX_PER_PAGE = 3;

/**
 * A filter for a ranked list (best first): drops later parts of a chunk
 * already kept ("…~2") and anything past MAX_PER_PAGE from the same page.
 */
export function variedResults(): (hit: { id: string; url: string }) => boolean {
  const chunks = new Set<string>();
  const pages = new Map<string, number>();
  return ({ id, url }) => {
    const base = id.replace(/~\d+$/, "");
    const page = url.replace(/#.*$/, "");
    const n = pages.get(page) ?? 0;
    if (chunks.has(base) || n >= MAX_PER_PAGE) return false;
    chunks.add(base);
    pages.set(page, n + 1);
    return true;
  };
}

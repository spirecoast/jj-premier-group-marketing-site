import { contentHash, embeddingText } from "./text";
import type { Chunk } from "./types";

/**
 * Keeps search_documents in step with the site's content.
 *
 *   1. Compare the chunks with what's stored, by id and content hash.
 *   2. Delete rows whose ids no longer exist (a guide section renamed, an
 *      event that ended, the `test:` rows from setup).
 *   3. Embed new and changed chunks through the `embed` function, a group at
 *      a time, and upsert each group as soon as it's done, so a run that
 *      stops at its deadline keeps everything it finished and the next run
 *      picks up the rest.
 *
 * The store is an interface so this runs against Postgres in production
 * (lib/search/store.ts) and an in-memory map in the tests.
 */

export type StoredRow = { id: string; contentHash: string; hasEmbedding: boolean };

export type WriteRow = Chunk & { contentHash: string; embedding: number[] };

export interface SearchStore {
  existing(): Promise<StoredRow[]>;
  upsert(rows: WriteRow[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

export type ReindexPlan = { toWrite: Chunk[]; unchanged: number; toDelete: string[] };

/** What needs doing. A row without an embedding counts as changed, so a failed run heals itself. */
export function planReindex(existing: StoredRow[], chunks: Chunk[]): ReindexPlan {
  const stored = new Map(existing.map((r) => [r.id, r]));
  const ids = new Set(chunks.map((c) => c.id));
  const toWrite: Chunk[] = [];
  let unchanged = 0;
  for (const c of chunks) {
    const row = stored.get(c.id);
    if (row && row.hasEmbedding && row.contentHash === contentHash(c)) unchanged += 1;
    else toWrite.push(c);
  }
  const toDelete = existing.filter((r) => !ids.has(r.id)).map((r) => r.id);
  return { toWrite, unchanged, toDelete };
}

export type ReindexResult = {
  chunks: number;
  unchanged: number;
  written: number;
  deleted: number;
  /** Chunks still to embed when the run hit its deadline. Run again until 0. */
  remaining: number;
  /** True when deletes were held back (see `allowDeletes`). */
  deletesSkipped: boolean;
  ms: number;
};

export type ReindexOptions = {
  store: SearchStore;
  chunks: Chunk[];
  embed: (texts: string[]) => Promise<number[][]>;
  /** Stop starting new groups after this time (epoch ms). */
  deadline?: number;
  /** Chunks embedded and written per group. */
  groupSize?: number;
  /**
   * False skips deletes, e.g. when a content source failed to load and its
   * chunks are missing from this run rather than gone from the site. Deletes
   * are also held back when the run has fewer than half the stored rows,
   * unless `force` is set.
   */
  allowDeletes?: boolean;
  force?: boolean;
  log?: (msg: string) => void;
};

export async function reindex(o: ReindexOptions): Promise<ReindexResult> {
  const started = Date.now();
  const log = o.log ?? (() => {});
  const existing = await o.store.existing();
  const plan = planReindex(existing, o.chunks);
  log(`${o.chunks.length} chunks: ${plan.unchanged} unchanged, ${plan.toWrite.length} to embed, ${plan.toDelete.length} to delete`);

  const shrinking = existing.length > 0 && o.chunks.length < existing.length / 2;
  const deletesSkipped = plan.toDelete.length > 0 && (o.allowDeletes === false || (shrinking && !o.force));
  let deleted = 0;
  if (plan.toDelete.length && !deletesSkipped) {
    for (let i = 0; i < plan.toDelete.length; i += 500) {
      const ids = plan.toDelete.slice(i, i + 500);
      await o.store.remove(ids);
      deleted += ids.length;
    }
    log(`deleted ${deleted}`);
  } else if (deletesSkipped) {
    log(`held back ${plan.toDelete.length} deletes (${o.allowDeletes === false ? "a source failed to load" : "the run has under half the stored rows; pass force to delete"})`);
  }

  const group = o.groupSize ?? 48;
  let written = 0;
  for (let i = 0; i < plan.toWrite.length; i += group) {
    if (o.deadline && Date.now() > o.deadline) break;
    const batch = plan.toWrite.slice(i, i + group);
    const vectors = await o.embed(batch.map(embeddingText));
    await o.store.upsert(batch.map((c, j) => ({ ...c, contentHash: contentHash(c), embedding: vectors[j]! })));
    written += batch.length;
    log(`wrote ${written}/${plan.toWrite.length}`);
  }

  return {
    chunks: o.chunks.length,
    unchanged: plan.unchanged,
    written,
    deleted,
    remaining: plan.toWrite.length - written,
    deletesSkipped,
    ms: Date.now() - started,
  };
}

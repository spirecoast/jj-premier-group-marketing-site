import "server-only";
import { getDb } from "@/lib/db";
import { embedConfig, embedTexts } from "./embed";
import { reindex, type ReindexResult } from "./indexer";
import { loadAllChunks } from "./load";
import { drizzleStore } from "./store";

/**
 * One reindex run: load every chunk, then bring search_documents in step
 * (lib/search/indexer.ts). Shared by POST /api/search/reindex, the daily cron
 * and scripts/index-search.ts.
 */
export async function runReindex(opts: { deadline?: number; force?: boolean; log?: (m: string) => void } = {}): Promise<ReindexResult & { sourceErrors: string[] }> {
  const config = embedConfig();
  if (!config) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are needed to reach the embed function");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const { chunks, errors } = await loadAllChunks();
  if (errors.length) opts.log?.(`sources that failed to load: ${errors.join("; ")}`);
  const result = await reindex({
    store: drizzleStore(getDb()),
    chunks,
    embed: (texts) => embedTexts(texts, { config, batchSize: 16, concurrency: 4 }),
    deadline: opts.deadline,
    // A source that failed to load is missing from this run, not gone from the site.
    allowDeletes: errors.length === 0,
    force: opts.force,
    log: opts.log,
  });
  return { ...result, sourceErrors: errors };
}

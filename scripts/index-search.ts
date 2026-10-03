/**
 * Build or refresh the site search index from the command line.
 *
 *   npm run search:index                  embed what changed and write it (needs DATABASE_URL
 *                                         and the Supabase URL + anon key, from the env or .env.local)
 *   npm run search:index -- --dry-run     list the chunks and their sizes; no database, no embedding
 *   npm run search:index -- --dump out.json   write every chunk to a file (with --dry-run)
 *   npm run search:index -- --force       let deletes through even if the run has under half the rows
 *
 * The same run is POST /api/search/reindex (and the daily cron). Run this where
 * Postgres is reachable; it has no deadline, so the first full index finishes
 * in one go.
 */
import { existsSync, writeFileSync } from "node:fs";
import { loadAllChunks } from "@/lib/search/load";
import { runReindex } from "@/lib/search/run";
import { CHUNK_WORDS, embeddingText, wordCount } from "@/lib/search/text";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main() {
  if (flag("dry-run")) {
    const { chunks, errors } = await loadAllChunks();
    const byKind = new Map<string, number>();
    for (const c of chunks) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);
    const words = chunks.map((c) => wordCount(c.body)).sort((a, b) => a - b);
    const pct = (p: number) => words[Math.min(words.length - 1, Math.floor((p / 100) * words.length))];
    console.log(`${chunks.length} chunks`, Object.fromEntries(byKind));
    console.log(`words per chunk: min ${words[0]}, p10 ${pct(10)}, median ${pct(50)}, p90 ${pct(90)}, max ${words[words.length - 1]} (target ${CHUNK_WORDS.min}–${CHUNK_WORDS.max})`);
    console.log(`embedding text: max ${Math.max(...chunks.map((c) => embeddingText(c).length))} characters`);
    if (errors.length) console.warn("sources that failed:", errors);
    const out = value("dump");
    if (out) {
      writeFileSync(out, JSON.stringify(chunks, null, 2));
      console.log(`wrote ${out}`);
    }
    return;
  }
  const result = await runReindex({ force: flag("force"), log: (m) => console.log(m) });
  console.log(JSON.stringify(result, null, 2));
  if (result.sourceErrors.length) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

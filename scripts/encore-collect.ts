/**
 * Encore's collector from the command line.
 *
 *   npx tsx --conditions=react-server scripts/encore-collect.ts <command> [options]
 *
 * Commands
 *   seed       load lib/content/encore/encore-calendar.json into the store (adds what is missing, changes nothing else)
 *   collect    the weekly refresh: every due source (or --only), then images
 *   check      the daily status/price check of the next 21 days
 *   review     print the review queue
 *   status     sources, last runs, queue size
 *
 * Store
 *   --db                 the encore_* tables over DATABASE_URL (default when DATABASE_URL is set)
 *   --file <path>        a JSON snapshot instead (local runs; ENCORE_SNAPSHOT_FILE points the site at it)
 *
 * Options
 *   --only a,b           these source ids, due or not
 *   --minutes <n>        stop starting new work after n minutes (default 20)
 *   --images <dir>       store images in <dir> (served at /encore-local when <dir> is public/encore-local)
 *                        default with --db: Supabase Storage (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */
import data from "../lib/content/encore/encore-calendar.json";
import type { DatasetEvent, DatasetVenue } from "../lib/encore/collect/known";
import { folderSink, supabaseSink, type ImageSink } from "../lib/encore/collect/images";
import { runCollector } from "../lib/encore/collect/run";
import { SOURCES, sourceForUrl } from "../lib/encore/collect/sources";
import { fileStore } from "../lib/encore/store/file";
import type { EncoreStore } from "../lib/encore/store/store";

const args = process.argv.slice(2);
const command = args[0] ?? "status";
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const flag = (n: string) => args.includes(n);

async function useProxy() {
  if (!process.env.HTTPS_PROXY && !process.env.https_proxy) return;
  // Node's fetch ignores HTTPS_PROXY; sandboxes that reach the web only through one need this.
  const undici = (await import("undici" as string)) as { setGlobalDispatcher: (d: unknown) => void; EnvHttpProxyAgent: new () => unknown };
  undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
}

async function openStore(): Promise<EncoreStore> {
  const file = opt("--file");
  if (file) return fileStore(file);
  if (!process.env.DATABASE_URL) throw new Error("Pass --file <path> or set DATABASE_URL");
  const [{ getDb }, { pgStore }] = await Promise.all([import("../lib/db"), import("../lib/encore/store/pg")]);
  return pgStore(getDb());
}

function imageSink(store: EncoreStore): ImageSink | null {
  const dir = opt("--images");
  if (dir) return folderSink(dir, dir.replace(/^.*?public\//, "/"));
  if (store.kind === "pg" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    return supabaseSink({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
  return null;
}

export const sourceOfEvent = (e: DatasetEvent) => (sourceForUrl(e.sources[0]) ?? sourceForUrl(e.ticketUrl))?.id;

async function main() {
  await useProxy();
  const store = await openStore();
  const log = (m: string) => console.log(m);
  if (command === "seed") {
    const counts = await store.seed(data as unknown as { venues: DatasetVenue[]; events: DatasetEvent[] }, SOURCES, sourceOfEvent);
    console.log(JSON.stringify(counts));
  } else if (command === "collect" || command === "check") {
    const minutes = Number(opt("--minutes") ?? 20);
    const only = opt("--only")?.split(",").filter(Boolean);
    const runId = await store.startRun(command);
    const result = await runCollector({ store, mode: command, deadline: Date.now() + minutes * 60_000, images: command === "collect" ? imageSink(store) : null, only, log });
    await store.finishRun(runId, { sources: result.processed.length, remaining: result.remaining, stats: result as unknown as Record<string, unknown> });
    console.log(JSON.stringify({ processed: result.processed.length, failed: result.processed.filter((p) => !p.ok).map((p) => `${p.id}: ${p.error}`), remaining: result.remaining, images: result.images, remainingImages: result.remainingImages, requests: result.requests }, null, 1));
  } else if (command === "review") {
    for (const r of await store.review("pending", 500)) console.log(`${r.firstDate ?? "?"}  ${r.kind.padEnd(9)} ${r.sourceId.padEnd(28)} ${r.title}${r.note ? `  (${r.note})` : ""}`);
  } else {
    const sources = await store.sources();
    for (const s of sources) console.log(`${s.id.padEnd(32)} ${s.adapter.padEnd(12)} ok ${s.lastOkAt ?? "never"}  ${s.lastError ? `error: ${s.lastError}` : ""}`);
    console.log(`pending review: ${(await store.review("pending", 5000)).length}`);
  }
  if (!flag("--keep-open")) process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

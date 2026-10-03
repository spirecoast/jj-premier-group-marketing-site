/**
 * Run Encore adapters live against their real sources and report what they
 * found against the hand-collected dataset, per source: events and
 * performances found, how many of the dataset's upcoming events (and dates)
 * were matched. Writes nothing to the database.
 *
 *   npx tsx scripts/encore-probe.ts                 every automated source
 *   npx tsx scripts/encore-probe.ts van-wezel tnew  sources by id or adapter
 *   --check            run in check mode (statuses only)
 *   --json <file>      write the full report
 *   --record <dir>     save every response (url → file) for fixtures
 *   --replay <dir>     read responses from a --record directory instead of the web
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import data from "../lib/content/encore/encore-calendar.json";
import { ADAPTERS } from "../lib/encore/collect/adapters";
import { todayLocal } from "../lib/encore/collect/dates";
import { politeFetcher } from "../lib/encore/collect/http";
import { knownEvents, knownForSource, knownVenues, type DatasetEvent, type DatasetVenue } from "../lib/encore/collect/known";
import { buildMatcher } from "../lib/encore/collect/match";
import { SOURCES } from "../lib/encore/collect/sources";
import type { Fetcher } from "../lib/encore/collect/types";
import { sha256 } from "../lib/encore/collect/util";

async function useProxy() {
  if (!process.env.HTTPS_PROXY && !process.env.https_proxy) return;
  // Node's fetch ignores HTTPS_PROXY; this sandbox only reaches the web through it.
  const undici = (await import("undici" as string)) as { setGlobalDispatcher: (d: unknown) => void; EnvHttpProxyAgent: new () => unknown };
  undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
}

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const wanted = args.filter((a, i) => !a.startsWith("--") && !["--json", "--record", "--replay"].includes(args[i - 1] ?? ""));

const dataset = data as unknown as { events: DatasetEvent[]; venues: DatasetVenue[] };
const today = todayLocal();

function record(fetcher: Fetcher, dir: string): Fetcher {
  mkdirSync(dir, { recursive: true });
  const index: Record<string, { file: string; status: number }> = {};
  return async (url, o) => {
    const r = await fetcher(url, o);
    const key = o?.method === "POST" ? `POST ${url} ${o.body ?? ""}` : url;
    const file = `${sha256(key).slice(0, 12)}.txt`;
    writeFileSync(join(dir, file), r.text);
    index[key] = { file, status: r.status };
    writeFileSync(join(dir, "index.json"), JSON.stringify(index, null, 1));
    return r;
  };
}

function replay(dir: string): Fetcher {
  const index = existsSync(join(dir, "index.json")) ? (JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as Record<string, { file: string; status: number }>) : {};
  return async (url, o) => {
    const key = o?.method === "POST" ? `POST ${url} ${o.body ?? ""}` : url;
    const hit = index[key] ?? Object.entries(index).find(([k]) => k.startsWith(`POST ${url}`))?.[1];
    if (!hit) return { url, status: 404, ok: false, text: "", headers: {} };
    return { url, status: hit.status, ok: hit.status < 400, text: readFileSync(join(dir, hit.file), "utf8"), headers: {} };
  };
}

async function main() {
  await useProxy();
  const sources = SOURCES.filter((s) => s.adapter !== "manual" && (!wanted.length || wanted.includes(s.id) || wanted.includes(s.adapter)));
  const matcher = buildMatcher(knownEvents(dataset.events), knownVenues(dataset.venues));
  const fetcher = politeFetcher();
  const rows: Record<string, unknown>[] = [];
  await Promise.all(
    sources.map(async (source) => {
      const adapter = ADAPTERS[source.adapter]!;
      const known = knownForSource(source, dataset.events);
      const upcomingKnown = dataset.events.filter((e) => known.some((k) => k.slug === e.slug) && e.status !== "announced" && [...e.performances.map((p) => p.date), e.endDate ?? e.startDate].some((d) => d && d >= today));
      const f = opt("--replay") ? replay(join(opt("--replay")!, source.id)) : opt("--record") ? record(fetcher, join(opt("--record")!, source.id)) : fetcher;
      const started = Date.now();
      try {
        const res = await adapter.collect(source, { fetch: f, known, mode: flag("--check") ? "check" : "collect", today, log: () => {} });
        const taken = new Set<string>();
        const matched: { slug: string; title: string; via: string; perfs: number }[] = [];
        const unmatched: string[] = [];
        let perfHits = 0;
        for (const e of res.events) {
          const m = matcher.match(e, taken);
          if (m) {
            taken.add(m.slug);
            const k = dataset.events.find((x) => x.slug === m.slug)!;
            const hit = k.performances.filter((p) => p.date >= today && e.performances.some((q) => q.date === p.date)).length;
            perfHits += hit;
            matched.push({ slug: m.slug, title: e.title, via: m.via, perfs: hit });
          } else unmatched.push(`${e.title} (${e.performances[0]?.date ?? e.startDate ?? "?"})`);
        }
        const knownSlugs = new Set(upcomingKnown.map((e) => e.slug));
        const coveredKnown = matched.filter((m) => knownSlugs.has(m.slug)).length;
        const knownPerfs = upcomingKnown.reduce((n, e) => n + e.performances.filter((p) => p.date >= today).length, 0);
        const row = {
          source: source.id,
          adapter: source.adapter,
          ok: true,
          seconds: Math.round((Date.now() - started) / 1000),
          found: res.events.length,
          foundPerfs: res.events.reduce((n, e) => n + e.performances.length, 0),
          withImage: res.events.filter((e) => e.imageUrl).length,
          knownUpcoming: upcomingKnown.length,
          matchedKnown: coveredKnown,
          coverage: upcomingKnown.length ? Math.round((coveredKnown / upcomingKnown.length) * 100) : null,
          knownPerfs,
          perfHits,
          perfCoverage: knownPerfs ? Math.round((perfHits / knownPerfs) * 100) : null,
          matchedOther: matched.length - coveredKnown,
          newCandidates: unmatched.length,
          warnings: res.warnings,
          missing: upcomingKnown.filter((e) => !matched.some((m) => m.slug === e.slug)).map((e) => e.title),
          unmatched,
          sample: flag("--verbose") ? res.events.slice(0, 40) : undefined,
        };
        rows.push(row);
        console.log(
          `${source.id.padEnd(30)} ${String(row.found).padStart(4)} ev ${String(row.foundPerfs).padStart(4)} perf | known ${String(row.matchedKnown).padStart(3)}/${String(row.knownUpcoming).padEnd(3)} ${String(row.coverage ?? "-").padStart(3)}% | perfs ${row.perfHits}/${row.knownPerfs} | new ${row.newCandidates} | img ${row.withImage}${res.warnings.length ? ` | ${res.warnings.length} warnings` : ""} (${row.seconds}s)`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        rows.push({ source: source.id, adapter: source.adapter, ok: false, error: message, knownUpcoming: upcomingKnown.length });
        console.log(`${source.id.padEnd(30)} FAILED: ${message}`);
      }
    }),
  );
  if (opt("--json")) writeFileSync(opt("--json")!, JSON.stringify(rows, null, 1));
  console.log(`requests: ${(fetcher as unknown as { requests: () => number }).requests()}`);
}

void main();

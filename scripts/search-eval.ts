/**
 * The site-search eval: run every query in lib/search/eval/queries.json
 * through the live index and report hit@1, hit@3, MRR and the noise
 * false-positive rate, for the tuning two-thirds and the held-out third.
 *
 *   npm run search:eval                       search_scored() as configured (SCORING), plus
 *                                             keyword-only and, while it exists, the old RRF
 *                                             search_hybrid() for comparison
 *   npm run search:eval -- --verbose          also each query's top three and the rank of its answer
 *   npm run search:eval -- --set minScore=0.18 --set semanticWeight=0.75
 *                                             try other settings (any key of SCORING)
 *   npm run search:eval -- --grid             sweep semanticWeight x cosFloor x minScore and list
 *                                             the best settings by tuning MRR with no noise results
 *   npm run search:eval -- --json out.json    write every query's result ids too
 *
 * Needs DATABASE_URL (Postgres must be reachable from where it runs) and the
 * Supabase URL + anon key for the `embed` Edge Function, from the env or
 * .env.local. Read-only: it never writes to the database.
 *
 * Re-tuning: change the labels only from what the index holds, never from
 * what a method returned; tune on the tuning split; read the holdout once at
 * the end. When the numbers move, change SCORING in lib/search/query.ts and
 * the defaults in a new migration together.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { embedConfig, embedTexts } from "@/lib/search/embed";
import { checkEvalSet, firstRelevantRank, isHoldout, summarizeSplits, type EvalSet, type QueryOutcome, type Summary } from "@/lib/search/eval/metrics";
import { SCORING, SQL_ROWS, rowsToHits, scoredSql, vectorLiteral, type ScoredRow, type ScoringSettings } from "@/lib/search/query";

for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const values = (name: string) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]!] : []));

const set = JSON.parse(readFileSync("lib/search/eval/queries.json", "utf8")) as EvalSet;
const problems = checkEvalSet(set);
if (problems.length) throw new Error(`queries.json: ${problems.join("; ")}`);

const overrides: Partial<ScoringSettings> = {};
for (const kv of values("set")) {
  const [k, v] = kv.split("=");
  if (!k || !(k in SCORING) || !Number.isFinite(Number(v))) throw new Error(`--set ${kv}: expected one of ${Object.keys(SCORING).join(", ")} = a number`);
  overrides[k as keyof ScoringSettings] = Number(v);
}

type Method = { name: string; run: (q: string, embedding: number[]) => Promise<ScoredRow[]> };

const db = getDb();
const exec = async (query: SQL) => (await db.execute(query)) as unknown as ScoredRow[];

/** The pipeline before 0011: RRF in search_hybrid() plus the noise rule the app applied on top. */
const rrf = (q: string, embedding: number[]) => {
  const vec = vectorLiteral(embedding);
  return exec(
    sql`with h as (select * from public.search_hybrid(${q}, ${vec}::extensions.vector(384), 30, 1::float, 1::float, 50, 0.8::float)) select id, kind, title, section_title, url, snippet, score from h where exists (select 1 from h where keyword_rank is not null) or (select max(1 - (d.embedding operator(extensions.<=>) ${vec}::extensions.vector(384))) from public.search_documents d join h on h.id = d.id) >= 0.83 order by score desc`,
  );
};

const scored =
  (o: Partial<ScoringSettings>, keywordOnly = false) =>
  (q: string, embedding: number[]) =>
    exec(scoredSql({ q, embedding: keywordOnly ? null : embedding, ...o, matchCount: SQL_ROWS }));

/** What the page would show: the per-page cap, then ten. */
const shown = (rows: ScoredRow[]) => rowsToHits(rows, (s) => s).slice(0, SCORING.matchCount);

async function evaluate(method: Method, embeddings: number[][]): Promise<QueryOutcome[]> {
  const out: QueryOutcome[] = [];
  for (const [i, query] of set.queries.entries()) {
    const ids = shown(await method.run(query.q, embeddings[i]!)).map((h) => h.id);
    out.push({ query, holdout: isHoldout(i), ids, firstRank: firstRelevantRank(ids, query.expect) });
  }
  return out;
}

const pct = (x: number) => x.toFixed(3);
function row(name: string, split: string, s: Summary) {
  return [name.padEnd(22), split.padEnd(8), String(s.queries).padStart(3), pct(s.hitAt1), pct(s.hitAt3), pct(s.mrr), pct(s.noAnswer), `${pct(s.noiseFalsePositive)} (${s.noiseQueries})`].join("  ");
}

async function grid(embeddings: number[][]) {
  // minScore is applied here, so one run per (weight, floor) covers every threshold.
  const thresholds = Array.from({ length: 13 }, (_, i) => 0.12 + i * 0.02);
  const results: { w: number; floor: number; t: number; tune: Summary; holdout: Summary }[] = [];
  for (const w of [0.6, 0.7, 0.75, 0.8, 0.85, 0.9]) {
    for (const floor of [0.8, 0.81, 0.82, 0.83]) {
      const all: { i: number; rows: ScoredRow[] }[] = [];
      for (const [i, query] of set.queries.entries()) all.push({ i, rows: await scored({ ...overrides, semanticWeight: w, cosFloor: floor, minScore: 0 })(query.q, embeddings[i]!) });
      for (const t of thresholds) {
        const outcomes = all.map(({ i, rows }) => {
          const ids = shown(rows.filter((r) => Number(r.score) >= t - 1e-9)).map((h) => h.id);
          return { query: set.queries[i]!, holdout: isHoldout(i), ids, firstRank: firstRelevantRank(ids, set.queries[i]!.expect) };
        });
        const s = summarizeSplits(outcomes);
        results.push({ w, floor, t, tune: s.tune, holdout: s.holdout });
      }
    }
  }
  const best = results.filter((r) => r.tune.noiseFalsePositive === 0).sort((a, b) => b.tune.mrr - a.tune.mrr || b.tune.hitAt1 - a.tune.hitAt1);
  console.log("\nweight  floor  minScore  | tune: hit@1  hit@3  MRR   | holdout: hit@1  hit@3  MRR  noiseFP");
  for (const r of best.slice(0, 20)) {
    console.log(
      `${r.w.toFixed(2).padEnd(7)} ${r.floor.toFixed(2).padEnd(6)} ${r.t.toFixed(2).padEnd(9)} |       ${pct(r.tune.hitAt1)}  ${pct(r.tune.hitAt3)}  ${pct(r.tune.mrr)} |          ${pct(r.holdout.hitAt1)}  ${pct(r.holdout.hitAt3)}  ${pct(r.holdout.mrr)}  ${pct(r.holdout.noiseFalsePositive)}`,
    );
  }
  console.log("\nPick from a plateau, not a peak: a setting whose neighbours score the same is less likely to be fitted to these 50 queries.");
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (the eval runs against the live index)");
  const config = embedConfig();
  if (!config) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are needed to embed the queries");
  const embeddings = await embedTexts(
    set.queries.map((q) => q.q),
    { config },
  );

  if (flag("grid")) return grid(embeddings);

  const methods: Method[] = [{ name: "rrf (search_hybrid)", run: rrf }, { name: "scored", run: scored(overrides) }, { name: "scored, keyword-only", run: scored(overrides, true) }];
  console.log(`${set.queries.length} queries; settings ${JSON.stringify({ ...SCORING, ...overrides })}\n`);
  console.log(["method".padEnd(22), "split".padEnd(8), "  n", "hit@1", "hit@3", "  MRR", "no-ans", "noise FP"].join("  "));
  const dump: Record<string, QueryOutcome[]> = {};
  for (const m of methods) {
    let outcomes: QueryOutcome[];
    try {
      outcomes = await evaluate(m, embeddings);
    } catch (err) {
      console.log(`${m.name.padEnd(22)}  skipped: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    dump[m.name] = outcomes;
    const s = summarizeSplits(outcomes);
    for (const split of ["all", "tune", "holdout"] as const) console.log(row(m.name, split, s[split]));
    if (flag("verbose")) {
      for (const o of outcomes) console.log(`    ${o.query.id.padEnd(22)} rank ${String(o.firstRank ?? "-").padStart(2)}  ${o.ids.slice(0, 3).join(", ") || "(nothing)"}`);
    }
  }
  const json = values("json")[0];
  if (json) writeFileSync(json, JSON.stringify(dump, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

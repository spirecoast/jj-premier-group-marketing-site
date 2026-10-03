/**
 * Scoring for the search eval (lib/search/eval/queries.json, run by
 * scripts/search-eval.ts). Pure: the script does the I/O.
 */

export type EvalQuery = {
  id: string;
  type: "keyword" | "place" | "typo" | "paraphrase" | "noise";
  q: string;
  /** Chunk ids that count as a right answer; "*" matches anything. Empty for noise. */
  expect: string[];
};

export type EvalSet = { about: string; queries: EvalQuery[] };

/** Every third query (index 2, 5, 8, …) was held out while tuning. */
export const isHoldout = (index: number) => index % 3 === 2;

const patternCache = new Map<string, RegExp>();
function pattern(p: string): RegExp {
  let re = patternCache.get(p);
  if (!re) {
    re = new RegExp(`^${p.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
    patternCache.set(p, re);
  }
  return re;
}

/** Whether a result id is a right answer; a later part of a chunk ("…~2") counts as the chunk. */
export function matchesExpect(id: string, expect: string[]): boolean {
  const base = id.replace(/~\d+$/, "");
  return expect.some((p) => pattern(p).test(base));
}

/** 1-based rank of the first right answer in a result list, or null. */
export function firstRelevantRank(ids: string[], expect: string[]): number | null {
  const i = ids.findIndex((id) => matchesExpect(id, expect));
  return i < 0 ? null : i + 1;
}

export type QueryOutcome = { query: EvalQuery; holdout: boolean; ids: string[]; firstRank: number | null };

export type Summary = {
  queries: number;
  hitAt1: number;
  hitAt3: number;
  mrr: number;
  /** Real queries that got no results at all. */
  noAnswer: number;
  noiseQueries: number;
  /** Noise queries that got at least one result. */
  noiseFalsePositive: number;
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summarize(outcomes: QueryOutcome[]): Summary {
  const real = outcomes.filter((o) => o.query.type !== "noise");
  const noise = outcomes.filter((o) => o.query.type === "noise");
  return {
    queries: real.length,
    hitAt1: mean(real.map((o) => (o.firstRank === 1 ? 1 : 0))),
    hitAt3: mean(real.map((o) => (o.firstRank !== null && o.firstRank <= 3 ? 1 : 0))),
    mrr: mean(real.map((o) => (o.firstRank ? 1 / o.firstRank : 0))),
    noAnswer: mean(real.map((o) => (o.ids.length ? 0 : 1))),
    noiseQueries: noise.length,
    noiseFalsePositive: mean(noise.map((o) => (o.ids.length ? 1 : 0))),
  };
}

/** Summaries for all queries, the tuning two-thirds and the held-out third. */
export function summarizeSplits(outcomes: QueryOutcome[]): Record<"all" | "tune" | "holdout", Summary> {
  return {
    all: summarize(outcomes),
    tune: summarize(outcomes.filter((o) => !o.holdout)),
    holdout: summarize(outcomes.filter((o) => o.holdout)),
  };
}

/** Problems with the eval file itself: duplicate ids, noise with answers, real queries without. */
export function checkEvalSet(set: EvalSet): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const q of set.queries) {
    if (seen.has(q.id)) problems.push(`duplicate id ${q.id}`);
    seen.add(q.id);
    if (!q.q.trim()) problems.push(`${q.id}: empty query`);
    if (q.type === "noise" && q.expect.length) problems.push(`${q.id}: noise with expected answers`);
    if (q.type !== "noise" && !q.expect.length) problems.push(`${q.id}: no expected answers`);
  }
  return problems;
}

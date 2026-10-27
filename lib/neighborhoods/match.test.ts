import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { IndexEntry } from "./index-format";
import { DEFER_BELOW, QUESTIONS, QUESTION_IDS, answerBars, coverage, coverageLine, deferredIds, flowOf, matchAll, matchListHref, summarize, type Answers, EMPTY_ANSWERS } from "./match";

const entry = (s: string, over: Partial<IndexEntry> = {}): IndexEntry => ({
  s,
  n: s,
  a: [],
  l: "community",
  p: null,
  m: "lakewood-ranch",
  c: "Manatee",
  j: null,
  z: [],
  t: null,
  st: null,
  h: [],
  b: [],
  g: null,
  y: 27.4,
  x: -82.4,
  r: 1,
  ba: 0,
  q: s,
  w: null,
  ho: null,
  cd: null,
  ev: null,
  ...over,
});

/* Ten places: the evacuation zone is known for eight, gating for two, water for one, and one is a registry name. */
const ENTRIES: IndexEntry[] = [
  entry("a", { ev: "C", g: true, w: "lake" }),
  entry("b", { ev: "C", g: false }),
  entry("c", { ev: "D" }),
  entry("d", { ev: "A" }),
  entry("e", { ev: "none" }),
  entry("f", { ev: "C" }),
  entry("g", { ev: "E" }),
  entry("h", { ev: "C" }),
  entry("i"),
  entry("reg", { r: 0, ev: "C", g: true }),
];
const by = new Map(ENTRIES.map((e) => [e.s, e]));

describe("Atlas Match coverage", () => {
  test("the questions run in order of coverage, market first and water near the end", () => {
    assert.deepEqual([...QUESTION_IDS], ["market", "county", "evac", "hoa", "homes", "build", "cdd", "gated", "water", "near"]);
    assert.deepEqual(
      QUESTIONS.map((q) => q.id),
      [...QUESTION_IDS],
    );
  });

  test("coverage counts the researched places that hold the fact, and the registry names only when asked", () => {
    assert.equal(coverage(ENTRIES, "market"), null);
    assert.deepEqual(coverage(ENTRIES, "evac"), { known: 8, total: 9 });
    assert.deepEqual(coverage(ENTRIES, "gated"), { known: 2, total: 9 });
    assert.deepEqual(coverage(ENTRIES, "water"), { known: 1, total: 9 });
    assert.deepEqual(coverage(ENTRIES, "evac", true), { known: 9, total: 10 });
    assert.deepEqual(coverage(ENTRIES, "near"), { known: 9, total: 9 });
  });

  test("the coverage line is a plain sentence", () => {
    assert.equal(coverageLine(coverage(ENTRIES, "evac"), "evac"), "We hold this for 8 of 9 places.");
    assert.equal(coverageLine(coverage(ENTRIES, "near"), "near"), "We have a map point for 9 of 9 places.");
    assert.equal(coverageLine(null, "market"), null);
  });

  test("a question under a quarter coverage waits behind More questions; water by default before the index arrives", () => {
    assert.equal(DEFER_BELOW, 0.25);
    assert.deepEqual(deferredIds(null), ["water"]);
    // Gated is thin here too, but only water is deferrable; gated keeps its place near the end with its coverage line.
    assert.deepEqual(deferredIds(ENTRIES), ["water"]);
    const flow = flowOf(deferredIds(ENTRIES));
    assert.deepEqual(flow, ["market", "county", "evac", "hoa", "homes", "build", "cdd", "gated", "near"]);
    // With water known for a quarter of the places, it joins the flow.
    const wet = ENTRIES.map((e, i) => (i < 3 ? { ...e, w: "lake" as const } : e));
    assert.deepEqual(deferredIds(wet), []);
    assert.deepEqual(flowOf([]), [...QUESTION_IDS]);
  });

  test("one bar per answered question: confirmed and not-known-yet add up to the list", () => {
    const answers: Answers = { ...EMPTY_ANSWERS, evac: "c", gated: true };
    const matches = matchAll(ENTRIES, answers, by);
    // Zone C or further inland: a, b, c, e, f, g, h (d is zone A), and i, whose zone isn't known. Gated: a confirmed, b out, the rest not known.
    assert.deepEqual(
      matches.map((m) => m.entry.s).sort(),
      ["a", "c", "e", "f", "g", "h", "i"],
    );
    const bars = answerBars(matches, summarize(answers, by));
    assert.deepEqual(
      bars.map((b) => [b.id, b.confirmed, b.unknown]),
      [
        ["gated", 1, 6],
        ["evac", 6, 1],
      ],
    );
    for (const b of bars) assert.equal(b.confirmed + b.unknown, matches.length);
    // Strict on gated: only the confirmed place stays, and the bar says so.
    const strict = matchAll(ENTRIES, { ...answers, strict: ["gated"] }, by);
    assert.deepEqual(answerBars(strict, summarize(answers, by)).map((b) => [b.id, b.confirmed, b.unknown]), [
      ["gated", 1, 0],
      ["evac", 1, 0],
    ]);
  });

  test("the map link carries exactly the list", () => {
    const matches = matchAll(ENTRIES, { ...EMPTY_ANSWERS, evac: "none", strict: ["evac"] }, by);
    assert.equal(matchListHref(matches), "/neighborhoods?list=e");
    assert.equal(matchListHref([]), "/neighborhoods");
  });
});

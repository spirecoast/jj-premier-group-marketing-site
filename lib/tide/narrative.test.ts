import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { gunzipSync } from "node:zlib";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TeamNotes } from "../../components/tide/team-notes";
import { checkFairHousing } from "../fair-housing";
import { readability } from "../guides/readability";
import { LICENSE, SUPERLATIVES } from "../issues/fixtures";
import type { MarketSlug } from "../issues/render";
import type { Sale } from "../sales/types";
import { aiTells } from "../voice";
import { buildIssueModel, type IssueMarket } from "./issue";
import { NARRATIVE_FIELDS, TIDE_ISSUES, tideNarrativeStrings, type TideIssueEntry } from "./issues";
import { checkNarrative, closeEnough, issueFigures, matchFigure, writingFacts, writtenNumbers } from "./narrative";
import { narrativeOf, noteSlots } from "./notes";

/**
 * The narrative layer: the numbers in the hand-written story must be ones the
 * issue computes, the story reads plainly, the signed notes show only when
 * written, and the facts list carries the month's figures.
 */

// A hand-made month: three markets, with a typical month and a month before.
function market(slug: MarketSlug, name: string, f: { count: number; typ: number; price: number; typPrice: number; ppsf: number; typPpsf: number; nb: number; typNb: number; prevCount: number; prevPrice: number }): IssueMarket {
  const series = [
    { month: "2026-05", count: f.prevCount - 10, medianPrice: f.prevPrice, medianPpsf: f.ppsf + 3, newBuildPct: f.nb },
    { month: "2026-06", count: f.prevCount, medianPrice: f.prevPrice, medianPpsf: f.ppsf + 2, newBuildPct: f.nb },
    { month: "2026-07", count: f.count, medianPrice: f.price, medianPpsf: f.ppsf, newBuildPct: f.nb },
  ];
  return {
    market: slug,
    name,
    href: `/${slug}`,
    stats: {
      market: slug,
      name,
      count: f.count,
      medianPrice: f.price,
      priceSample: Math.round(f.count * 0.6),
      medianPpsf: f.ppsf,
      ppsfSample: Math.round(f.count * 0.6),
      newBuild: Math.round((f.count * f.nb) / 100),
      newBuildPct: f.nb,
      streets: [],
      zips: [],
      typical: f.typ,
      complete: true,
    },
    baseline: { count: f.typ, medianPrice: f.typPrice, medianPpsf: f.typPpsf, newBuildPct: f.typNb, months: 12 },
    streets: [{ label: `${name} Main St`, count: 9 }],
    series,
  };
}
const MONTH = {
  issue: "2026-10",
  dataMonth: "2026-07",
  markets: [
    market("lakewood-ranch", "Lakewood Ranch", { count: 241, typ: 277, price: 625_000, typPrice: 612_375, ppsf: 279, typPpsf: 278, nb: 46, typNb: 47, prevCount: 274, prevPrice: 675_000 }),
    market("sarasota", "Sarasota", { count: 586, typ: 523, price: 530_000, typPrice: 513_975, ppsf: 293, typPpsf: 293, nb: 16, typNb: 15, prevCount: 717, prevPrice: 525_000 }),
    market("bradenton", "Bradenton", { count: 793, typ: 706, price: 399_450, typPrice: 377_725, ppsf: 225, typPpsf: 226, nb: 34, typNb: 35, prevCount: 1_080, prevPrice: 412_000 }),
  ],
};
const entry = (over: Partial<TideIssueEntry>): TideIssueEntry => ({ issue: "2026-10", data: "2026-07", ...over });

describe("numbers written in prose", () => {
  it("reads dollars, percents, counts and thousands as written", () => {
    assert.deepEqual(
      writtenNumbers("There were 1,080 sales, 13% fewer, at $399,450 or about $625K, and $279 a square foot.").map((w) => [w.raw, w.value, w.kind]),
      [
        ["1,080", 1080, "plain"],
        ["13%", 13, "pct"],
        ["$399,450", 399450, "usd"],
        ["$625K", 625000, "usd"],
        ["$279", 279, "usd"],
      ],
    );
  });
  it("matches within rounding: half a point on a percent, 1% on dollars and counts", () => {
    assert.equal(closeEnough(12, 12.32, "pct"), true);
    assert.equal(closeEnough(13, 12.32, "pct"), false);
    assert.equal(closeEnough(400_000, 399_450, "usd"), true);
    assert.equal(closeEnough(410_000, 399_450, "usd"), false);
    assert.equal(closeEnough(800, 793, "count"), true);
    assert.equal(closeEnough(87, 86, "count"), false);
  });
  it("matches a percent only to a percent and a dollar figure only to dollars", () => {
    const figures = issueFigures(MONTH);
    assert.ok(matchFigure({ raw: "46%", value: 46, kind: "pct" }, figures));
    assert.equal(matchFigure({ raw: "$46", value: 46, kind: "usd" }, figures), null);
    assert.equal(matchFigure({ raw: "225", value: 225, kind: "plain" }, figures), null);
    assert.ok(matchFigure({ raw: "$279", value: 279, kind: "usd" }, figures));
  });
  it("knows the differences a writer quotes: against a typical month and the month before", () => {
    const labels = (v: number, kind: "count" | "usd" | "pct") => issueFigures(MONTH).filter((f) => f.kind === kind && closeEnough(v, f.value, kind)).map((f) => f.label);
    assert.ok(labels(87, "count").includes("Bradenton sales against typical"));
    assert.ok(labels(13, "pct").includes("Lakewood Ranch sales against typical, %"));
    assert.ok(labels(6, "pct").includes("Bradenton median price against typical, %"));
    assert.ok(labels(1_080, "count").includes("Bradenton sales, June 2026"));
    assert.ok(labels(33, "count").includes("Lakewood Ranch sales against the month before"));
  });
});

describe("the narrative check", () => {
  it("passes a story whose every number the issue computes", () => {
    const told = entry({
      opening: ["Bradenton had 793 home sales in July, 87 more than in a typical month, and the median price was $399,450."],
      buyers: ["A square foot cost $279, $293 and $225, about the same as usual, while the median rose about 6% in Bradenton."],
      sellers: ["Lakewood Ranch had 13% fewer sales, and 46% were new builds or lots."],
      watch: ["Bradenton had 1,080 sales in June."],
    });
    assert.deepEqual(checkNarrative(told, MONTH), []);
  });
  it("fails a number the issue doesn't compute, so the prose can't drift from the data", () => {
    const drifted = entry({ opening: ["Bradenton had 812 home sales in July, about 19% more than usual, at $450,000."] });
    assert.deepEqual(
      checkNarrative(drifted, MONTH).map((p) => p.problem),
      ["“812” isn’t a figure this issue computes", "“19%” isn’t a figure this issue computes", "“$450,000” isn’t a figure this issue computes"],
    );
  });
  it("fails a figure spelled out in words, which the check can't see", () => {
    const spelled = entry({ buyers: ["Prices rose twelve percent."] });
    assert.equal(checkNarrative(spelled, MONTH).length, 1);
    assert.deepEqual(checkNarrative(entry({ watch: ["One or two things to watch, across three places."] }), MONTH), []);
  });
});

describe("the facts to write from", () => {
  const facts = writingFacts(MONTH);
  it("leads with the largest change against a typical month", () => {
    assert.equal(facts[0], "Largest change against a typical month: home sales in Lakewood Ranch went down 13% to 241, from 277.");
  });
  it("tells the median-price and price-per-square-foot story where they part", () => {
    assert.ok(facts.some((f) => f.startsWith("Bradenton: the median price is up 6% against a typical month, but the price per square foot is about the same.")), facts.join("\n"));
    assert.ok(!facts.some((f) => f.startsWith("Lakewood Ranch: the median price is")), "Lakewood Ranch's 2% and 0% are too close to call a story");
  });
  it("gives each market's figures, the new-build share, the month before and the chart's range", () => {
    assert.ok(facts.includes("Sarasota: 586 sales (up 12% against a typical month). Median price $530,000 (up 3%). Per square foot $293 (about the same). New builds or lots 16% of sales, against 15% in a typical month."));
    assert.ok(facts.includes("Bradenton the month before, June 2026: 1,080 sales, median price $412,000."));
    assert.ok(facts.includes("Bradenton on the 12-month chart: most sales in June 2026 (1,080), fewest in July 2026 (793)."));
    assert.ok(facts.includes("Busiest street in July 2026: Bradenton Main St in Bradenton, with 9 sales."));
  });
  it("puts no number in a fact that the issue doesn't compute", () => {
    const figures = issueFigures(MONTH);
    for (const f of facts) {
      for (const w of writtenNumbers(f.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/g, ""))) {
        assert.ok(matchFigure(w, figures), `${w.raw} in “${f}”`);
      }
    }
  });
});

describe("the signed notes", () => {
  it("shows only the notes written on the public page, both slots in a draft", () => {
    assert.deepEqual(noteSlots(undefined, "public"), []);
    assert.deepEqual(noteSlots({ joelyn: ["  "] }, "public"), []);
    assert.deepEqual(
      noteSlots({ joelyn: ["A note."] }, "public").map((s) => [s.key, s.name, s.paragraphs]),
      [["joelyn", "Joelyn Nauman", ["A note."]]],
    );
    assert.deepEqual(
      noteSlots({ jessica: ["Another."] }, "draft").map((s) => [s.key, s.paragraphs]),
      [
        ["joelyn", null],
        ["jessica", ["Another."]],
      ],
    );
  });
  it("renders nothing when no note is written", () => {
    assert.equal(renderToStaticMarkup(createElement(TeamNotes, { notes: noteSlots({}, "public"), eyebrow: "06 · In their own words" })), "");
  });
  it("renders a written note in full, signed with her name, and no placeholder", () => {
    const html = renderToStaticMarkup(createElement(TeamNotes, { notes: noteSlots({ jessica: ["First line.", "Second line."] }, "public"), eyebrow: "06 · In their own words" }));
    assert.match(html, /From Joelyn and Jessica/);
    assert.match(html, /<blockquote[^>]*><p>First line\.<\/p><p>Second line\.<\/p><\/blockquote>/);
    assert.match(html, /<figcaption[^>]*>Jessica Garza<\/figcaption>/);
    assert.doesNotMatch(html, /Joelyn Nauman|Placeholder/);
  });
  it("marks an empty slot as a placeholder in sample previews, never as words", () => {
    const html = renderToStaticMarkup(createElement(TeamNotes, { notes: noteSlots({ jessica: ["Hers."] }, "draft"), eyebrow: "06" }));
    assert.match(html, /data-note-placeholder="joelyn"/);
    assert.match(html, /Placeholder, not published/);
    assert.match(html, /Joelyn can add a few sentences here/);
    assert.match(html, /data-note="jessica"/);
  });
});

describe("the narratives in lib/tide/issues.ts", () => {
  const strings = tideNarrativeStrings();
  const PEOPLE = /\b(famil(y|ies)|kids|children|retirees?|retired|seniors?|young professionals?|millennials|boomers|snowbirds?|empty nesters?|couples?|singles)\b/i;

  it("pass the voice rules, Fair Housing, and the issue rules", () => {
    for (const { where, text } of strings) {
      assert.deepEqual(aiTells(text), [], `${where}: ${text}`);
      assert.equal(checkFairHousing(text).passed, true, `${where}: ${text}`);
      assert.doesNotMatch(text, PEOPLE, where);
      assert.doesNotMatch(text, SUPERLATIVES, where);
      assert.doesNotMatch(text, LICENSE, where);
      assert.doesNotMatch(text, /\?/, `${where}: no questions in the narrative`);
      assert.doesNotMatch(text, /!/, `${where}: no exclamation marks`);
      assert.doesNotMatch(text, /\b(days on market|list price|listing price|inventory|months of supply)\b/i, `${where}: county records carry none of these`);
    }
  });
  it("keep the shape: an opening and buying and selling of two to four sentences, one or two things to watch", () => {
    for (const e of TIDE_ISSUES) {
      const n = narrativeOf(e);
      if (!n) continue;
      const count = (ps: string[]) => readability(ps).sentences;
      assert.ok(count(n.opening) >= 2 && count(n.opening) <= 4, `${e.issue} opening: ${count(n.opening)} sentences`);
      for (const f of ["buyers", "sellers"] as const) assert.ok(count(n[f]) >= 2 && count(n[f]) <= 4, `${e.issue} ${f}: ${count(n[f])} sentences`);
      assert.ok(n.watch.length >= 1 && n.watch.length <= 2, `${e.issue} watch: ${n.watch.length} items`);
      for (const w of n.watch) assert.ok(count([w]) <= 2, `${e.issue} watch: ${w}`);
    }
  });
  it("read at about a sixth-grade level, with no sentence over 24 words", () => {
    for (const e of TIDE_ISSUES) {
      const n = narrativeOf(e);
      if (!n) continue;
      const r = readability(NARRATIVE_FIELDS.flatMap((f) => n[f]));
      assert.ok(r.grade <= 6.5, `${e.issue}: grade ${r.grade}`);
      assert.ok(r.longest.words <= 24, `${e.issue}: “${r.longest.text}” is ${r.longest.words} words`);
    }
  });
  it("leave the signed notes to Joelyn and Jessica: nothing is written for them", () => {
    // Change this test only with words they wrote themselves.
    for (const e of TIDE_ISSUES) for (const s of noteSlots(e.commentary, "public")) assert.ok(s.paragraphs!.length <= 3, `${e.issue} ${s.key}: a few sentences at most`);
  });

  it("use only numbers the issue computes from the county record, within rounding", () => {
    const dir = path.join(process.cwd(), "data", "sales");
    const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")) as { generatedAt: string; counties: Record<string, { label: string; to: string | null; file: string }> };
    const sales = Object.values(manifest.counties).flatMap((c) => JSON.parse(gunzipSync(readFileSync(path.join(dir, c.file))).toString("utf8")) as Sale[]);
    const tideManifest = { generatedAt: manifest.generatedAt, counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c.label, to: c.to }])) };
    let checked = 0;
    for (const e of TIDE_ISSUES) {
      if (!narrativeOf(e)) continue;
      const model = buildIssueModel({ entry: e, sales, manifest: tideManifest, posts: [] });
      // An issue the 24-month data window no longer reaches is a 404 on the site: nothing to check it against.
      if (model.markets.every((m) => m.stats.count === 0)) continue;
      assert.deepEqual(checkNarrative(e, model), [], `${e.issue}: a number in the narrative isn't one the page computes. Rewrite it from the page's figures (docs/ISSUES.md).`);
      checked += 1;
    }
    assert.ok(checked >= 1, "at least one written narrative is checked against the data");
  });
});

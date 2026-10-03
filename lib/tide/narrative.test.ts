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
import { REBUILT_GUIDE_SLUGS } from "../guides/slugs";
import { LICENSE, SUPERLATIVES } from "../issues/fixtures";
import type { MarketSlug } from "../issues/render";
import type { Sale } from "../sales/types";
import { aiTells } from "../voice";
import { buildIssueModel, type IssueMarket } from "./issue";
import { TIDE_ISSUES, TIDE_MARKET_KEYS, narrativeTexts, tideNarrativeStrings, type TideIssueEntry } from "./issues";
import { checkNarrative, closeEnough, issueFigures, matchFigure, writingFacts, writtenNumbers } from "./narrative";
import { narrativeOf, noteSlots } from "./notes";

/**
 * The narrative layer: the numbers in the hand-written story must be ones the
 * issue computes, the story reads plainly, the signed notes show only when
 * written, and the facts list carries the month's figures.
 */

// A hand-made month: three markets, with a typical month and a month before.
type Fix = {
  count: number;
  typ: number;
  price: number;
  typPrice: number;
  ppsf: number;
  typPpsf: number;
  nb: number;
  typNb: number;
  prevCount: number;
  prevPrice: number;
  ly: number;
  lyPrice: number;
  sf: number;
  sfPrice: number;
  att: number;
  attPrice: number;
  bands: [number, number, number, number];
};
function market(slug: MarketSlug, name: string, f: Fix): IssueMarket {
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
    lastYear: {
      month: "2025-07",
      count: f.ly,
      medianPrice: f.lyPrice,
      medianPpsf: f.ppsf - 5,
      countPct: (100 * (f.count - f.ly)) / f.ly,
      pricePct: (100 * (f.price - f.lyPrice)) / f.lyPrice,
      ppsfPct: (100 * 5) / (f.ppsf - 5),
    },
    mix: [
      { key: "single-family", label: "Single-family homes", count: f.sf, share: Math.round((100 * f.sf) / f.count), medianPrice: f.sfPrice, priceSample: f.sf },
      { key: "attached", label: "Condos, villas and townhomes", count: f.att, share: Math.round((100 * f.att) / f.count), medianPrice: f.attPrice, priceSample: f.att },
      { key: "land", label: "Lots the county lists as empty", count: f.count - f.sf - f.att, share: 100 - Math.round((100 * f.sf) / f.count) - Math.round((100 * f.att) / f.count), medianPrice: null, priceSample: 0 },
    ],
    bands: {
      sample: f.sf + f.att,
      bands: f.bands.map((n, i) => ({ key: (["under-400k", "400k-750k", "750k-1.5m", "1.5m-up"] as const)[i]!, label: ["Under $400K", "$400K to $750K", "$750K to $1.5M", "$1.5M and up"][i]!, from: [0, 400_000, 750_000, 1_500_000][i]!, to: [400_000, 750_000, 1_500_000, null][i]!, count: n, share: Math.round((100 * n) / (f.sf + f.att)) })),
    },
    story: { paragraphs: [], written: false },
  };
}
const MONTH = {
  issue: "2026-10",
  dataMonth: "2026-07",
  markets: [
    market("lakewood-ranch", "Lakewood Ranch", { count: 241, typ: 277, price: 625_000, typPrice: 612_375, ppsf: 279, typPpsf: 278, nb: 46, typNb: 47, prevCount: 274, prevPrice: 675_000, ly: 260, lyPrice: 600_000, sf: 150, sfPrice: 700_000, att: 40, attPrice: 420_000, bands: [20, 100, 60, 10] }),
    market("sarasota", "Sarasota", { count: 586, typ: 523, price: 530_000, typPrice: 513_975, ppsf: 293, typPpsf: 293, nb: 16, typNb: 15, prevCount: 717, prevPrice: 525_000, ly: 540, lyPrice: 515_000, sf: 300, sfPrice: 610_000, att: 220, attPrice: 380_000, bands: [180, 200, 100, 40] }),
    market("bradenton", "Bradenton", { count: 793, typ: 706, price: 399_450, typPrice: 377_725, ppsf: 225, typPpsf: 226, nb: 34, typNb: 35, prevCount: 1_080, prevPrice: 412_000, ly: 700, lyPrice: 390_000, sf: 450, sfPrice: 470_000, att: 150, attPrice: 300_000, bands: [300, 220, 60, 20] }),
  ],
  combined: {
    count: 1_620,
    typical: 1_510,
    diff: 110,
    pct: (100 * 110) / 1_510,
    lastYear: { month: "2025-07", count: 1_500, pct: 8 },
    parts: [
      { market: "lakewood-ranch" as const, name: "Lakewood Ranch", count: 241, share: 15 },
      { market: "sarasota" as const, name: "Sarasota", count: 586, share: 36 },
      { market: "bradenton" as const, name: "Bradenton", count: 793, share: 49 },
    ],
  },
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

describe("the new figures", () => {
  const labels = (v: number, kind: "count" | "usd" | "pct" | "other") => issueFigures(MONTH).filter((f) => f.kind === kind && closeEnough(v, f.value, kind)).map((f) => f.label);
  it("know the same month a year before and the change against it", () => {
    assert.ok(labels(260, "count").includes("Lakewood Ranch sales, July 2025"));
    assert.ok(labels(19, "count").includes("Lakewood Ranch sales against July 2025"));
    assert.ok(labels(7, "pct").includes("Lakewood Ranch sales against July 2025, %"));
    assert.ok(labels(600_000, "usd").includes("Lakewood Ranch median price, July 2025"));
    assert.ok(labels(2025, "other").includes("last year"));
  });
  it("know the kinds of home, the price bands and the three markets together", () => {
    assert.ok(labels(62, "pct").includes("Lakewood Ranch Single-family homes, share"));
    assert.ok(labels(420_000, "usd").includes("Lakewood Ranch Condos, villas and townhomes, median price"));
    assert.ok(labels(53, "pct").includes("Lakewood Ranch $400K to $750K, share"));
    assert.ok(labels(1_500_000, "usd").includes("the price band at $1,500,000"));
    assert.ok(labels(1_620, "count").includes("all three markets, sales"));
    assert.ok(labels(7, "pct").includes("all three markets, sales against typical, %"));
    assert.ok(labels(120, "count").includes("all three markets, sales against July 2025"));
  });
  it("read $1.5M as a million and a half", () => {
    assert.deepEqual(writtenNumbers("Homes at $1.5M and up.").map((w) => [w.value, w.kind]), [[1_500_000, "usd"]]);
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
    const drifted = entry({ opening: ["Bradenton had 812 home sales in July, about 23% more than usual, at $450,000."] });
    assert.deepEqual(
      checkNarrative(drifted, MONTH).map((p) => p.problem),
      ["“812” isn’t a figure this issue computes", "“23%” isn’t a figure this issue computes", "“$450,000” isn’t a figure this issue computes"],
    );
  });
  it("checks every field: the cover, the markets, their moves, and buying and selling", () => {
    const good = entry({
      headline: "There were 1,620 home sales in July.",
      dek: "That's 7% more than a typical month.",
      markets: { sarasota: ["Sarasota had 586 sales, up from 540 in July 2025.", "A second paragraph."] },
      marketMoves: { bradenton: "Look under $400K, where 300 of the homes sold." },
      buying: [{ move: "Compare by the square foot.", why: "Single-family homes had a median of $700,000.", link: { href: "/neighborhoods?market=sarasota", label: "Sarasota on Atlas" } }],
      selling: [{ move: "Price from the $1.5M line.", why: "Only 5% sold for $1.5M and up." }],
    });
    assert.deepEqual(checkNarrative(good, MONTH), []);
    const bad = entry({
      headline: "Sales rose 77% in July.",
      dek: "The median hit $123,456.",
      markets: { sarasota: ["Sarasota had 4,321 sales."] },
      marketMoves: { bradenton: "Look under $1.7M." },
      buying: [{ move: "Offer 83% of the price.", why: "It works.", link: { href: "/buy", label: "8,888 homes" } }],
      selling: [{ move: "Sell now.", why: "There were 6,543 sales." }],
    });
    assert.deepEqual(
      checkNarrative(bad, MONTH).map((p) => p.field),
      ["headline", "dek", "markets.sarasota[0]", "marketMoves.bradenton", "buying[0].move", "buying[0].link.label", "selling[0].why"],
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
  it("lists the new figures: the three markets together, a year before, the kinds of home and the price bands", () => {
    for (const line of [
      "All three markets together: 1,620 home sales in July 2026, up 7% against a typical month of 1,510.",
      "All three markets a year before, in July 2025: 1,500 home sales. This month is up 8% on that.",
      "Lakewood Ranch a year before, in July 2025: 260 sales (down 7% since). Median price $600,000 (up 4%). Per square foot $274 (up 2%).",
      "Lakewood Ranch by kind of home: single-family 150 (62% of sales, median $700,000). Condos, villas and townhomes 40 (17%, median $420,000). Lots the county lists as empty 51 (21%).",
      "Lakewood Ranch by price, over the 190 homes in the median: under $400K 11%, $400K to $750K 53%, $750K to $1.5M 32%, $1.5M and up 5%.",
    ]) {
      assert.ok(facts.includes(line), `${line}\n---\n${facts.join("\n")}`);
    }
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
  it("keep the shape of each field that's written", () => {
    for (const e of TIDE_ISSUES) {
      const n = narrativeOf(e);
      if (!n) continue;
      const count = (ps: string[]) => (ps.length ? readability(ps).sentences : 0);
      const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
      if (n.headline) {
        assert.equal(count([n.headline]), 1, `${e.issue} headline: one sentence`);
        assert.ok(words(n.headline) <= 18, `${e.issue} headline: ${words(n.headline)} words`);
      }
      if (n.dek) assert.ok(count([n.dek]) >= 1 && count([n.dek]) <= 2, `${e.issue} dek: one or two sentences`);
      // The story: three to five paragraphs in the letter (an issue with a headline); the first issues opened with one.
      if (n.opening.length) {
        if (n.headline) assert.ok(n.opening.length >= 3 && n.opening.length <= 5, `${e.issue} opening: ${n.opening.length} paragraphs`);
        else assert.ok(count(n.opening) >= 2 && count(n.opening) <= 4, `${e.issue} opening: ${count(n.opening)} sentences`);
        for (const p of n.opening) assert.ok(count([p]) >= 1 && count([p]) <= 5, `${e.issue} opening paragraph: ${p}`);
      }
      for (const k of TIDE_MARKET_KEYS) {
        const ps = n.markets[k];
        if (ps) assert.ok(ps.length >= 2 && ps.length <= 3, `${e.issue} markets.${k}: ${ps.length} paragraphs`);
        const mv: string | undefined = n.marketMoves[k];
        if (mv) assert.equal(count([mv]), 1, `${e.issue} marketMoves.${k}: one sentence`);
      }
      for (const f of ["buying", "selling"] as const) {
        if (!n[f].length) continue;
        assert.equal(n[f].length, 3, `${e.issue} ${f}: three moves`);
        for (const m of n[f]) {
          assert.equal(count([m.move]), 1, `${e.issue} ${f} move: ${m.move}`);
          assert.ok(words(m.move) <= 14, `${e.issue} ${f} move is short: ${m.move}`);
          assert.ok(count([m.why]) >= 1 && count([m.why]) <= 3, `${e.issue} ${f} why: ${m.why}`);
        }
      }
      for (const f of ["buyers", "sellers"] as const) if (n[f].length) assert.ok(count(n[f]) >= 2 && count(n[f]) <= 4, `${e.issue} ${f}: ${count(n[f])} sentences`);
      if (n.watch.length) assert.ok(n.watch.length <= 2, `${e.issue} watch: ${n.watch.length} items`);
      for (const w of n.watch) assert.ok(count([w]) <= 2, `${e.issue} watch: ${w}`);
    }
  });
  it("link each move only to a page on the site: a tool, Atlas, or a guide", () => {
    const tools = new Set(["/sell", "/sell/home-value", "/sell/net-proceeds", "/sell/sold", "/buy", "/neighborhoods", "/neighborhoods/match", "/relocate", "/calendar", "/contact", "/lakewood-ranch", "/sarasota", "/bradenton"]);
    for (const e of TIDE_ISSUES) {
      for (const m of [...(e.buying ?? []), ...(e.selling ?? [])]) {
        if (!m.link) continue;
        const [pathname] = m.link.href.split("?");
        const guide = /^\/guides\/([a-z0-9-]+)$/.exec(pathname!);
        assert.ok(tools.has(pathname!) || (guide && (REBUILT_GUIDE_SLUGS as readonly string[]).includes(guide[1]!)), `${e.issue}: ${m.link.href} isn't a page on the site`);
      }
    }
  });
  it("read at about a sixth-grade level, with no sentence over 24 words", () => {
    for (const e of TIDE_ISSUES) {
      const n = narrativeOf(e);
      if (!n) continue;
      const r = readability(narrativeTexts(e).map((t) => t.text));
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
    const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")) as { generatedAt: string; counties: Record<string, { label: string; to: string | null; from: string | null; file: string }> };
    const sales = Object.values(manifest.counties).flatMap((c) => JSON.parse(gunzipSync(readFileSync(path.join(dir, c.file))).toString("utf8")) as Sale[]);
    const tideManifest = { generatedAt: manifest.generatedAt, counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c.label, to: c.to, from: c.from }])) };
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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { LICENSE, MANIFEST_COMPLETE, SUPERLATIVES, sale } from "../issues/fixtures";
import { tideStats } from "../issues/tide-monthly";
import type { Sale } from "../sales/types";
import { chartGeometry } from "./chart";
import { tideWebStrings } from "./copy";
import {
  baselines,
  buildIssueModel,
  dataMonthFor,
  guidesForMonth,
  issueCard,
  issueText,
  monthlySeries,
  monthsEnding,
  niceStep,
  shortMonth,
  yAxis,
} from "./issue";
import { TIDE_ISSUES, isIssueMonth } from "./issues";

/**
 * A year of sales in three markets, August 2025 to July 2026, every figure
 * known in advance:
 * - market i (0 Lakewood Ranch, 1 Sarasota, 2 Bradenton) has 4 + 2i + k sales
 *   in month k (0 = August 2025);
 * - every sale in a month has the same price, 100,000 × (i + 3) + 1,000 × k,
 *   over 1,000 sq ft, so the median price is that and the $/sqft is a thousandth of it;
 * - the first sale in each month is a new build (built in the sale year);
 * - sale j is on one of six streets, j mod 6.
 * Then August 2026 has one sale per market and September none: the county
 * hasn't published them yet, so the latest complete month is July.
 */
const MARKETS: [string, string, Sale["county"]][] = [
  ["LAKEWOOD RANCH", "34202", "manatee"],
  ["SARASOTA", "34236", "sarasota"],
  ["BRADENTON", "34209", "manatee"],
];
const STREETS = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT"];
const MONTHS = monthsEnding("2026-07", 12);
const count = (i: number, k: number) => 4 + 2 * i + k;
const price = (i: number, k: number) => 100_000 * (i + 3) + 1_000 * k;

function yearFixture(): Sale[] {
  const rows: Sale[] = [];
  MONTHS.forEach((month, k) => {
    MARKETS.forEach(([city, zip, county], i) => {
      for (let j = 0; j < count(i, k); j += 1) {
        const day = `${month}-${String(1 + (j % 28)).padStart(2, "0")}`;
        rows.push(
          sale({
            city,
            zip,
            county,
            saleDate: day,
            street: STREETS[j % 6]!,
            suffix: "ST",
            number: String(100 + j),
            salePrice: price(i, k),
            livingArea: 1_000,
            yearBuilt: j === 0 ? Number(month.slice(0, 4)) : 1995,
          }),
        );
      }
    });
  });
  for (const [city, zip, county] of MARKETS) rows.push(sale({ city, zip, county, saleDate: "2026-08-12", salePrice: 999_000 }));
  // Rows that never count: an unqualified transfer, a commercial parcel, a sale outside the three markets.
  rows.push(sale({ city: "SARASOTA", zip: "34236", saleDate: "2026-07-09", qualified: false, salePrice: 10 }));
  rows.push(sale({ city: "BRADENTON", zip: "34209", saleDate: "2026-07-09", propertyUse: "other", salePrice: 5_000_000 }));
  rows.push(sale({ city: "VENICE", zip: "34293", county: "sarasota", saleDate: "2026-07-09", salePrice: 5_000_000 }));
  return rows;
}

const POSTS = [
  { slug: "flood", title: "Flood zones and elevation certificates.", excerpt: "What the certificate says.", publishedAt: "2026-10-01", categories: ["Guides"] },
  { slug: "cdd", title: "CDD fees, village by village.", excerpt: "Where the fee comes from.", publishedAt: "2026-10-14", categories: ["Guides"] },
  { slug: "insurance", title: "Wind and flood insurance.", excerpt: "What drives the quote.", publishedAt: "2026-09-23", categories: ["Guides"] },
  { slug: "q3", title: "A sample quarterly report.", excerpt: "Sample figures.", publishedAt: "2026-10-02", categories: ["Market report"] },
];

const SALES = yearFixture();
const model = (over: Partial<Parameters<typeof buildIssueModel>[0]> = {}) =>
  buildIssueModel({ entry: { issue: "2026-10" }, sales: SALES, manifest: MANIFEST_COMPLETE, posts: POSTS, ...over });

describe("months", () => {
  it("lists the twelve months ending with the data month, oldest first", () => {
    assert.deepEqual(monthsEnding("2026-07", 3), ["2026-05", "2026-06", "2026-07"]);
    assert.equal(MONTHS[0], "2025-08");
    assert.equal(MONTHS.length, 12);
    assert.equal(shortMonth("2026-01"), "Jan 2026");
    assert.equal(shortMonth("2026-03"), "Mar");
    assert.equal(shortMonth("2025-08", true), "Aug 2025");
  });
});

describe("the data month", () => {
  it("is the latest month complete in all three markets, looking back from the month before the issue", () => {
    // September has nothing and August one sale per market: neither is complete.
    assert.deepEqual(dataMonthFor({ issue: "2026-10" }, SALES), { dataMonth: "2026-07", latestComplete: "2026-07" });
    // A month later on the same data, the look-back starts at October and still finds July.
    assert.equal(dataMonthFor({ issue: "2026-11" }, SALES).dataMonth, "2026-07");
  });
  it("takes the entry's pin over the computed month, and the note says less", () => {
    const pinned = model({ entry: { issue: "2026-10", data: "2026-06" } });
    assert.equal(pinned.dataMonth, "2026-06");
    assert.equal(pinned.latestComplete, "2026-07");
    assert.equal(pinned.pinned, true);
    assert.equal(pinned.note, "The county posts sales a few weeks late, so this issue looks back at June 2026.");
    const m = model();
    assert.equal(m.note, "The county posts sales a few weeks late, so this issue looks back at July 2026. That’s the newest month that’s complete for all three places.");
    assert.equal(m.issueLabel, "October 2026");
    assert.equal(m.dataLabel, "July 2026");
    assert.equal(m.title, "Tide, October 2026");
  });
});

describe("the monthly series", () => {
  const series = monthlySeries(SALES, MONTHS);
  it("counts each market's qualified home sales per month", () => {
    assert.deepEqual(
      series["lakewood-ranch"].map((p) => p.count),
      MONTHS.map((_, k) => count(0, k)),
    );
    assert.deepEqual(
      series.bradenton.map((p) => p.count),
      MONTHS.map((_, k) => count(2, k)),
    );
  });
  it("computes the medians and the new-build share per month", () => {
    assert.deepEqual(
      series.sarasota.map((p) => p.medianPrice),
      MONTHS.map((_, k) => price(1, k)),
    );
    assert.deepEqual(
      series.sarasota.map((p) => p.medianPpsf),
      MONTHS.map((_, k) => Math.round(price(1, k) / 1_000)),
    );
    // One new build in each month: 1 of 4 sales in Lakewood Ranch's first month.
    assert.equal(series["lakewood-ranch"][0]!.newBuildPct, 25);
  });
  it("leaves out unqualified, non-residential and out-of-market sales", () => {
    assert.equal(series.sarasota[11]!.count, count(1, 11));
    assert.equal(series.bradenton[11]!.medianPrice, price(2, 11));
  });
});

describe("the typical month", () => {
  it("is the median of the months before the data month that the data reaches", () => {
    const b = baselines(SALES, "2026-07");
    // July 2025 isn't in the data, so eleven months: August 2025 (k = 0) to June 2026 (k = 10); the median is k = 5.
    assert.equal(b["lakewood-ranch"].months, 11);
    assert.equal(b["lakewood-ranch"].count, count(0, 5));
    assert.equal(b.sarasota.medianPrice, price(1, 5));
    assert.equal(b.bradenton.medianPpsf, Math.round(price(2, 5) / 1_000));
    // New-build shares 1/(6+k) for k = 0..10: the median is 1/11.
    assert.equal(b.sarasota.newBuildPct, Math.round(100 / count(1, 5)));
  });
  it("matches the email's typical count", () => {
    const email = tideStats(SALES, "2026-07");
    const b = baselines(SALES, "2026-07");
    for (const m of email) assert.equal(b[m.market].count, m.typical);
  });
  it("is null with fewer than three months behind it", () => {
    const b = baselines(SALES, "2025-09");
    assert.equal(b.sarasota.count, null);
    assert.equal(b.sarasota.months, 1);
  });
});

describe("the issue's figures", () => {
  const m = model();
  it("are the email's figures for the data month", () => {
    assert.deepEqual(
      m.markets.map((x) => x.stats),
      tideStats(SALES, "2026-07"),
    );
    assert.deepEqual(
      m.markets.map((x) => x.name),
      ["Lakewood Ranch", "Sarasota", "Bradenton"],
    );
    assert.equal(m.markets[0]!.stats.count, count(0, 11));
    assert.equal(m.markets[0]!.stats.medianPrice, price(0, 11));
  });
  it("list the five streets with the most sales, street and city only", () => {
    const [lwr] = m.markets;
    // 15 sales over six streets: three each on Alpha, Bravo and Charlie, two on the rest; ties alphabetical.
    assert.deepEqual(
      lwr!.streets.map((s) => [s.label, s.count]),
      [
        ["Alpha St", 3],
        ["Bravo St", 3],
        ["Charlie St", 3],
        ["Delta St", 2],
        ["Echo St", 2],
      ],
    );
    for (const s of m.markets.flatMap((x) => x.streets)) assert.doesNotMatch(s.label, /\d/, "no house numbers");
  });
});

describe("the charts", () => {
  const { sales, ppsf } = model().charts;
  it("cover the last twelve complete months, one line per market", () => {
    assert.deepEqual(sales.months, MONTHS);
    assert.equal(sales.monthLabels[0], "Aug 2025");
    assert.equal(sales.monthLabels[5], "Jan 2026");
    assert.equal(sales.monthLabels[11], "Jul");
    assert.deepEqual(
      sales.series.map((s) => s.market),
      ["lakewood-ranch", "sarasota", "bradenton"],
    );
    assert.deepEqual(
      sales.series[2]!.values,
      MONTHS.map((_, k) => count(2, k)),
    );
    assert.deepEqual(
      ppsf.series[0]!.values,
      MONTHS.map((_, k) => Math.round(price(0, k) / 1_000)),
    );
  });
  it("start the count axis at zero and cover every value", () => {
    assert.equal(sales.zeroBased, true);
    assert.equal(sales.yMin, 0);
    assert.equal(sales.ticks[0], 0);
    assert.ok(sales.yMax >= Math.max(...sales.series.flatMap((s) => s.values as number[])));
    assert.equal(sales.baselineLabel, null);
    assert.match(sales.note, /The axis starts at zero\./);
  });
  it("label where the $/sqft axis starts when it isn't zero", () => {
    const lo = Math.min(...ppsf.series.flatMap((s) => s.values as number[]));
    assert.equal(ppsf.zeroBased, false);
    assert.ok(ppsf.yMin > 0 && ppsf.yMin < lo, `${ppsf.yMin} sits under ${lo}`);
    assert.equal(ppsf.baselineLabel, `Axis starts at $${ppsf.yMin}`);
    assert.match(ppsf.note, new RegExp(`starts at \\$${ppsf.yMin}, not at zero`));
    assert.equal(ppsf.ticks[0], ppsf.yMin);
  });
  it("space the ticks evenly", () => {
    for (const c of [sales, ppsf]) {
      const steps = new Set(c.ticks.slice(1).map((t, i) => t - c.ticks[i]!));
      assert.equal(steps.size, 1, `${c.id}: ${c.ticks.join(", ")}`);
      assert.ok(c.ticks.length >= 3 && c.ticks.length <= 7);
    }
  });
  it("draw every point inside the plot, zero on the baseline, end labels apart", () => {
    for (const variant of ["wide", "narrow"] as const) {
      const g = chartGeometry(sales, variant);
      const zero = g.yTicks.find((t) => t.value === 0)!;
      assert.equal(zero.y, g.plot.y1);
      for (const l of g.lines) {
        assert.equal(l.points.length, 12);
        for (const p of l.points) assert.ok(p.y >= g.plot.y0 - 0.01 && p.y <= g.plot.y1 + 0.01 && p.x >= g.plot.x0 && p.x <= g.plot.x1);
      }
      const ys = g.lines.map((l) => l.end!.labelY).sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i += 1) assert.ok(ys[i]! - ys[i - 1]! >= g.font + 3 - 0.01);
      // The latest month is always labelled.
      assert.equal(g.xLabels[g.xLabels.length - 1]!.index, 11);
    }
    assert.equal(chartGeometry(sales, "narrow").xLabels.length, 4);
    assert.equal(chartGeometry(ppsf, "wide").baselineNote, ppsf.baselineLabel);
  });
});

describe("the axis arithmetic", () => {
  it("picks steps of 1, 2, 2.5 or 5 times a power of ten", () => {
    assert.equal(niceStep(1080, 5), 250);
    assert.equal(niceStep(91, 4), 25);
    assert.equal(niceStep(0), 1);
  });
  it("never starts a count axis above zero, nor a price axis below it", () => {
    assert.deepEqual(yAxis([241, 586, 1080], true), { yMin: 0, yMax: 1250, ticks: [0, 250, 500, 750, 1000, 1250] });
    const p = yAxis([208, 300], false);
    assert.ok(p.yMin <= 208 && p.yMin >= 0 && p.yMax >= 300);
    assert.ok(yAxis([5, 6], false).yMin >= 0);
  });
});

describe("the rest of the issue", () => {
  it("lists the guides published in the issue month, newest first, without the sample reports", () => {
    assert.deepEqual(
      guidesForMonth(POSTS, "2026-10").map((g) => g.slug),
      ["cdd", "flood"],
    );
    assert.deepEqual(
      model().guides.map((g) => g.slug),
      ["cdd", "flood"],
    );
  });
  it("opens with the plain framing until the story is written, then with the story", () => {
    assert.equal(model().narrative, null);
    assert.equal(model().framing, "Here’s how home sales went in July 2026 in Lakewood Ranch, Sarasota and Bradenton, straight from the county’s public record.");
    const told = model({ entry: { issue: "2026-10", opening: ["Picture July."], buyers: ["Buy."], sellers: [" "], watch: ["Watch."] } });
    assert.deepEqual(told.narrative, { opening: ["Picture July."], buyers: ["Buy."], sellers: [], watch: ["Watch."] });
    // A story with no opening isn't one yet.
    assert.equal(model({ entry: { issue: "2026-10", buyers: ["Buy."] } }).narrative, null);
  });
  it("shows a signed note only when it's written; sample previews show both slots", () => {
    assert.deepEqual(model().notes, []);
    assert.deepEqual(model({ entry: { issue: "2026-10", commentary: { joelyn: [], jessica: [""] } } }).notes, []);
    const one = model({ entry: { issue: "2026-10", commentary: { jessica: ["Her words."] } } });
    assert.deepEqual(
      one.notes.map((n) => [n.key, n.name, n.paragraphs]),
      [["jessica", "Jessica Garza", ["Her words."]]],
    );
    const preview = model({ showSamples: true, entry: { issue: "2026-10", commentary: { jessica: ["Her words."] } } });
    assert.deepEqual(
      preview.notes.map((n) => [n.key, n.paragraphs]),
      [
        ["joelyn", null],
        ["jessica", ["Her words."]],
      ],
    );
  });
  it("carries the standard source line with the manifest date", () => {
    assert.equal(model().source, "County property appraisers, public record, qualified sales, as of September 15, 2026.");
  });
  it("makes the archive card from the model", () => {
    assert.deepEqual(issueCard(model()), {
      href: "/tide/2026-10",
      eyebrow: "Tide · Monthly issue",
      title: "Tide, October 2026",
      excerpt: "How home sales went in July 2026 in Lakewood Ranch, Sarasota and Bradenton, and what it means if you’re buying or selling.",
      data: "Numbers for July 2026",
    });
  });
  it("flags commentary that fails the Fair Housing check", () => {
    const bad = model({ entry: { issue: "2026-10", commentary: { joelyn: ["It’s perfect for families."] } } });
    assert.equal(bad.fairHousing.passed, false);
  });
});

describe("the voice", () => {
  const strings = [...issueText(model()), ...tideWebStrings().map((s) => s.text)];
  it("passes the Fair Housing check on every string", () => {
    for (const s of strings) assert.equal(checkFairHousing(s).passed, true, s);
    assert.equal(model().fairHousing.passed, true);
  });
  it("has no superlatives, no license numbers and never says lands", () => {
    for (const s of strings) {
      assert.doesNotMatch(s, SUPERLATIVES, s);
      assert.doesNotMatch(s, LICENSE, s);
      assert.doesNotMatch(s, /\blands\b/i, s);
    }
  });
  it("never strings three short comma fragments into a sentence (the source line is the standard one)", () => {
    for (const { where, text } of tideWebStrings()) {
      if (where.endsWith(".source")) continue;
      for (const sentence of text.split(/(?<=[.;:?])\s+/)) assert.doesNotMatch(sentence, /^([^,.;:]{1,24}, ){2,}[^,.;:]{1,24}\.$/, `${where}: ${sentence}`);
    }
  });
  it("leaves no template token unfilled", () => {
    for (const s of issueText(model())) {
      if (tideWebStrings().some((t) => t.text === s)) continue;
      assert.doesNotMatch(s, /\{\w+\}/, s);
    }
  });
});

describe("the issue list", () => {
  it("has well-formed months, newest first, each pinned month before its issue", () => {
    assert.ok(TIDE_ISSUES.length >= 1);
    for (const e of TIDE_ISSUES) {
      assert.ok(isIssueMonth(e.issue), e.issue);
      if (e.data) assert.ok(isIssueMonth(e.data) && e.data < e.issue, `${e.issue}: ${e.data}`);
    }
    const months = TIDE_ISSUES.map((e) => e.issue);
    assert.deepEqual(months, [...months].sort().reverse());
    assert.equal(new Set(months).size, months.length);
  });
});

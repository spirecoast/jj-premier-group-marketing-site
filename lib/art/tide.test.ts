import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { sale } from "../issues/fixtures";
import { ART, TIDE_RAMP, hexToRgb, mix, ramp, rgbToHex } from "./palette";
import { dot, mark, n, polyline } from "./svg";
import { MIN_RIDGE_SALES, density, monthsEnding, ridgeMonths, ridgeline, type RidgeMonth } from "./tide";

describe("the luminous set", () => {
  test("hex round trip and mixing", () => {
    assert.deepEqual(hexToRgb("#89d4e3"), [137, 212, 227]);
    assert.deepEqual(hexToRgb("#fff"), [255, 255, 255]);
    assert.equal(rgbToHex([137, 212, 227]), "#89d4e3");
    assert.equal(mix(ART.sky, ART.mango, 0), ART.sky);
    assert.equal(mix(ART.sky, ART.mango, 1), ART.mango);
    assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
    assert.equal(mix("#000000", "#ffffff", 2), "#ffffff");
  });
  test("a ramp runs from its first stop to its last through the middle ones", () => {
    assert.equal(ramp(TIDE_RAMP, 0), TIDE_RAMP[0]);
    assert.equal(ramp(TIDE_RAMP, 1), TIDE_RAMP[TIDE_RAMP.length - 1]);
    assert.equal(ramp(["#000000", "#808080", "#ffffff"], 0.5), "#808080");
    assert.equal(ramp(["#123456"], 0.3), "#123456");
  });
});

describe("path data", () => {
  test("numbers at one decimal, never -0", () => {
    assert.equal(n(12.345), "12.3");
    assert.equal(n(-0.04), "0");
    assert.equal(n(7), "7");
    assert.equal(n(-3.25), "-3.2");
  });
  test("polyline, dot and mark", () => {
    assert.equal(
      polyline([
        [0, 0],
        [1.5, 2],
      ]),
      "M0 0L1.5 2",
    );
    assert.equal(dot(1, 2), "M1 2h.1");
    assert.equal(mark(1, 2, 3.33, 4), "M1 2L3.3 4");
  });
});

describe("the kernel density", () => {
  const grid = (from: number, to: number, step: number) => Array.from({ length: Math.round((to - from) / step) + 1 }, (_, i) => from + i * step);
  test("peaks at the data and is symmetric about it", () => {
    const xs = grid(4, 6, 0.01);
    const d = density([5, 5, 5], xs, 0.1);
    const peak = xs[d.indexOf(Math.max(...d))]!;
    assert.ok(Math.abs(peak - 5) < 0.011);
    assert.ok(Math.abs(d[xs.indexOf(4.8)]! - d[xs.indexOf(5.2)]!) < 1e-6);
  });
  test("integrates to one, so a tighter month peaks higher than a spread one", () => {
    const xs = grid(4, 7, 0.005);
    const tight = density([5, 5.01, 4.99, 5.02, 4.98], xs, 0.05);
    const spread = density([4.5, 4.8, 5, 5.2, 5.5], xs, 0.05);
    const area = (d: number[]) => d.reduce((a, b) => a + b, 0) * 0.005;
    assert.ok(Math.abs(area(tight) - 1) < 0.01, `tight integrates to ${area(tight)}`);
    assert.ok(Math.abs(area(spread) - 1) < 0.01, `spread integrates to ${area(spread)}`);
    assert.ok(Math.max(...tight) > Math.max(...spread));
  });
  test("nothing in, nothing out; a value beyond the grid is mass the curve does not carry", () => {
    const xs = grid(4, 6, 0.1);
    assert.ok(density([], xs, 0.1).every((v) => v === 0));
    assert.ok(density([5], [], 0.1).length === 0);
    assert.ok(density([5], xs, 0).every((v) => v === 0));
    const half = density([5, 50], xs, 0.05);
    assert.ok(Math.abs(half.reduce((a, b) => a + b, 0) * 0.1 - 0.5) < 0.02);
  });
});

describe("the ridge months", () => {
  test("months ending", () => {
    assert.deepEqual(monthsEnding("2026-07", 3), ["2026-05", "2026-06", "2026-07"]);
    assert.deepEqual(monthsEnding("2026-01", 2), ["2025-12", "2026-01"]);
  });
  test("only counted sales in the three markets, only months with enough of them, oldest first", () => {
    const rows = [];
    for (let i = 0; i < MIN_RIDGE_SALES; i += 1) rows.push(sale({ city: "LAKEWOOD RANCH", zip: "34202", saleDate: `2026-06-${String(1 + (i % 28)).padStart(2, "0")}`, salePrice: 500_000 + i }));
    for (let i = 0; i < MIN_RIDGE_SALES; i += 1) rows.push(sale({ county: "sarasota", city: "SARASOTA", zip: "34236", saleDate: `2026-07-${String(1 + (i % 28)).padStart(2, "0")}`, salePrice: 400_000 + i }));
    for (let i = 0; i < MIN_RIDGE_SALES - 1; i += 1) rows.push(sale({ saleDate: "2026-05-10", salePrice: 300_000 }));
    for (let i = 0; i < 60; i += 1) rows.push(sale({ county: "sarasota", city: "VENICE", zip: "34293", saleDate: "2026-07-10", salePrice: 450_000 }));
    for (let i = 0; i < 60; i += 1) rows.push(sale({ saleDate: "2026-07-11", salePrice: 2_000_000, propertyUse: "other" }));
    for (let i = 0; i < 60; i += 1) rows.push(sale({ saleDate: "2026-07-12", salePrice: 10_000, qualified: false, qualCode: "11" }));
    const months = ridgeMonths(rows, "2026-07", 4);
    assert.deepEqual(
      months.map((m) => [m.month, m.prices.length]),
      [
        ["2026-06", MIN_RIDGE_SALES],
        ["2026-07", MIN_RIDGE_SALES],
      ],
    );
    assert.equal(months[1]!.prices[0], 400_000);
    assert.deepEqual(ridgeMonths(rows, "2026-04", 24), []);
  });
});

describe("the ridgeline", () => {
  /** Three months: a tight one, a spread one, and a tight one higher up the price scale. */
  const months: RidgeMonth[] = [
    { month: "2026-05", prices: Array.from({ length: 200 }, (_, i) => 400_000 * (1 + 0.02 * Math.sin(i))) },
    { month: "2026-06", prices: Array.from({ length: 200 }, (_, i) => 200_000 + 3_000 * i) },
    { month: "2026-07", prices: Array.from({ length: 200 }, (_, i) => 700_000 * (1 + 0.02 * Math.cos(i))) },
  ];
  const W = 600;
  const H = 400;
  const g = ridgeline(months, { width: W, height: H, samples: 50, back: 0.4, front: 0.9, peak: 0.3 });
  const coords = (d: string) => [...d.matchAll(/(-?\d+(?:\.\d)?) (-?\d+(?:\.\d)?)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);

  test("one ridge per month, oldest first, back to front down the box", () => {
    assert.deepEqual(
      g.ridges.map((r) => r.month),
      ["2026-05", "2026-06", "2026-07"],
    );
    assert.deepEqual(
      g.ridges.map((r) => r.count),
      [200, 200, 200],
    );
    assert.deepEqual(
      g.ridges.map((r) => r.baseline),
      [0.4 * H, 0.65 * H, 0.9 * H],
    );
  });
  test("night at the back, first light at the front; the front stronger and wider", () => {
    assert.equal(g.ridges[0]!.color, TIDE_RAMP[0]);
    assert.equal(g.ridges[2]!.color, TIDE_RAMP[TIDE_RAMP.length - 1]);
    assert.ok(g.ridges[0]!.opacity < g.ridges[1]!.opacity && g.ridges[1]!.opacity < g.ridges[2]!.opacity);
    assert.ok(g.ridges[0]!.stroke < g.ridges[2]!.stroke);
    assert.equal(g.ridges[2]!.opacity, 1);
  });
  test("the tallest crest is the peak; a spread month sits lower than a tight one", () => {
    const crests = g.ridges.map((r) => r.crest);
    assert.ok(Math.abs(Math.max(...crests) - 0.3 * H) < 0.01);
    assert.ok(crests[1]! < crests[0]! && crests[1]! < crests[2]!);
    const dearer = (d: string) => {
      const pts = coords(d);
      let best = pts[0]!;
      for (const p of pts) if (p[1] < best[1]) best = p;
      return best[0];
    };
    assert.ok(dearer(g.ridges[2]!.d) > dearer(g.ridges[0]!.d), "the pricier month peaks further right");
  });
  test("each ridge is one open path from baseline to baseline, rounded to a tenth, inside the box", () => {
    for (const r of g.ridges) {
      assert.match(r.d, /^M-?\d+(\.\d)? -?\d+(\.\d)?(L-?\d+(\.\d)? -?\d+(\.\d)?)+$/);
      assert.doesNotMatch(r.d, /\.\d\d/);
      const pts = coords(r.d);
      assert.equal(pts.length, 50);
      assert.equal(pts[0]![1], r.baseline);
      assert.equal(pts[pts.length - 1]![1], r.baseline);
      assert.ok(pts.every(([, y]) => y >= 0 && y <= H));
      assert.ok(pts.every(([x]) => x >= -0.02 * W - 0.1 && x <= 1.02 * W + 0.1));
    }
  });
  test("empty data draws no ridges and no NaN", () => {
    const empty = ridgeline([], { width: W, height: H });
    assert.deepEqual(empty.ridges, []);
    assert.ok(Number.isFinite(empty.horizon.cx) && Number.isFinite(empty.horizon.ry));
    const one = ridgeline([months[0]!], { width: W, height: H });
    assert.equal(one.ridges.length, 1);
    assert.equal(one.ridges[0]!.baseline, 0.9 * H);
    assert.doesNotMatch(one.ridges[0]!.d, /NaN/);
  });
  test("a card head of twenty-four months stays lean", () => {
    const many: RidgeMonth[] = Array.from({ length: 24 }, (_, k) => ({ month: `m${k}`, prices: months[k % 3]!.prices }));
    const card = ridgeline(many, { width: 600, height: 400, samples: 110 });
    const bytes = card.ridges.reduce((a, r) => a + r.d.length, 0);
    assert.ok(bytes < 50_000, `${bytes} bytes of path data`);
    const wide = ridgeline(many, { width: 1440, height: 480, samples: 150 });
    assert.ok(wide.ridges.reduce((a, r) => a + r.d.length, 0) < 70_000);
  });
});

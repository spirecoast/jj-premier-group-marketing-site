import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { CATEGORY } from "../encore/categories";
import { SPOKE_ORDER, dayIndex, packLanes, seasonClock, type Perf, type Run } from "./encore";
import { ART } from "./palette";

const TODAY = "2026-10-02";
const BOX = { width: 600, height: 400, today: TODAY };

describe("days and lanes", () => {
  test("day index from today, across month ends and the clock change", () => {
    assert.equal(dayIndex(TODAY, TODAY), 0);
    assert.equal(dayIndex(TODAY, "2026-10-03"), 1);
    assert.equal(dayIndex(TODAY, "2026-10-01"), -1);
    assert.equal(dayIndex(TODAY, "2026-11-02"), 31);
    assert.equal(dayIndex(TODAY, "2027-10-02"), 365);
  });
  test("a run takes the innermost lane free from its opening day", () => {
    assert.deepEqual(
      packLanes(
        [
          { from: 0, to: 10 },
          { from: 5, to: 15 },
          { from: 12, to: 20 },
        ],
        9,
      ),
      [0, 1, 0],
    );
    assert.deepEqual(
      packLanes(
        [
          { from: 0, to: 10 },
          { from: 5, to: 15 },
        ],
        1,
      ),
      [0, -1],
    );
    assert.deepEqual(packLanes([], 3), []);
  });
});

describe("the season clock", () => {
  const perfs: Perf[] = [
    { day: TODAY, category: "music" },
    { day: TODAY, category: "theater" },
    { day: TODAY, category: "theater" },
    { day: "2026-12-25", category: "festival" },
    { day: "2026-10-01", category: "film" },
    { day: "2027-10-02", category: "film" },
  ];
  const runs: Run[] = [
    { from: "2026-10-10", to: "2026-10-20", category: "gallery" },
    { from: "2026-10-15", to: "2026-10-25", category: "gallery" },
    { from: "2026-09-01", to: "2026-09-20", category: "gallery" },
    { from: "2026-09-20", to: "2026-10-05", category: "theater" },
  ];
  const g = seasonClock(perfs, runs, BOX);
  const segs = (d: string) => [...d.matchAll(/M(-?\d+(?:\.\d)?) (-?\d+(?:\.\d)?)L(-?\d+(?:\.\d)?) (-?\d+(?:\.\d)?)/g)].map((m) => m.slice(1, 5).map(Number) as [number, number, number, number]);

  test("counts the year ahead and nothing else", () => {
    assert.equal(g.total, 4);
    assert.deepEqual(g.busiest, { day: TODAY, count: 3 });
    assert.deepEqual(
      g.spokes.map((s) => [s.category, s.count]),
      [
        ["theater", 2],
        ["music", 1],
        ["festival", 1],
      ],
    );
    assert.equal(g.days, 365);
    assert.equal(g.cx, 300);
    assert.equal(g.cy, 200);
  });
  test("today's strokes stack outward from the top of the ring, theater innermost", () => {
    const theater = segs(g.spokes[0]!.d);
    const music = segs(g.spokes[1]!.d);
    assert.equal(theater.length, 2);
    assert.equal(music.length, 1);
    for (const s of [...theater, ...music]) {
      assert.ok(Math.abs(s[0] - g.cx) < 0.11 && Math.abs(s[2] - g.cx) < 0.11, "straight up from the centre");
      assert.ok(s[1] < g.cy && s[3] < s[1], "pointing outward");
    }
    const r = (s: [number, number, number, number]) => g.cy - s[1];
    assert.ok(Math.abs(r(theater[0]!) - g.r0) < 0.11);
    assert.ok(r(theater[1]!) > r(theater[0]!) + 3);
    assert.ok(r(music[0]!) > r(theater[1]!) + 3);
    assert.ok(Math.abs(g.rMax - (g.cy - music[0]![3])) < 0.11);
    assert.ok(g.rMax <= g.height / 2);
  });
  test("each category draws in its own light, in the fixed band order", () => {
    for (const s of g.spokes) assert.equal(s.color, CATEGORY[s.category].art);
    assert.equal(CATEGORY.theater.art, ART.coral);
    assert.equal(new Set(Object.values(CATEGORY).map((c) => c.art)).size, 8);
    assert.deepEqual([...SPOKE_ORDER].sort(), Object.keys(CATEGORY).sort());
  });
  test("runs become arcs inside the ring, packed into lanes, the past left out", () => {
    assert.deepEqual(
      g.arcs.map((a) => [a.category, a.count]),
      [
        ["theater", 1],
        ["gallery", 2],
      ],
    );
    const radii = [...g.arcs[1]!.d.matchAll(/A(\d+(?:\.\d)?) /g)].map((m) => Number(m[1]));
    assert.equal(radii.length, 2);
    assert.ok(Math.abs(radii[0]! - (g.r0 - 10)) < 0.11);
    assert.ok(Math.abs(radii[1]! - (g.r0 - 13)) < 0.11);
    // The theater run opened before today: its arc starts at the top.
    const start = g.arcs[0]!.d.match(/^M(-?\d+(?:\.\d)?) (-?\d+(?:\.\d)?)/)!;
    assert.ok(Math.abs(Number(start[1]) - g.cx) < 0.11);
    assert.ok(Number(start[2]) < g.cy);
  });
  test("the ring, the month ticks and today's mark", () => {
    assert.ok(Math.abs(g.ring.dash[0] + g.ring.dash[1] - (2 * Math.PI * g.ring.r) / 365) < 0.02);
    assert.equal((g.months.match(/M/g) ?? []).length, 12);
    const today = segs(g.today)[0]!;
    assert.ok(Math.abs(today[0] - g.cx) < 0.11);
    assert.ok(today[1] < g.cy && today[3] < g.cy);
  });
  test("shift moves the centre; an empty season still draws the ring", () => {
    const left = seasonClock([], [], { ...BOX, shift: -0.05 });
    assert.equal(left.cx, 270);
    assert.deepEqual(left.spokes, []);
    assert.deepEqual(left.arcs, []);
    assert.equal(left.total, 0);
    assert.equal(left.busiest, null);
    assert.equal(left.rMax, left.r0);
  });
  test("a card's worth of a season stays lean and rounded", () => {
    const many: Perf[] = [];
    for (let i = 0; i < 365; i += 1) for (let k = 0; k < (i % 7 === 3 ? 24 : 6); k += 1) many.push({ day: new Date(Date.UTC(2026, 9, 2 + i)).toISOString().slice(0, 10), category: SPOKE_ORDER[k % 8]! });
    const big = seasonClock(many, [], BOX);
    assert.equal(big.total, many.length);
    const bytes = big.spokes.reduce((a, s) => a + s.d.length, 0);
    assert.ok(bytes < 110_000, `${bytes} bytes`);
    for (const s of big.spokes) assert.doesNotMatch(s.d, /\.\d\d/);
  });
});

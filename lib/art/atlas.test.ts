import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { LEVEL_RADIUS, MARKET_LIGHT, project, starChart, type Place } from "./atlas";
import { ART } from "./palette";

/**
 * Six places on a 0.3° strip of latitude, so a 400px-high frame puts a
 * degree at 1,333px: two areas 13px apart, a third 400px south; two
 * communities within a few px of the first area; one enclave off on its own.
 */
const PLACES: Place[] = [
  { lng: -82.5, lat: 27.5, level: "area", market: "bradenton" },
  { lng: -82.5, lat: 27.51, level: "area", market: "bradenton" },
  { lng: -82.5, lat: 27.2, level: "area", market: "sarasota" },
  { lng: -82.5, lat: 27.502, level: "community", market: "bradenton" },
  { lng: -82.5, lat: 27.505, level: "community", market: "lakewood-ranch" },
  { lng: -82.4, lat: 27.3, level: "enclave", market: "sarasota" },
];
const BOX = { width: 600, height: 400 };
const dots = (d: string) => [...d.matchAll(/M(-?\d+(?:\.\d)?) (-?\d+(?:\.\d)?)h\.1/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);

describe("the projection", () => {
  test("fits the places' latitude span to the frame's height, centred", () => {
    const p = project(PLACES, BOX);
    const ys = p.map((q) => q.y);
    assert.ok(Math.abs(Math.max(...ys) - Math.min(...ys) - 400) < 1e-6);
    assert.ok(Math.abs((Math.max(...ys) + Math.min(...ys)) / 2 - 200) < 1e-6);
    // Same longitude, same x; the strip sits left of centre, the enclave to the east of it.
    assert.equal(new Set(p.slice(0, 5).map((q) => q.x.toFixed(6))).size, 1);
    assert.ok(p[5]!.x > p[0]!.x);
    assert.equal(p[0]!.level, "area");
  });
  test("zoom overflows the frame and shift nudges it", () => {
    const z = project(PLACES, { ...BOX, zoom: 2 });
    const ys = z.map((q) => q.y);
    assert.ok(Math.abs(Math.max(...ys) - Math.min(...ys) - 800) < 1e-6);
    const s = project(PLACES, { ...BOX, shift: [0.1, -0.25] });
    assert.ok(Math.abs(s[0]!.x - project(PLACES, BOX)[0]!.x - 60) < 1e-6);
    assert.ok(Math.abs(s[0]!.y - project(PLACES, BOX)[0]!.y + 100) < 1e-6);
    assert.deepEqual(project([], BOX), []);
  });
});

describe("the star chart", () => {
  const g = starChart(PLACES, BOX);
  test("every place is a dot in its market's light, the bright stars drawn last", () => {
    assert.equal(g.shown, 6);
    assert.equal(
      g.dots.reduce((a, d) => a + d.count, 0),
      6,
    );
    assert.equal(g.dots[0]!.level, "enclave");
    assert.equal(g.dots[g.dots.length - 1]!.level, "area");
    for (const d of g.dots) {
      assert.equal(d.color, MARKET_LIGHT[d.market]);
      assert.equal(d.radius, LEVEL_RADIUS[d.level]);
      assert.equal(dots(d.d).length, d.count);
      assert.doesNotMatch(d.d, /\.\d\d/);
    }
    assert.equal(MARKET_LIGHT["lakewood-ranch"], ART.mango);
  });
  test("halos sit behind the areas only", () => {
    assert.deepEqual(
      g.halos.map((h) => [h.market, dots(h.d).length]),
      [
        ["bradenton", 2],
        ["sarasota", 1],
      ],
    );
    assert.ok(g.halos[0]!.radius > LEVEL_RADIUS.area);
  });
  test("figures join near areas; the web joins each community to its nearest neighbour, once", () => {
    assert.equal(g.figures.count, 1);
    assert.match(g.figures.d, /^M-?\d+(\.\d)? -?\d+(\.\d)?L-?\d+(\.\d)? -?\d+(\.\d)?$/);
    // The first community's nearest is the first area; the second's is the first community; the enclave has nothing near.
    assert.equal(g.web.count, 2);
    assert.equal(starChart(PLACES, { ...BOX, figures: { k: 2, within: 5 } }).figures.count, 0);
    assert.equal(starChart(PLACES, { ...BOX, web: { within: 1 } }).web.count, 0);
  });
  test("a figure is never drawn twice as a thread", () => {
    const near = starChart(PLACES, { ...BOX, web: { within: 50 } });
    const all = `${near.figures.d}${near.web.d}`;
    const segs = all.match(/M[^M]+/g) ?? [];
    assert.equal(new Set(segs.map((s) => s.replace(/^M(.+)L(.+)$/, (_, a, b) => [a, b].sort().join("|")))).size, segs.length);
  });
  test("places outside the frame are left out", () => {
    const tight = starChart(PLACES, { ...BOX, zoom: 4 });
    assert.ok(tight.shown < 6);
    assert.equal(
      tight.dots.reduce((a, d) => a + d.count, 0),
      tight.shown,
    );
    assert.deepEqual(starChart([], BOX).dots, []);
  });
  test("the dots scale with the frame", () => {
    const big = starChart(PLACES, { width: 1200, height: 800 });
    assert.equal(big.dots[big.dots.length - 1]!.radius, LEVEL_RADIUS.area * 2);
  });
});

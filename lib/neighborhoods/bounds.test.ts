import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { boundsOf, defaultBounds } from "./bounds";
import type { IndexEntry } from "./index-format";

function entry(s: string, m: IndexEntry["m"], x: number | null, y: number | null, r: 0 | 1 = 1): IndexEntry {
  return { s, n: s, a: [], l: "community", p: null, m, c: null, j: null, z: [], t: null, st: null, h: [], b: [], g: null, y, x, r, ba: 0, q: s, w: null, ho: null, cd: null, ev: null };
}

describe("map bounds", () => {
  it("boxes the points and ignores entries without one", () => {
    assert.deepEqual(boundsOf([entry("a", "sarasota", -82.6, 27.3), entry("b", "sarasota", -82.4, 27.5), entry("c", "sarasota", null, null)]), [-82.6, 27.3, -82.4, 27.5]);
    assert.equal(boundsOf([entry("c", "sarasota", null, null)]), null);
    assert.equal(boundsOf([]), null);
  });
  it("computes the opening view for the whole catalog and for each market, registry names included", () => {
    const entries = [
      entry("a", "sarasota", -82.6, 27.3),
      entry("b", "sarasota", -82.5, 27.35, 0),
      entry("c", "lakewood-ranch", -82.4, 27.4),
      entry("d", "bradenton", -82.55, 27.5),
    ];
    const d = defaultBounds(entries, ["lakewood-ranch", "sarasota", "bradenton"]);
    assert.deepEqual(d.all, [-82.6, 27.3, -82.4, 27.5]);
    assert.deepEqual(d.byMarket.sarasota, [-82.6, 27.3, -82.5, 27.35]);
    assert.deepEqual(d.byMarket["lakewood-ranch"], [-82.4, 27.4, -82.4, 27.4]);
    assert.deepEqual(d.byMarket.bradenton, [-82.55, 27.5, -82.55, 27.5]);
  });
});

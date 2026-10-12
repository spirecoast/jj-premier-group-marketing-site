import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { IndexEntry } from "./index-format";
import { sortMatches, unknownCount, type Fact, type Match } from "./match";

const fact = (state: Fact["state"]): Fact => ({ id: "gated", label: "Gated", state });
const m = (n: string, states: Fact["state"][], miles: number | null = null): Match => ({
  entry: { s: n.toLowerCase(), n } as IndexEntry,
  facts: states.map(fact),
  confirmed: states.every((s) => s === "match"),
  miles,
});

describe("Atlas Match order", () => {
  const list = [m("Cedar", ["match", "unknown", "unknown"]), m("Birch", ["match", "match", "match"], 4), m("Aspen", ["match", "match", "unknown"], 2), m("Alder", ["match", "match", "match"])];

  test("best fit puts places confirmed on every answer first, then the fewest unknowns, then A to Z", () => {
    assert.deepEqual(sortMatches(list, "fit").map((x) => x.entry.n), ["Alder", "Birch", "Aspen", "Cedar"]);
  });

  test("A to Z and nearest first are unchanged", () => {
    assert.deepEqual(sortMatches(list, "name").map((x) => x.entry.n), ["Alder", "Aspen", "Birch", "Cedar"]);
    assert.deepEqual(sortMatches(list, "distance").map((x) => x.entry.n), ["Aspen", "Birch", "Alder", "Cedar"]);
  });

  test("unknowns are counted per place", () => {
    assert.equal(unknownCount(list[0]!), 2);
    assert.equal(unknownCount(list[1]!), 0);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECENT_MAX, pushRecent, recentEntry } from "./recent";

describe("recent streets on Tide Street", () => {
  it("keeps the street and the ZIP, never the house number", () => {
    assert.deepEqual(recentEntry("14447 Lilac Sky Ter", "34211"), { street: "Lilac Sky Ter", zip: "34211" });
    assert.deepEqual(recentEntry("  gulf of   mexico dr ", ""), { street: "gulf of mexico dr", zip: "" });
    assert.deepEqual(recentEntry("9th Ave NW", "Bradenton"), { street: "9th Ave NW", zip: "Bradenton" });
    assert.equal(recentEntry("14447", "34211"), null);
    assert.equal(recentEntry("a", ""), null);
  });
  it("moves a repeat to the front and keeps five", () => {
    let list = pushRecent([], { street: "A St", zip: "1" });
    for (const s of ["B St", "C St", "D St", "E St", "F St"]) list = pushRecent(list, { street: s, zip: "" });
    assert.equal(list.length, RECENT_MAX);
    assert.equal(list[0]!.street, "F St");
    assert.ok(!list.some((x) => x.street === "A St"), "the oldest falls off");
    list = pushRecent(list, { street: "c st", zip: "" });
    assert.equal(list[0]!.street, "c st");
    assert.equal(list.filter((x) => x.street.toLowerCase() === "c st").length, 1);
  });
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { EncoreIndex } from "./index-format";
import { MAX_DAYS, buildPlan, normalizeDates, parsePlanState, planSearch, presetDates } from "./plan";

// 2026-10-14 is a Wednesday; the 17th and 18th are the weekend.
const TODAY = "2026-10-14";

/** Thirty productions across five categories, each playing at two in the afternoon and at half past seven, every day from the 14th to the 18th. */
const INDEX: EncoreIndex = (() => {
  const cats = ["music", "theater", "gallery", "talks", "film"] as const;
  const events = Array.from({ length: 30 }, (_, i) => ({ s: `show-${i}`, t: `Show ${i}`, c: cats[i % 5]!, v: `venue-${i % 8}`, vn: `Venue ${i % 8}`, m: "sarasota" as const }));
  const perfs: EncoreIndex["perfs"] = [];
  for (const day of ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]) {
    events.forEach((_, i) => {
      perfs.push([i, day, "14:00", 0, 0]);
      perfs.push([i, day, "19:30", 0, 0]);
    });
  }
  return { generated: TODAY, events, perfs, venues: [] };
})();

describe("Encore Planner", () => {
  test("a plan runs up to a month, and longer ranges are trimmed", () => {
    assert.equal(MAX_DAYS, 31);
    const d = normalizeDates(TODAY, "2026-12-31", TODAY);
    assert.equal(d.trimmed, true);
    assert.equal(d.to, "2026-11-13");
  });

  test("the quick ranges start today and run the days they name", () => {
    assert.deepEqual(presetDates("week", TODAY), ["2026-10-14", "2026-10-20"]);
    assert.deepEqual(presetDates("fortnight", TODAY), ["2026-10-14", "2026-10-27"]);
    assert.deepEqual(presetDates("month", TODAY), ["2026-10-14", "2026-11-12"]);
    assert.deepEqual(presetDates("weekend", TODAY), ["2026-10-16", "2026-10-18"]);
  });

  test("someone who lives here round-trips through the link", () => {
    const { state } = parsePlanState({ from: "2026-10-14", to: "2026-10-20", who: "local" }, TODAY);
    assert.equal(state.local, true);
    assert.match(planSearch(state), /who=local/);
    assert.equal(parsePlanState({ from: "2026-10-14" }, TODAY).state.local, false);
  });

  test("a visit gets an afternoon pick on weekends only; a local plan gets one every day", () => {
    const base = { from: "2026-10-14", to: "2026-10-18", markets: [], categories: [], eveningsOnly: false };
    const visit = buildPlan(INDEX, { ...base, local: false }, TODAY);
    assert.deepEqual(
      visit.days.filter((d) => d.matinee).map((d) => d.day),
      ["2026-10-17", "2026-10-18"],
    );
    const local = buildPlan(INDEX, { ...base, local: true }, TODAY);
    assert.equal(local.days.filter((d) => d.matinee).length, 5);
    const none = buildPlan(INDEX, { ...base, local: true, eveningsOnly: true }, TODAY);
    assert.equal(none.days.filter((d) => d.matinee).length, 0);
  });

  test("no production is picked twice in a plan", () => {
    const plan = buildPlan(INDEX, { from: "2026-10-14", to: "2026-10-18", markets: [], categories: [], eveningsOnly: false, local: true }, TODAY);
    const slugs = plan.days.flatMap((d) => [...(d.matinee ? [d.matinee] : []), ...d.picks]).map((o) => o.e.s);
    assert.equal(slugs.length, 20); // five days, an afternoon and three evening picks each
    assert.equal(new Set(slugs).size, slugs.length);
  });
});

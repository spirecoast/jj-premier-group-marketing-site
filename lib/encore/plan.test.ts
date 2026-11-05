import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { EncoreIndex } from "./index-format";
import { ALL_MARKETS, MAX_DAYS, buildPlan, normalizeDates, parsePlanState, planHref, planSearch, presetDates, stayDays } from "./plan";

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

  test("all three places are on unless a link names some, and old links mean what they meant", () => {
    const none = parsePlanState({ from: "2026-10-16", to: "2026-10-18" }, TODAY).state;
    assert.deepEqual(none.markets, ["lakewood-ranch", "sarasota", "bradenton"]);
    assert.deepEqual(none.markets, [...ALL_MARKETS]);
    // An empty or unknown market reads as all three, as it always has.
    assert.deepEqual(parsePlanState({ from: "2026-10-16", market: "" }, TODAY).state.markets, [...ALL_MARKETS]);
    assert.deepEqual(parsePlanState({ from: "2026-10-16", market: "tampa" }, TODAY).state.markets, [...ALL_MARKETS]);
    // A link that names places keeps them, in its order.
    assert.deepEqual(parsePlanState({ from: "2026-10-16", market: "bradenton,sarasota" }, TODAY).state.markets, ["bradenton", "sarasota"]);
  });

  test("a plan with all three writes the same link as before, without market", () => {
    const { state } = parsePlanState({ from: "2026-10-16", to: "2026-10-18" }, TODAY);
    assert.equal(planHref(state), "/calendar/plan?from=2026-10-16&to=2026-10-18");
    assert.equal(planSearch({ ...state, markets: ["sarasota"] }), "?from=2026-10-16&to=2026-10-18&market=sarasota");
    // Every place in another order still says which order to visit them in.
    assert.match(planSearch({ ...state, markets: ["bradenton", "sarasota", "lakewood-ranch"] }), /market=bradenton%2Csarasota%2Clakewood-ranch/);
    // A form left with none comes back with all three.
    assert.deepEqual(parsePlanState(new URLSearchParams(planSearch({ ...state, markets: [] })), TODAY).state.markets, [...ALL_MARKETS]);
  });

  test("an old link with no market rotates through the places as it did", () => {
    const { state } = parsePlanState({ from: "2026-10-14", to: "2026-10-16" }, TODAY);
    assert.deepEqual(
      stayDays(state).map((d) => d.markets),
      [["lakewood-ranch"], ["sarasota"], ["bradenton"]],
    );
    assert.deepEqual(stayDays({ ...state, markets: [] }), stayDays(state));
  });

  test("one day is a plan: from and to the same day", () => {
    const { state } = parsePlanState({ from: "2026-10-17", to: "2026-10-17", who: "local" }, TODAY);
    assert.equal(planSearch(state), "?from=2026-10-17&to=2026-10-17&who=local");
    assert.equal(buildPlan(INDEX, state, TODAY).days.length, 1);
    // A link with only from is that one day.
    assert.equal(parsePlanState({ from: "2026-10-17" }, TODAY).state.to, "2026-10-17");
  });
});

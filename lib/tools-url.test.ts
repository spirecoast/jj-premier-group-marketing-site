import assert from "node:assert/strict";
import { test } from "node:test";
import { encoreHref, encoreSearch, parseEncoreState, ENCORE_KEYS } from "./encore/url";
import { PLAN_KEYS, parsePlanState, planSearch, readPlanDraft } from "./encore/plan";
import { EMPTY_ANSWERS, MATCH_KEYS, matchHref, parseMatch, type MatchState } from "./neighborhoods/match";
import { EXPLORER_KEYS, explorerAddress, explorerHref, parseState, stateToSearch } from "./neighborhoods/url";
import { MOVE_STEPS, RELOCATE_KEYS, answersToQuery, parseAnswers, readMoveDraft } from "./relocate/url";

/*
 * The tools' links (lib/url-state.ts): every state a tool writes reads back
 * the same, the address bar never carries what was typed, and the key lists
 * the pages use to wait for a link's state cover what each parser reads.
 */

const sp = (search: string) => new URLSearchParams(search.replace(/^\?/, ""));

test("explorer: a view round-trips, and the address bar leaves out the search words and the map", () => {
  const view = { q: "lakewood", filters: { market: "sarasota" as const, gated: true as const }, place: "the-lake-club", map: { zoom: 12.5, lat: 27.4, lng: -82.4 } };
  const back = parseState(sp(stateToSearch(view)));
  assert.deepEqual(back.filters, { market: "sarasota", gated: true, level: undefined, type: undefined, status: undefined, registry: undefined });
  assert.equal(back.q, "lakewood");
  assert.equal(back.place, "the-lake-club");
  assert.deepEqual(back.map, { zoom: 12.5, lat: 27.4, lng: -82.4 });
  const address = explorerAddress(view);
  assert.equal(address, "/neighborhoods?market=sarasota&gated=1&place=the-lake-club");
  assert.ok(!/[?&](q|map)=/.test(address));
  assert.ok(explorerHref(view).includes("q=lakewood"), "the shared link keeps them");
  for (const k of new URL(explorerHref(view), "https://x").searchParams.keys()) assert.ok((EXPLORER_KEYS as readonly string[]).includes(k), k);
});

test("encore: a view round-trips, and every key it writes is one the page waits for", () => {
  const s = { view: "month" as const, date: "2026-11-14", category: "music" as const, market: "sarasota" as const, venue: "van-wezel", q: "jazz", when: undefined, list: ["a", "b"] };
  assert.deepEqual(parseEncoreState(sp(encoreSearch(s))), s);
  assert.equal(encoreHref({}), "/calendar");
  for (const k of sp(encoreSearch(s)).keys()) assert.ok((ENCORE_KEYS as readonly string[]).includes(k), k);
  // A shortcut is a Days view on today, and its key is one the page waits for too.
  const w = { view: "days" as const, date: "", category: undefined, market: undefined, venue: undefined, q: "", when: "weekend" as const, list: [] };
  assert.deepEqual(parseEncoreState(sp(encoreSearch(w))), w);
  for (const k of sp(encoreSearch(w)).keys()) assert.ok((ENCORE_KEYS as readonly string[]).includes(k), k);
});

test("encore planner: a plan round-trips and a stored draft is read back safely", () => {
  const today = "2026-10-27";
  const { state } = parsePlanState(sp("from=2026-11-02&to=2026-11-05&market=sarasota&cat=music,theater&evenings=1&who=local"), today);
  assert.deepEqual(parsePlanState(sp(planSearch(state)), today).state, state);
  for (const k of sp(planSearch(state)).keys()) assert.ok((PLAN_KEYS as readonly string[]).includes(k), k);
  assert.deepEqual(readPlanDraft({ search: planSearch(state), q: 2 }), { search: planSearch(state), q: 2 });
  assert.equal(readPlanDraft({ search: "from=x", q: 2 }), null);
  assert.equal(readPlanDraft("nonsense"), null);
  assert.equal(readPlanDraft({ search: "?from=2026-11-02", q: 99 })?.q, 3);
});

test("match: answers and the step round-trip", () => {
  const s: MatchState = { answers: { ...EMPTY_ANSWERS, market: ["sarasota", "bradenton"], homes: ["villa"], gated: true, hoa: true, evac: "c", near: { kind: "area", slug: "palmer-ranch" }, within: 10 }, step: 4 };
  const back = parseMatch(sp(matchHref(s).split("?")[1]!));
  assert.deepEqual(back, s);
  for (const k of sp(matchHref(s).split("?")[1]!).keys()) assert.ok((MATCH_KEYS as readonly string[]).includes(k), k);
  assert.equal(matchHref({ answers: EMPTY_ANSWERS, step: null }), "/neighborhoods/match");
});

test("move: a plan's answers round-trip, and the stored draft reads in both of its shapes", () => {
  const today = "2026-10-27";
  const a = parseAnswers({ in: "2027-02-15", path: "buying", sell: "no", from: "ny", county: "manatee", fin: "cash", off: "3" }, today);
  const query = answersToQuery(a);
  assert.deepEqual(parseAnswers(Object.fromEntries(sp(query)), today), a);
  for (const k of sp(query).keys()) assert.ok((RELOCATE_KEYS as readonly string[]).includes(k), k);
  assert.deepEqual(readMoveDraft(JSON.stringify({ query, mode: "questions", step: 3, reached: 3 })), { query, mode: "questions", step: 3, reached: 3 });
  assert.deepEqual(readMoveDraft(query), { query, mode: "plan", step: 0, reached: MOVE_STEPS }, "the bare query earlier versions stored");
  assert.equal(readMoveDraft(JSON.stringify({ query, step: 40 }))?.step, MOVE_STEPS - 1);
  assert.equal(readMoveDraft("{oops"), null);
  assert.equal(readMoveDraft(null), null);
  assert.equal(readMoveDraft("utm_source=x"), null);
});

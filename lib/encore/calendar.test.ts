import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatEventWhen } from "../content/format";
import type { EncoreIndex } from "./index-format";
import { nextMatchDay, timeLabel, weekendOf } from "./select";
import { varyStock } from "./stock";
import { encoreSearch, parseEncoreState } from "./url";
import { isAllDayKind, untimedLabel } from "./when";

const idx: EncoreIndex = {
  generated: "2026-10-27T00:00:00Z",
  venues: [{ s: "van-wezel", n: "Van Wezel", m: "sarasota" }],
  events: [
    { s: "jazz-night", t: "Jazz Night", c: "music", sc: "jazz", v: "van-wezel", vn: "Van Wezel", m: "sarasota", sum: "An evening of jazz standards." },
    { s: "dracula", t: "Dracula", c: "theater", sc: "play", v: "van-wezel", vn: "Van Wezel", m: "sarasota" },
    { s: "art-walk", t: "First Friday Art Walk", c: "gallery", sc: "art-walk", v: "van-wezel", vn: "Van Wezel", m: "sarasota" },
  ],
  perfs: [
    [1, "2026-10-28", "", 1761652800000, 1761652800000],
    [2, "2026-11-06", "", 1762430400000, 1762430400000],
    [0, "2026-11-12", "19:30", 1763000000000, 1763007200000],
    [0, "2026-12-03", "19:30", 1764800000000, 1764807200000],
  ],
};

describe("the URL state", () => {
  test("a date in the past is dropped when today is known", () => {
    assert.equal(parseEncoreState({ date: "2025-01-01" }, "2026-10-27").date, "");
    assert.equal(parseEncoreState({ date: "2027-09-01" }, "2026-10-27").date, "2027-09-01");
    assert.equal(parseEncoreState({ date: "2025-01-01" }).date, "2025-01-01", "without today nothing is clamped");
  });
  test("when=tonight and when=weekend are Days views on today and round-trip", () => {
    const s = parseEncoreState({ when: "weekend", view: "month", date: "2026-12-01", category: "music" }, "2026-10-27");
    assert.equal(s.when, "weekend");
    assert.equal(s.view, "days");
    assert.equal(s.date, "");
    assert.equal(encoreSearch(s), "?when=weekend&category=music");
    assert.equal(parseEncoreState({ when: "someday" }).when, undefined);
    assert.equal(encoreSearch({ view: "month", date: "2026-12-01" }), "?view=month&date=2026-12-01");
  });
});

describe("empty states and the strip", () => {
  test("nextMatchDay names the first later day with a match on the filter", () => {
    assert.equal(nextMatchDay(idx, "2026-10-28", "2027-10-27", { q: "jazz" }), "2026-11-12");
    assert.equal(nextMatchDay(idx, "2026-11-13", "2027-10-27", { q: "jazz" }), "2026-12-03");
    assert.equal(nextMatchDay(idx, "2026-10-28", "2027-10-27", { category: "film" }), undefined);
    assert.equal(nextMatchDay(idx, "2026-10-28", "2026-11-01", { category: "music" }), undefined, "stays inside the window");
  });
  test("the weekend is Friday to Sunday, or the rest of it", () => {
    assert.deepEqual(weekendOf("2026-10-27"), ["2026-10-30", "2026-11-01"]); // a Tuesday
    assert.deepEqual(weekendOf("2026-10-31"), ["2026-10-31", "2026-11-01"]); // a Saturday
    assert.deepEqual(weekendOf("2026-11-01"), ["2026-11-01", "2026-11-01"]); // a Sunday
  });
});

describe("a listing with no time", () => {
  test("is all day only for an all-day kind of thing", () => {
    assert.equal(isAllDayKind("gallery", "exhibition"), true);
    assert.equal(isAllDayKind("festival"), true);
    assert.equal(isAllDayKind("market", "market"), true);
    assert.equal(isAllDayKind("theater", "play"), false);
    assert.equal(isAllDayKind("music", "jazz"), false);
    assert.equal(isAllDayKind("gallery", "talk"), false, "a talk at a gallery has a start time");
    assert.equal(isAllDayKind("theater", "other"), false);
    assert.equal(untimedLabel("theater", "play"), "Time not listed");
    assert.equal(untimedLabel("gallery", "art-walk"), "All day");
  });
  test("the time label follows the rule, and a timed one is a clock", () => {
    assert.equal(timeLabel({ time: "", e: idx.events[1]! }), "Time not listed");
    assert.equal(timeLabel({ time: "", e: idx.events[2]! }), "All day");
    assert.equal(timeLabel({ time: "19:30", e: idx.events[0]! }), "7:30 PM");
  });
  test("formatEventWhen says the day alone for an unknown time", () => {
    assert.equal(formatEventWhen("2026-10-25T16:00:00.000Z", undefined, true, "unknown"), "Sunday, Oct 25");
    assert.equal(formatEventWhen("2026-10-25T16:00:00.000Z", undefined, true), "Sunday, Oct 25 · All day");
  });
});

describe("stand-in art in a list", () => {
  test("never repeats a photo within a theme's pool size, and leaves a themeless item undefined", () => {
    const items = Array.from({ length: 9 }, (_, i) => ({ category: "gallery" as const, subcategory: "exhibition", seed: `show-${i}` }));
    const picks = varyStock(items) as number[];
    assert.equal(picks.length, 9);
    for (let i = 1; i < picks.length; i++) assert.notEqual(picks[i], picks[i - 1], `cards ${i - 1} and ${i}`);
    for (let i = 2; i < picks.length; i++) assert.notEqual(picks[i], picks[i - 2], `cards ${i - 2} and ${i}`);
  });
  test("a card alone keeps the slug's own pick", () => {
    const one = varyStock([{ category: "music", subcategory: "chamber", seed: "boz" }]);
    assert.equal(one.length, 1);
    assert.equal(typeof one[0], "number");
  });
});

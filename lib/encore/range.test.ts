import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { addMonths, clampDay, daysInMonth, dayWords, keyTarget, monthTitle, monthWeeks, pickDay, planBounds, previewRange, rangeWords, spanDays, type RangePick } from "./range";

// 2026-11-05 is a Thursday.
const TODAY = "2026-11-05";

describe("Planner calendar: months", () => {
  test("it offers today through a year ahead", () => {
    assert.deepEqual(planBounds(TODAY), { min: "2026-11-05", max: "2027-11-05" });
    assert.equal(clampDay("2026-11-01", "2026-11-05", "2027-11-05"), "2026-11-05");
    assert.equal(clampDay("2028-01-01", "2026-11-05", "2027-11-05"), "2027-11-05");
  });

  test("months step across a year", () => {
    assert.equal(addMonths("2026-11", 1), "2026-12");
    assert.equal(addMonths("2026-12", 1), "2027-01");
    assert.equal(addMonths("2027-01", -1), "2026-12");
    assert.equal(addMonths("2026-11", 12), "2027-11");
    assert.equal(monthTitle("2027-02"), "February 2027");
  });

  test("a month's weeks start on Sunday, with blanks either side", () => {
    // November 2026 starts on a Sunday and has 30 days: five weeks.
    const nov = monthWeeks("2026-11");
    assert.equal(nov.length, 5);
    assert.equal(nov[0]![0], "2026-11-01");
    assert.deepEqual(nov[4], ["2026-11-29", "2026-11-30", null, null, null, null, null]);
    // February 2027 starts on a Monday.
    const feb = monthWeeks("2027-02");
    assert.equal(feb[0]![0], null);
    assert.equal(feb[0]![1], "2027-02-01");
    assert.equal(feb.flat().filter(Boolean).length, daysInMonth("2027-02"));
    assert.equal(daysInMonth("2028-02"), 29);
  });
});

describe("Planner calendar: tapping days", () => {
  const start: RangePick = { from: "2026-11-06", to: "2026-11-08", anchor: null };

  test("one tap is one day, ready to plan", () => {
    assert.deepEqual(pickDay(start, "2026-11-14"), { from: "2026-11-14", to: "2026-11-14", anchor: "2026-11-14" });
  });

  test("a second tap on a later day makes a range", () => {
    const one = pickDay(start, "2026-11-14");
    assert.deepEqual(pickDay(one, "2026-11-17"), { from: "2026-11-14", to: "2026-11-17", anchor: null });
  });

  test("tapping the same day again keeps it as one day", () => {
    const one = pickDay(start, "2026-11-14");
    assert.deepEqual(pickDay(one, "2026-11-14"), { from: "2026-11-14", to: "2026-11-14", anchor: null });
  });

  test("after a range, the next tap starts again", () => {
    const range = pickDay(pickDay(start, "2026-11-14"), "2026-11-17");
    assert.deepEqual(pickDay(range, "2026-11-20"), { from: "2026-11-20", to: "2026-11-20", anchor: "2026-11-20" });
  });

  test("an earlier day, or one past the longest plan, starts again from there", () => {
    const one = pickDay(start, "2026-11-14");
    assert.deepEqual(pickDay(one, "2026-11-10"), { from: "2026-11-10", to: "2026-11-10", anchor: "2026-11-10" });
    // 31 days from the 14th is December 14th; the 15th is one too many.
    assert.deepEqual(pickDay(one, "2026-12-14"), { from: "2026-11-14", to: "2026-12-14", anchor: null });
    assert.deepEqual(pickDay(one, "2026-12-15"), { from: "2026-12-15", to: "2026-12-15", anchor: "2026-12-15" });
  });

  test("the preview only shows a range the next tap would make", () => {
    assert.deepEqual(previewRange("2026-11-14", "2026-11-17"), ["2026-11-14", "2026-11-17"]);
    assert.equal(previewRange(null, "2026-11-17"), null);
    assert.equal(previewRange("2026-11-14", "2026-11-14"), null);
    assert.equal(previewRange("2026-11-14", "2026-11-10"), null);
    assert.equal(previewRange("2026-11-14", "2026-12-15"), null);
  });
});

describe("Planner calendar: the keyboard", () => {
  test("arrows move a day or a week, Home and End to the week's ends", () => {
    assert.equal(keyTarget("2026-11-05", "ArrowRight"), "2026-11-06");
    assert.equal(keyTarget("2026-11-01", "ArrowLeft"), "2026-10-31");
    assert.equal(keyTarget("2026-11-05", "ArrowDown"), "2026-11-12");
    assert.equal(keyTarget("2026-11-05", "ArrowUp"), "2026-10-29");
    assert.equal(keyTarget("2026-11-05", "Home"), "2026-11-01");
    assert.equal(keyTarget("2026-11-05", "End"), "2026-11-07");
  });

  test("Page Up and Page Down move a month, to the last day of a shorter one", () => {
    assert.equal(keyTarget("2026-11-05", "PageDown"), "2026-12-05");
    assert.equal(keyTarget("2026-11-05", "PageUp"), "2026-10-05");
    assert.equal(keyTarget("2027-01-31", "PageDown"), "2027-02-28");
    assert.equal(keyTarget("2026-12-31", "PageDown"), "2027-01-31");
  });

  test("other keys are left alone", () => {
    assert.equal(keyTarget("2026-11-05", "Enter"), null);
    assert.equal(keyTarget("2026-11-05", "a"), null);
  });
});

describe("Planner calendar: in words", () => {
  test("one day", () => {
    assert.equal(rangeWords("2026-11-08", "2026-11-08", TODAY), "Sunday, November 8");
    assert.equal(dayWords("2027-01-09", TODAY), "Saturday, January 9, 2027");
  });
  test("a range inside a month, across months, and across a year", () => {
    assert.equal(rangeWords("2026-11-08", "2026-11-11", TODAY), "November 8 to 11");
    assert.equal(rangeWords("2026-11-29", "2026-12-02", TODAY), "November 29 to December 2");
    assert.equal(rangeWords("2026-12-30", "2027-01-02", TODAY), "December 30 to January 2, 2027");
    assert.equal(rangeWords("2027-03-06", "2027-03-08", TODAY), "March 6 to 8, 2027");
  });
  test("the days a range covers count both ends", () => {
    assert.equal(spanDays("2026-11-08", "2026-11-08"), 1);
    assert.equal(spanDays("2026-11-08", "2026-11-11"), 4);
    assert.equal(spanDays("2026-11-29", "2026-12-02"), 4);
    assert.equal(spanDays("2026-03-07", "2026-03-09"), 3);
  });
});

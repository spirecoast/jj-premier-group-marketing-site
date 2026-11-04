import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEncoreIssue } from "../issues/encore-weekly";
import { FOOTER, encoreFixture } from "../issues/fixtures";
import { occurrences } from "../encore/select";
import { newslettersStrings } from "./copy";
import { checkFairHousing } from "../fair-housing";
import {
  ENCORE_LETTER_WEEKS,
  currentEncoreMonday,
  encoreLetterAnswer,
  encoreLetterPath,
  isMonday,
  listedEncoreWeeks,
  mondayOf,
  rangeWithYear,
  weekDrawing,
} from "./weeks";

describe("which Monday issue is out", () => {
  it("finds the Monday on or before a day", () => {
    assert.equal(mondayOf("2026-11-02"), "2026-11-02");
    assert.equal(mondayOf("2026-11-04"), "2026-11-02");
    assert.equal(mondayOf("2026-11-08"), "2026-11-02"); // Sunday
    assert.equal(mondayOf("2027-01-01"), "2026-12-28");
  });
  it("counts this week's issue as out from its send time, Monday 12:00 UTC", () => {
    assert.equal(currentEncoreMonday(new Date("2026-11-02T11:59:00Z")), "2026-10-26");
    assert.equal(currentEncoreMonday(new Date("2026-11-02T12:00:00Z")), "2026-11-02");
    assert.equal(currentEncoreMonday(new Date("2026-11-04T15:00:00Z")), "2026-11-02");
  });
  it("reads the day in Sarasota, not in UTC: Sunday night there is already Monday in UTC", () => {
    // 2026-11-09T03:00Z is Sunday, November 8 at 10pm in Sarasota.
    assert.equal(currentEncoreMonday(new Date("2026-11-09T03:00:00Z")), "2026-11-02");
  });
  it("knows a Monday", () => {
    assert.ok(isMonday("2026-11-02"));
    assert.ok(!isMonday("2026-11-03"));
    assert.ok(!isMonday("2026-02-30"));
    assert.ok(!isMonday("november"));
    assert.equal(encoreLetterPath("2026-11-02"), "/calendar/letters/2026-11-02");
  });
});

describe("the Mondays with a page", () => {
  const current = "2026-11-02";
  it("is this week's alone when nothing is on record", () => {
    assert.deepEqual(listedEncoreWeeks(current, null), [current]);
    assert.deepEqual(listedEncoreWeeks(current, []), [current]);
  });
  it("is the weeks on record as sent, newest first, the last four at most", () => {
    const sent = ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-10-26"];
    assert.equal(ENCORE_LETTER_WEEKS, 4);
    assert.deepEqual(listedEncoreWeeks(current, sent), ["2026-11-02", "2026-10-26", "2026-10-19", "2026-10-12"]);
  });
  it("leaves out a week not on record, even this one, and anything that isn't a past Monday", () => {
    assert.deepEqual(listedEncoreWeeks(current, ["2026-10-26", "2026-10-28", "2026-11-09"]), ["2026-10-26"]);
  });
  it("answers each address: the page, a pointer for an issue no longer kept, or nothing", () => {
    const listed = ["2026-11-02", "2026-10-26"];
    assert.equal(encoreLetterAnswer("2026-11-02", listed, current), "page");
    assert.equal(encoreLetterAnswer("2026-10-19", listed, current), "gone");
    assert.equal(encoreLetterAnswer("2026-11-09", listed, current), "missing");
    assert.equal(encoreLetterAnswer("2026-11-03", listed, current), "missing");
    assert.equal(encoreLetterAnswer("latest", listed, current), "missing");
  });
});

describe("the web issue is the email's issue", () => {
  const index = encoreFixture();
  const issue = buildEncoreIssue({ index, today: "2026-10-05", footer: FOOTER });
  it("carries the title, the intro and the on-view count the email prints", () => {
    assert.equal(issue.title, "The week of October 5 to 11");
    assert.ok(issue.text.includes(issue.intro.slice(0, 40)));
    assert.ok(issue.onViewTotal >= issue.onView.length);
  });
  it("draws the week from the performances the issue counts, with every pick marked once", () => {
    const occs = occurrences(index, issue.period.from, issue.period.to, {});
    const days = weekDrawing(occs, issue.picks, issue.period.from);
    assert.equal(days.length, 7);
    assert.equal(days[0]!.day, "2026-10-05");
    assert.equal(days[6]!.day, "2026-10-11");
    assert.equal(days.reduce((n, d) => n + d.marks.length, 0), issue.performances);
    assert.equal(days.reduce((n, d) => n + d.marks.filter((m) => m.pick).length, 0), issue.picks.length);
  });
  it("names the year once, or both across a new year", () => {
    assert.equal(rangeWithYear("2026-11-02", "2026-11-08"), "November 2 to 8, 2026");
    assert.equal(rangeWithYear("2026-12-28", "2027-01-03"), "December 28, 2026 to January 3, 2027");
  });
});

describe("the words around the issues", () => {
  it("pass the Fair Housing check", () => {
    for (const { where, text } of newslettersStrings()) assert.ok(checkFairHousing(text).passed, where);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { monthYear } from "./format";

describe("monthYear", () => {
  it("names the month short by default and spelled out on request", () => {
    assert.equal(monthYear("2026-09-23"), "Sep 2026");
    assert.equal(monthYear("2026-09-23", "long"), "September 2026");
  });

  it("keeps the calendar day's month in every timezone", () => {
    assert.equal(monthYear("2026-10-01", "long"), "October 2026");
    assert.equal(monthYear("2026-09-30", "long"), "September 2026");
  });

  it("returns nothing for a missing or unreadable date", () => {
    assert.equal(monthYear(undefined), undefined);
    assert.equal(monthYear("not a date", "long"), undefined);
  });
});

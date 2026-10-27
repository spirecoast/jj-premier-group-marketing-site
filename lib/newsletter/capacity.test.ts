import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { capacityBeforeExpiry, checkCapacity, perIssueCapacity } from "./capacity";
import { sendExpiry } from "./schedule";

const at = (iso: string) => new Date(iso);

describe("capacityBeforeExpiry", () => {
  it("gives an Encore week seven runs from its Monday send to the Monday after", () => {
    // Week of Monday 2026-11-02; the send goes at 12:00 UTC and expires Monday 2026-11-09 04:00 UTC.
    const expiresAt = sendExpiry("encore", "2026-11-08", at("2026-11-02T12:00:00Z"));
    const c = capacityBeforeExpiry({ cap: 80, usedToday: 0, reservePerDay: 0, now: at("2026-11-02T12:00:00Z"), expiresAt });
    assert.deepEqual(c, { emails: 560, days: 7 });
  });
  it("counts what's left of today, then a full day less the usual confirmations", () => {
    const expiresAt = at("2026-11-09T04:00:00Z");
    const c = capacityBeforeExpiry({ cap: 80, usedToday: 50, reservePerDay: 4.2, now: at("2026-11-02T12:00:00Z"), expiresAt });
    // today 30, then six days of 80 - 5
    assert.deepEqual(c, { emails: 30 + 6 * 75, days: 7 });
  });
  it("leaves today out once its last run is over", () => {
    const expiresAt = at("2026-11-09T04:00:00Z");
    const c = capacityBeforeExpiry({ cap: 100, usedToday: 0, reservePerDay: 0, now: at("2026-11-02T18:00:00Z"), expiresAt });
    assert.deepEqual(c, { emails: 600, days: 6 });
  });
  it("keeps today while the catch-up run is under way", () => {
    const expiresAt = at("2026-11-09T04:00:00Z");
    const c = capacityBeforeExpiry({ cap: 100, usedToday: 40, reservePerDay: 0, now: at("2026-11-02T13:31:00Z"), expiresAt });
    assert.deepEqual(c, { emails: 60 + 600, days: 7 });
  });
  it("gives Tide fourteen runs, the last one before its 13:00 expiry", () => {
    const scheduled = at("2026-11-03T13:00:00Z");
    const c = capacityBeforeExpiry({ cap: 100, usedToday: 0, reservePerDay: 0, now: scheduled, expiresAt: sendExpiry("tide", "2026-10-31", scheduled) });
    assert.deepEqual(c, { emails: 1400, days: 14 });
  });
  it("is nothing for a send that has expired", () => {
    assert.deepEqual(capacityBeforeExpiry({ cap: 100, usedToday: 0, reservePerDay: 0, now: at("2026-11-09T05:00:00Z"), expiresAt: at("2026-11-09T04:00:00Z") }), { emails: 0, days: 0 });
  });
  it("never counts below zero when the confirmations alone fill a day", () => {
    const c = capacityBeforeExpiry({ cap: 10, usedToday: 25, reservePerDay: 30, now: at("2026-11-02T12:00:00Z"), expiresAt: at("2026-11-04T04:00:00Z") });
    assert.deepEqual(c, { emails: 0, days: 2 });
  });
});

describe("checkCapacity", () => {
  it("says how many would be left unsent", () => {
    assert.deepEqual(checkCapacity(700, { emails: 560, days: 7 }), { emails: 560, days: 7, pending: 700, short: 140, fits: false });
    assert.equal(checkCapacity(560, { emails: 560, days: 7 }).fits, true);
  });
});

describe("perIssueCapacity", () => {
  it("is the cap less the usual confirmations, times the days an issue has", () => {
    assert.equal(perIssueCapacity(80, 0, 7), 560);
    assert.equal(perIssueCapacity(80, 2.5, 14), 1078);
    assert.equal(perIssueCapacity(5, 9, 7), 0);
  });
});

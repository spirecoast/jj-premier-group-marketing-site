import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayHere, dayIn, msUntilNextDay } from "./time";

describe("today as a calendar day", () => {
  it("reads the day in a named time zone, not the UTC day", () => {
    // 23:30 on October 26 in New York (EDT, UTC-4) is 03:30 on October 27 in UTC.
    const late = new Date("2026-10-27T03:30:00Z");
    assert.equal(late.toISOString().slice(0, 10), "2026-10-27");
    assert.equal(dayIn("America/New_York", late), "2026-10-26");
    // The same instant in Los Angeles is still the 26th; in Tokyo it is the 27th.
    assert.equal(dayIn("America/Los_Angeles", late), "2026-10-26");
    assert.equal(dayIn("Asia/Tokyo", late), "2026-10-27");
  });

  it("reads the day on the local clock", () => {
    const d = new Date(2026, 9, 26, 23, 30); // local 23:30 on October 26, wherever the test runs
    assert.equal(dayHere(d), "2026-10-26");
    assert.equal(dayHere(new Date(2026, 0, 1, 0, 0, 1)), "2026-01-01");
  });

  it("knows how long until the next day in a zone", () => {
    const read = (d: Date) => dayIn("America/New_York", d);
    const late = new Date("2026-10-27T03:30:00Z"); // 23:30 EDT
    const ms = msUntilNextDay(read, late);
    // Thirty minutes to midnight, plus the one-second margin, to the minute.
    assert.ok(ms >= 30 * 60_000 && ms <= 31 * 60_000 + 1000, `got ${ms}`);
    assert.equal(read(new Date(late.getTime() + ms)), "2026-10-27");
    // At the fall-back weekend the day is 25 hours long; the timer still reaches the next day.
    const dst = new Date("2026-11-01T04:30:00Z"); // 00:30 EDT on November 1, the night clocks go back
    const ms2 = msUntilNextDay(read, dst);
    assert.equal(read(new Date(dst.getTime() + ms2)), "2026-11-02");
    assert.equal(read(new Date(dst.getTime() + ms2 - 90_000)), "2026-11-01");
  });

  it("never returns less than a second", () => {
    const read = () => "same";
    assert.ok(msUntilNextDay(read, new Date()) >= 1000);
  });
});

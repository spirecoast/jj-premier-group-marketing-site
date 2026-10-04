import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { easternWhen, holdDecision, initialHold, nominalSendTime, scheduledSendTime, sendDecision, sendExpiry, type IssueSendStatus } from "./schedule";

const d = (s: string) => new Date(s);

describe("when each issue goes out", () => {
  it("Tide: prepared on the 1st at 12:00 UTC, sent on the 3rd at 13:00 UTC (9am in Sarasota in October)", () => {
    const at = scheduledSendTime("tide", "2026-07", d("2026-10-01T12:00:05Z"));
    assert.equal(at.toISOString(), "2026-10-03T13:00:00.000Z");
    assert.equal(easternWhen(at), "Saturday, October 3 at 9:00 AM");
  });
  it("Encore: previewed Monday 10:00 UTC, sent the same Monday at 12:00 UTC", () => {
    const at = scheduledSendTime("encore", "2026-10-05", d("2026-10-05T10:00:03Z"));
    assert.equal(at.toISOString(), "2026-10-05T12:00:00.000Z");
    assert.equal(easternWhen(at), "Monday, October 5 at 8:00 AM");
  });
  it("in winter the same UTC hour is an hour earlier in Sarasota", () => {
    assert.equal(easternWhen(nominalSendTime("tide", "2026-10", d("2027-01-01T12:00:00Z"))), "Sunday, January 3 at 8:00 AM");
  });
  it("a send set up late still leaves a window to hold it", () => {
    // Tide re-run by hand on the 3rd after 13:00: a day from now, not at once.
    assert.equal(scheduledSendTime("tide", "2026-07", d("2026-10-03T15:00:00Z")).toISOString(), "2026-10-04T15:00:00.000Z");
    // Encore preview that ran late on Monday: an hour from now.
    assert.equal(scheduledSendTime("encore", "2026-10-05", d("2026-10-05T11:30:00Z")).toISOString(), "2026-10-05T12:30:00.000Z");
  });
  it("Encore ends with its week; Tide two weeks after its date", () => {
    assert.equal(sendExpiry("encore", "2026-10-11", d("2026-10-05T12:00:00Z")).toISOString(), "2026-10-12T04:00:00.000Z");
    assert.equal(sendExpiry("tide", "2026-07-31", d("2026-10-03T13:00:00Z")).toISOString(), "2026-10-17T13:00:00.000Z");
  });
});

describe("hold or send", () => {
  const row = (status: IssueSendStatus) => ({ status, scheduledFor: d("2026-10-03T13:00:00Z"), expiresAt: d("2026-10-17T13:00:00Z") });
  const before = d("2026-10-02T09:00:00Z");
  const after = d("2026-10-03T13:00:01Z");

  it("waits until it's time, then sends", () => {
    assert.equal(sendDecision(row("scheduled"), before), "wait");
    assert.equal(sendDecision(row("scheduled"), d("2026-10-03T13:00:00Z")), "send");
    assert.equal(sendDecision(row("scheduled"), after), "send");
  });
  it("a held issue isn't sent when its time comes", () => {
    assert.equal(sendDecision(row("held"), after), "held");
  });
  it("“Send it now” releases a hold, or sends before the time", () => {
    assert.equal(sendDecision(row("held"), after, true), "send");
    assert.equal(sendDecision(row("held"), before, true), "send");
    assert.equal(sendDecision(row("scheduled"), before, true), "send");
  });
  it("a send cut short by the cap carries on", () => {
    assert.equal(sendDecision(row("sending"), after), "send");
  });
  it("never sends twice, and never after its window, even when pressed", () => {
    assert.equal(sendDecision(row("sent"), after), "done");
    assert.equal(sendDecision(row("sent"), after, true), "done");
    assert.equal(sendDecision(row("scheduled"), d("2026-10-17T13:00:00Z")), "expired");
    assert.equal(sendDecision(row("held"), d("2026-10-20T00:00:00Z"), true), "expired");
    assert.equal(sendDecision(row("expired"), before, true), "expired");
  });
  it("the hold link holds a send that hasn't finished, and leaves the rest alone", () => {
    assert.equal(holdDecision("scheduled"), "hold");
    assert.equal(holdDecision("sending"), "hold");
    assert.equal(holdDecision("held"), "already_held");
    assert.equal(holdDecision("sent"), "already_sent");
    assert.equal(holdDecision("expired"), "expired");
  });
  it("starts held for a Fair Housing flag, a month that isn't complete, or a missing postal address", () => {
    assert.equal(initialHold({ fairHousingPassed: true, issueHold: null, addressComplete: true }), null);
    assert.match(initialHold({ fairHousingPassed: false, issueHold: null, addressComplete: true })!, /Fair Housing/);
    assert.equal(initialHold({ fairHousingPassed: true, issueHold: "July 2026 isn't complete", addressComplete: true }), "July 2026 isn't complete");
    assert.match(initialHold({ fairHousingPassed: true, issueHold: null, addressComplete: false })!, /street address/);
  });
});

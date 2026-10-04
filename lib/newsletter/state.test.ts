import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RESEND_CONFIRM_AFTER_MS, transition, type SubscriptionState } from "./state";
import { listsForLead } from "./lists";

const NOW = new Date("2026-10-04T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const ctx = { suppressed: false, now: NOW };
const pending = (sentAgo = RESEND_CONFIRM_AFTER_MS + 1): SubscriptionState => ({ status: "pending", confirmationSentAt: ago(sentAgo), welcomeSentAt: null });
const confirmed = (welcome = true): SubscriptionState => ({ status: "confirmed", confirmationSentAt: ago(86_400_000), welcomeSentAt: welcome ? ago(3_600_000) : null });
const unsubscribed: SubscriptionState = { status: "unsubscribed", confirmationSentAt: ago(86_400_000), welcomeSentAt: ago(86_400_000) };

describe("the subscription state machine", () => {
  it("a first sign-up is pending and gets one confirmation", () => {
    assert.deepEqual(transition(null, "request", ctx), { next: "pending", send: "confirmation", outcome: "requested" });
  });

  it("signing up again while pending resends, but not within ten minutes", () => {
    assert.deepEqual(transition(pending(60_000), "request", ctx), { next: null, send: null, outcome: "too_soon" });
    assert.deepEqual(transition(pending(), "request", ctx), { next: "pending", send: "confirmation", outcome: "resent" });
    // A pending row whose confirmation never went (Resend was down) gets one now.
    assert.equal(transition({ status: "pending", confirmationSentAt: null, welcomeSentAt: null }, "request", ctx).send, "confirmation");
  });

  it("signing up again once confirmed sends nothing", () => {
    assert.deepEqual(transition(confirmed(), "request", ctx), { next: null, send: null, outcome: "already_confirmed" });
  });

  it("signing up after unsubscribing from the list starts over with a confirmation", () => {
    assert.deepEqual(transition(unsubscribed, "request", ctx), { next: "pending", send: "confirmation", outcome: "requested" });
  });

  it("confirming a pending subscription confirms it and sends the welcome", () => {
    assert.deepEqual(transition(pending(), "confirm", ctx), { next: "confirmed", send: "welcome", outcome: "confirmed" });
  });

  it("confirming twice sends one welcome", () => {
    assert.deepEqual(transition(confirmed(true), "confirm", ctx), { next: null, send: null, outcome: "already_confirmed" });
    // Confirmed but the welcome never went: the second press sends it.
    assert.deepEqual(transition(confirmed(false), "confirm", ctx), { next: null, send: "welcome", outcome: "already_confirmed" });
  });

  it("an old confirm link after an unsubscribe changes nothing", () => {
    assert.deepEqual(transition(unsubscribed, "confirm", ctx), { next: null, send: null, outcome: "not_pending" });
    assert.deepEqual(transition(null, "confirm", ctx), { next: null, send: null, outcome: "not_pending" });
  });

  it("unsubscribing works from any state and sends nothing", () => {
    for (const s of [pending(), confirmed()]) assert.deepEqual(transition(s, "unsubscribe", ctx), { next: "unsubscribed", send: null, outcome: "unsubscribed" });
    assert.deepEqual(transition(unsubscribed, "unsubscribe", ctx), { next: null, send: null, outcome: "already_unsubscribed" });
    assert.deepEqual(transition(null, "unsubscribe", ctx), { next: null, send: null, outcome: "already_unsubscribed" });
  });

  it("an address flagged unsubscribed_email is never emailed, not even a confirmation, and can't be confirmed", () => {
    const off = { suppressed: true, now: NOW };
    for (const s of [null, pending(), unsubscribed]) {
      assert.deepEqual(transition(s, "request", off), { next: null, send: null, outcome: "suppressed" });
      assert.deepEqual(transition(s, "confirm", off), { next: null, send: null, outcome: "suppressed" });
    }
    assert.deepEqual(transition(confirmed(), "request", off), { next: null, send: null, outcome: "suppressed" });
    // It can still unsubscribe.
    assert.equal(transition(confirmed(), "unsubscribe", off).next, "unsubscribed");
  });
});

describe("which lists a form asks for", () => {
  it("the Tide box is Tide and the Encore box is Encore, consent or not", () => {
    assert.deepEqual(listsForLead("letter", true), ["tide"]);
    assert.deepEqual(listsForLead("calendar", true), ["encore"]);
    assert.deepEqual(listsForLead("letter", false), ["tide"]);
  });
  it("the email box on another form is Tide; without it, nothing", () => {
    assert.deepEqual(listsForLead("contact", true), ["tide"]);
    assert.deepEqual(listsForLead("valuation", true), ["tide"]);
    assert.deepEqual(listsForLead("contact", false), []);
    assert.deepEqual(listsForLead("review-permission", false), []);
  });
});

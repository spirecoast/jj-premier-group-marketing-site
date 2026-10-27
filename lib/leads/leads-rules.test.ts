import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { echoLine, linkIn } from "../last-lead";
import { backoffMs, afterFailure, alarmOnFailure, OUTBOX_MAX_ATTEMPTS } from "../lead-outbox-policy";
import { RATE_LIMITS, guardKey, windowStart } from "../lead-guard-keys";
import { leadSinkProblem, type LeadSinks } from "../lead-sinks";
import { parsePhone } from "../phone";
import { LEAD_FORMS } from "./constants";
import { LEAD_FORM_FIELD_NAMES, PIXEL_VISIBLE_FIELDS, fieldName } from "./pixel";
import { FIELD_ORDER, LEAD_MESSAGES, isEmail, summaryLead, validateLead } from "./rules";
import { parseLead } from "./schema";

describe("phone numbers", () => {
  it("tidies a US number however it was typed", () => {
    for (const raw of ["9415550100", "941-555-0100", "(941) 555-0100", "941.555.0100", "+1 941 555 0100", "1 (941) 555-0100"]) {
      const p = parsePhone(raw);
      assert.deepEqual(p, { display: "(941) 555-0100", e164: "+19415550100", country: "US" }, raw);
    }
  });

  it("refuses what isn't a phone number", () => {
    for (const raw of ["", "941", "555-0100", "call me after 5", "941555010", "94155501000", "(041) 555-0100", "(941) 155-0100", "1 041 555 0100"]) {
      assert.equal(parsePhone(raw), null, raw);
    }
  });

  it("keeps an international number in E.164 and as typed", () => {
    assert.deepEqual(parsePhone("+44 20  7946 0958"), { display: "+44 20 7946 0958", e164: "+442079460958", country: "intl" });
    assert.equal(parsePhone("+44 12"), null);
  });
});

describe("the form rules, shared by the browser and the server", () => {
  const person = { firstName: "Pat", email: "pat@example.com", phone: "" };

  it("an email or a phone is enough where the form shows both", () => {
    assert.deepEqual(validateLead("contact", person), {});
    assert.deepEqual(validateLead("contact", { firstName: "Pat", email: "", phone: "941 555 0100" }), {});
    assert.equal(validateLead("contact", { firstName: "Pat", email: "", phone: "" }).email, LEAD_MESSAGES.reach);
  });

  it("an email is required where the form has no phone box, and on the subscribe bars and the review permission", () => {
    assert.equal(validateLead("listing", { firstName: "Pat", email: "" }).email, LEAD_MESSAGES.emailRequired);
    assert.equal(validateLead("letter", { email: "" }).email, LEAD_MESSAGES.emailRequired);
    assert.equal(validateLead("review-permission", { firstName: "Pat", email: "", phone: "941 555 0100", message: "Thanks", reviewConsent: "on" }).email, LEAD_MESSAGES.emailRequired);
    assert.deepEqual(validateLead("letter", { email: "pat@example.com" }), {});
  });

  it("a typed phone has to be a real number, and a typed email a real address", () => {
    assert.equal(validateLead("contact", { ...person, phone: "call me after 5" }).phone, LEAD_MESSAGES.phone);
    assert.equal(validateLead("contact", { ...person, email: "not-an-email" }).email, LEAD_MESSAGES.emailOrBlank);
    assert.equal(validateLead("letter", { email: "maria@" }).email, LEAD_MESSAGES.emailRequired);
  });

  it("names the fields in the order they sit on the form", () => {
    const e = validateLead("valuation", { firstName: "", email: "x", phone: "1", address: "" });
    assert.deepEqual(Object.keys(e).sort((a, b) => FIELD_ORDER.indexOf(a as never) - FIELD_ORDER.indexOf(b as never)), ["firstName", "email", "phone", "address"]);
    assert.equal(summaryLead(2), "Two things to fix above:");
    assert.equal(summaryLead(1), "One thing to fix above:");
  });

  it("checks email addresses plainly", () => {
    for (const ok of ["pat@example.com", "Pat.O'Neil+home@sub.example.co.uk"]) assert.ok(isEmail(ok), ok);
    for (const bad of ["", "pat", "pat@", "pat@example", "pat @example.com", "pat@exa mple.com", "@example.com"]) assert.equal(isEmail(bad), false, bad);
  });

  it("the server schema runs the same rules and tidies what it keeps", () => {
    const bad = parseLead({ form: "contact", firstName: "", email: "", phone: "941" });
    assert.equal(bad.ok, false);
    assert.deepEqual(!bad.ok && bad.errors, { firstName: LEAD_MESSAGES.firstName, phone: LEAD_MESSAGES.phone });

    const good = parseLead({ form: "contact", firstName: "Pat", email: "Pat@Example.COM", phone: "941.555.0100", consent: "on" });
    assert.ok(good.ok);
    if (good.ok) {
      assert.equal(good.data.email, "pat@example.com");
      assert.equal(good.data.phone, "(941) 555-0100");
      assert.equal(good.data.phoneE164, "+19415550100");
    }

    const phoneOnly = parseLead({ form: "buy", firstName: "Pat", email: "", phone: "(941) 555-0100" });
    assert.ok(phoneOnly.ok && phoneOnly.data.email === "");

    // A field nobody can see (a tampered hidden input) is reported apart from the visible ones.
    const tampered = parseLead({ form: "not-a-form", firstName: "Pat", email: "pat@example.com" });
    assert.ok(!tampered.ok && tampered.hidden.includes("form"));
  });

  it("a submission id is kept only when it's a UUID", () => {
    const ok = parseLead({ form: "letter", email: "pat@example.com", submissionId: "9B2F6C1E-3D4A-4F5B-8C6D-7E8F9A0B1C2D" });
    assert.ok(ok.ok && ok.data.submissionId === "9b2f6c1e-3d4a-4f5b-8c6d-7e8f9a0b1c2d");
    const junk = parseLead({ form: "letter", email: "pat@example.com", submissionId: "'; drop table leads" });
    assert.ok(junk.ok && junk.data.submissionId === undefined);
  });
});

describe("what Home Platform's pixel can see", () => {
  it("once the page is live, only the visitor's own name, email and phone and the two questions keep a name", () => {
    const named = LEAD_FORM_FIELD_NAMES.filter((n) => "name" in fieldName(n, true));
    assert.deepEqual(named.sort(), [...PIXEL_VISIBLE_FIELDS].sort());
    for (const n of ["message", "address", "referredName", "referredLastName", "referredEmail", "referredPhone", "referredPlan"]) {
      assert.deepEqual(fieldName(n, true), { "data-private-name": n });
    }
  });

  it("before the page is live (and without JavaScript) every field posts under its name", () => {
    for (const n of LEAD_FORM_FIELD_NAMES) assert.deepEqual(fieldName(n, false), { name: n });
  });
});

describe("the lead outbox schedule", () => {
  const submitted = new Date("2026-10-27T12:00:00Z");
  it("waits longer after each failure and gives up after the sixth", () => {
    assert.deepEqual([1, 2, 3, 4, 5].map((n) => backoffMs(n) / 60_000), [1, 5, 15, 60, 240]);
    const now = new Date("2026-10-27T12:05:00Z");
    const step = afterFailure(2, submitted, now);
    assert.equal(step.status, "pending");
    assert.equal(step.status === "pending" && step.nextAttemptAt.toISOString(), "2026-10-27T12:10:00.000Z");
    assert.deepEqual(afterFailure(OUTBOX_MAX_ATTEMPTS, submitted, now), { status: "dead" });
  });

  it("gives up on a lead more than three days old", () => {
    assert.deepEqual(afterFailure(1, submitted, new Date("2026-10-30T12:00:01Z")), { status: "dead" });
  });

  it("raises the alarm when a sink dies, and at once when the team email fails with no CRM", () => {
    assert.equal(alarmOnFailure("crm", { status: "dead" }, 6, "webhook"), true);
    assert.equal(alarmOnFailure("crm", { status: "pending", nextAttemptAt: submitted }, 1, "webhook"), false);
    assert.equal(alarmOnFailure("team_email", { status: "pending", nextAttemptAt: submitted }, 1, "none"), true);
    assert.equal(alarmOnFailure("team_email", { status: "pending", nextAttemptAt: submitted }, 2, "none"), false);
    assert.equal(alarmOnFailure("team_email", { status: "pending", nextAttemptAt: submitted }, 1, "webhook"), false);
  });
});

describe("the lead guard's keys", () => {
  it("never store the address or email, and change with the window", () => {
    const now = new Date("2026-10-27T12:07:30Z");
    const start = windowStart(now, RATE_LIMITS.address.windowMinutes);
    assert.equal(start.toISOString(), "2026-10-27T12:00:00.000Z");
    const key = guardKey("address", "203.0.113.9", start);
    assert.ok(!key.includes("203.0.113.9"));
    assert.equal(key, guardKey("address", " 203.0.113.9 ", start));
    assert.notEqual(key, guardKey("address", "203.0.113.9", windowStart(new Date("2026-10-27T12:12:00Z"), 10)));
    assert.notEqual(guardKey("person", "pat@example.com", start), guardKey("address", "pat@example.com", start));
  });
});

describe("health: a person has to hear about a lead", () => {
  const sinks = (over: Partial<LeadSinks>): LeadSinks => ({
    postgres: true,
    crm: { provider: "none", configured: false },
    teamEmail: false,
    alerts: false,
    plausible: false,
    booking: false,
    humanSink: false,
    ...over,
  });
  it("the live site with only Postgres is unhealthy", () => {
    assert.equal(leadSinkProblem(sinks({}), { VERCEL_ENV: "production" }), "no-human-sink");
    assert.equal(leadSinkProblem(sinks({ teamEmail: true, humanSink: true }), { VERCEL_ENV: "production" }), null);
    assert.equal(leadSinkProblem(sinks({ crm: { provider: "webhook", configured: true }, humanSink: true }), { VERCEL_ENV: "production" }), null);
  });
  it("a preview only needs somewhere to keep the lead", () => {
    assert.equal(leadSinkProblem(sinks({}), { VERCEL_ENV: "preview", NODE_ENV: "production" }), null);
    assert.equal(leadSinkProblem(sinks({ postgres: false }), { VERCEL_ENV: "preview" }), "no-sink");
  });
});

describe("the thank-you page's echo", () => {
  it("says back the address, the timing and a house to sell", () => {
    assert.equal(echoLine({ form: "valuation", at: 0, address: "9403 9th Ave NW", timing: "Inside three months" }), "For 9403 9th Ave NW, moving inside three months.");
    assert.equal(echoLine({ form: "buy", at: 0, timing: "Just watching the market", sellFirst: "Yes" }), "Just watching the market, with a house to sell first.");
    assert.equal(echoLine({ form: "referral", at: 0, referred: "Sam" }), "For Sam.");
    assert.equal(echoLine({ form: "contact", at: 0 }), null);
  });
  it("finds the plan link a tool put in the message, on this site only", () => {
    const origin = "https://jjpremiergroup.com";
    assert.equal(linkIn("Arriving Friday.\nhttps://jjpremiergroup.com/calendar/plan?from=2026-11-06", origin), "https://jjpremiergroup.com/calendar/plan?from=2026-11-06");
    assert.equal(linkIn("See https://example.com/x", origin), undefined);
  });
  it("every form kind is known to the rules", () => {
    for (const f of LEAD_FORMS) assert.equal(typeof validateLead(f, { firstName: "Pat", email: "pat@example.com" }), "object");
  });
});

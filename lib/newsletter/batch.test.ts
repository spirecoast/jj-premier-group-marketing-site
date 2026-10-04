import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BATCH_SIZE, MAX_ATTEMPTS, batchIdempotencyKey, blocksResend, chunk, failureStatus, pendingRecipients, planBatches, remainingToday, utcDayStart, type DeliveryRecord, type Recipient } from "./batch";
import { DEFAULT_DAILY_CAP, disabledLine, newsletterConfig, parseDailyCap } from "./config";

const people = (n: number, from = 0): Recipient[] => Array.from({ length: n }, (_, i) => ({ subscriptionId: `s${i + from}`, email: `p${i + from}@example.com` }));

describe("batching", () => {
  it("never puts more than 100 in a call", () => {
    const { batches, sendNow, deferred } = planBatches(people(250), { cap: 1000, usedToday: 0 });
    assert.deepEqual(batches.map((b) => b.length), [100, 100, 50]);
    assert.equal(sendNow, 250);
    assert.equal(deferred, 0);
    assert.equal(BATCH_SIZE, 100);
    // Asking for bigger batches still gets 100.
    assert.ok(planBatches(people(250), { cap: 1000, usedToday: 0, batchSize: 500 }).batches.every((b) => b.length <= 100));
  });
  it("chunks evenly and refuses a size of zero", () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.deepEqual(chunk([], 100), []);
    assert.throws(() => chunk([1], 0));
  });
});

describe("the daily cap", () => {
  it("defaults to 100, Resend's free daily limit", () => {
    assert.equal(DEFAULT_DAILY_CAP, 100);
    assert.equal(parseDailyCap(undefined), 100);
    assert.equal(parseDailyCap(""), 100);
    assert.equal(parseDailyCap("abc"), 100);
    assert.equal(parseDailyCap("0"), 100);
    assert.equal(parseDailyCap("-5"), 100);
    assert.equal(parseDailyCap("3000"), 3000);
  });
  it("sends what fits today and leaves the rest for the next day's run", () => {
    const plan = planBatches(people(180), { cap: 100, usedToday: 0 });
    assert.equal(plan.sendNow, 100);
    assert.equal(plan.deferred, 80);
    assert.deepEqual(plan.batches.map((b) => b.length), [100]);
  });
  it("counts what already went today: confirmations, welcomes and issues alike", () => {
    const plan = planBatches(people(50), { cap: 100, usedToday: 70 });
    assert.equal(plan.sendNow, 30);
    assert.equal(plan.deferred, 20);
  });
  it("sends nothing once the cap is reached, and never goes negative", () => {
    assert.equal(remainingToday(100, 100), 0);
    assert.equal(remainingToday(100, 140), 0);
    assert.equal(remainingToday(100, -3), 100);
    const plan = planBatches(people(10), { cap: 100, usedToday: 100 });
    assert.deepEqual(plan, { batches: [], sendNow: 0, deferred: 10 });
  });
  it("the next day's run picks up exactly the ones left over", () => {
    const all = people(180);
    const day1 = planBatches(pendingRecipients(all, []), { cap: 100, usedToday: 0 });
    const sent: DeliveryRecord[] = day1.batches.flat().map((r) => ({ email: r.email, status: "sent", attempts: 1 }));
    const day2 = planBatches(pendingRecipients(all, sent), { cap: 100, usedToday: 0 });
    assert.equal(day2.sendNow, 80);
    const both = [...day1.batches.flat(), ...day2.batches.flat()].map((r) => r.email);
    assert.equal(new Set(both).size, 180, "everyone once, nobody twice");
  });
  it("days are UTC days", () => {
    assert.equal(utcDayStart(new Date("2026-10-05T03:59:00Z")).toISOString(), "2026-10-05T00:00:00.000Z");
    assert.equal(utcDayStart(new Date("2026-10-04T23:59:59Z")).toISOString(), "2026-10-04T00:00:00.000Z");
  });
});

describe("idempotency", () => {
  const subs = people(5);
  it("never picks an address that was sent, is being sent, or may have been sent", () => {
    const deliveries: DeliveryRecord[] = [
      { email: "p0@example.com", status: "sent", attempts: 1 },
      { email: "P1@Example.com", status: "claimed", attempts: 1 },
      { email: "p2@example.com", status: "unknown", attempts: 2 },
    ];
    assert.deepEqual(pendingRecipients(subs, deliveries).map((r) => r.email), ["p3@example.com", "p4@example.com"]);
  });
  it("retries a failure Resend reported, up to three attempts", () => {
    assert.equal(MAX_ATTEMPTS, 3);
    assert.equal(blocksResend({ status: "failed", attempts: 1 }), false);
    assert.equal(blocksResend({ status: "failed", attempts: 2 }), false);
    assert.equal(blocksResend({ status: "failed", attempts: 3 }), true);
    const deliveries: DeliveryRecord[] = [
      { email: "p0@example.com", status: "failed", attempts: 1 },
      { email: "p1@example.com", status: "failed", attempts: 3 },
    ];
    assert.deepEqual(pendingRecipients(subs, deliveries).map((r) => r.email), ["p0@example.com", "p2@example.com", "p3@example.com", "p4@example.com"]);
  });
  it("sends each address once, whatever its case or how many subscription rows it has", () => {
    const dupes: Recipient[] = [
      { subscriptionId: "a", email: "Same@Example.com" },
      { subscriptionId: "b", email: "same@example.com " },
      { subscriptionId: "c", email: "" },
    ];
    assert.deepEqual(pendingRecipients(dupes, []), [{ subscriptionId: "a", email: "same@example.com" }]);
  });
  it("a re-run after everything went sends nothing", () => {
    const deliveries = subs.map((s) => ({ email: s.email, status: "sent" as const, attempts: 1 }));
    assert.deepEqual(pendingRecipients(subs, deliveries), []);
  });
  it("keys a batch on the send, the day and the exact addresses, in any order", () => {
    const a = batchIdempotencyKey("send-1", ["b@x.com", "A@x.com"], "2026-10-03");
    assert.equal(a, batchIdempotencyKey("send-1", ["a@x.com", "b@x.com"], "2026-10-03"));
    assert.notEqual(a, batchIdempotencyKey("send-1", ["a@x.com", "c@x.com"], "2026-10-03"));
    assert.notEqual(a, batchIdempotencyKey("send-2", ["a@x.com", "b@x.com"], "2026-10-03"));
    assert.notEqual(a, batchIdempotencyKey("send-1", ["a@x.com", "b@x.com"], "2026-10-04"));
    assert.ok(a.length <= 256 && a.startsWith("issue-send-1-2026-10-03-"));
  });
  it("only a clear refusal is retried; no answer or a server error is never sent again on its own", () => {
    assert.equal(failureStatus(422), "failed");
    assert.equal(failureStatus(429), "failed");
    assert.equal(failureStatus(500), "unknown");
    assert.equal(failureStatus(503), "unknown");
    assert.equal(failureStatus(null), "unknown");
  });
});

describe("the switch", () => {
  const full = {
    RESEND_API_KEY: "re_x",
    NEWSLETTER_FROM: "JJ Premier Group <letters@mail.jjpremiergroup.com>",
    NEWSLETTER_SECRET: "s".repeat(32),
    UNSUBSCRIBE_SECRET: "u".repeat(32),
    DATABASE_URL: "postgresql://x",
  };
  it("is on with everything set", () => {
    const c = newsletterConfig(full);
    assert.equal(c.enabled, true);
    assert.deepEqual(c.missing, []);
    assert.equal(c.replyTo, null);
    assert.equal(c.dailyCap, 100);
  });
  it("is off without the key or the From, and says which", () => {
    const c = newsletterConfig({ ...full, RESEND_API_KEY: "", NEWSLETTER_FROM: undefined });
    assert.equal(c.enabled, false);
    assert.deepEqual(c.missing, ["RESEND_API_KEY", "NEWSLETTER_FROM"]);
    assert.match(disabledLine(c, "send"), /subscriber email is off \(missing RESEND_API_KEY, NEWSLETTER_FROM\)/);
  });
  it("is off with a short secret or no database", () => {
    assert.equal(newsletterConfig({ ...full, NEWSLETTER_SECRET: "short" }).enabled, false);
    assert.equal(newsletterConfig({ ...full, DATABASE_URL: "" }).enabled, false);
    assert.equal(newsletterConfig({ ...full, UNSUBSCRIBE_SECRET: "" }).enabled, false);
  });
  it("reads the reply-to and the cap", () => {
    const c = newsletterConfig({ ...full, NEWSLETTER_REPLY_TO: " team@jjpremiergroup.com ", NEWSLETTER_DAILY_CAP: "250" });
    assert.equal(c.replyTo, "team@jjpremiergroup.com");
    assert.equal(c.dailyCap, 250);
  });
});

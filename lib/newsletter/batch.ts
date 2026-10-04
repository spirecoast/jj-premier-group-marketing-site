import { createHash } from "node:crypto";

/**
 * Who gets the next batch of an issue, and how many fit today. Pure: the
 * store reads the confirmed subscribers and the deliveries already recorded,
 * and these functions decide.
 *
 * - Resend's batch endpoint takes at most 100 emails a call (BATCH_SIZE).
 * - NEWSLETTER_DAILY_CAP bounds every subscriber email the site sends in a
 *   UTC day (confirmations, welcomes and issues together; Resend's free plan
 *   allows 100 a day). Whatever doesn't fit waits for the next day's run.
 * - A recipient with a delivery that is sent, claimed or of unknown outcome
 *   is never picked again: that is what makes a re-run safe. Only a failure
 *   Resend reported for certain (it answered, and said no) is retried, up to
 *   MAX_ATTEMPTS.
 */

export const BATCH_SIZE = 100;
export const MAX_ATTEMPTS = 3;
/** Between two batch calls, to stay well under Resend's default of 2 requests a second. */
export const BATCH_GAP_MS = 1_000;

export type DeliveryStatus = "claimed" | "sent" | "failed" | "unknown";

export type Recipient = { subscriptionId: string; email: string };
export type DeliveryRecord = { email: string; status: DeliveryStatus; attempts: number };

/** Start of the UTC day `now` falls in. */
export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Emails still allowed today. */
export function remainingToday(cap: number, usedToday: number): number {
  return Math.max(0, Math.floor(cap) - Math.max(0, usedToday));
}

/** True when a recorded delivery means "don't send this address this issue again". */
export function blocksResend(d: Pick<DeliveryRecord, "status" | "attempts">, maxAttempts = MAX_ATTEMPTS): boolean {
  return d.status !== "failed" || d.attempts >= maxAttempts;
}

/**
 * The confirmed subscribers still owed this issue: each address once
 * (case-insensitive), leaving out any with a delivery that blocks a resend.
 * Keeps the order given (the store orders by confirmation time).
 */
export function pendingRecipients(subscribers: Recipient[], deliveries: DeliveryRecord[], maxAttempts = MAX_ATTEMPTS): Recipient[] {
  const done = new Set(deliveries.filter((d) => blocksResend(d, maxAttempts)).map((d) => d.email.toLowerCase()));
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of subscribers) {
    const e = r.email.trim().toLowerCase();
    if (!e || done.has(e) || seen.has(e)) continue;
    seen.add(e);
    out.push({ ...r, email: e });
  }
  return out;
}

export function chunk<T>(items: T[], size = BATCH_SIZE): T[][] {
  if (size < 1) throw new Error("chunk size must be at least 1");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Today's share of the pending recipients, in batches of at most
 * `batchSize`, and how many wait for the next day.
 */
export function planBatches<T>(pending: T[], opts: { cap: number; usedToday: number; batchSize?: number }): { batches: T[][]; sendNow: number; deferred: number } {
  const room = remainingToday(opts.cap, opts.usedToday);
  const now = pending.slice(0, room);
  return { batches: chunk(now, Math.min(opts.batchSize ?? BATCH_SIZE, BATCH_SIZE)), sendNow: now.length, deferred: pending.length - now.length };
}

/**
 * Resend's Idempotency-Key for one batch: the send, the UTC day and the exact
 * addresses, so a retry of the same batch within Resend's 24-hour window is
 * answered from the first call instead of sending twice. The day keeps a
 * refused batch retried the next day from getting the old refusal back.
 */
export function batchIdempotencyKey(issueSendId: string, emails: string[], day: string): string {
  const h = createHash("sha256").update([...emails].map((e) => e.toLowerCase()).sort().join("\n")).digest("hex").slice(0, 32);
  return `issue-${issueSendId}-${day}-${h}`;
}

/**
 * What a failed call means for its recipients. Resend answered with a 4xx
 * (a bad request, the rate limit or the daily quota): nothing was sent, so
 * they can be tried again. A 5xx or no answer at all: it may have been sent,
 * so they're marked unknown and never sent automatically again.
 */
export function failureStatus(httpStatus: number | null): Extract<DeliveryStatus, "failed" | "unknown"> {
  return httpStatus !== null && httpStatus >= 400 && httpStatus < 500 ? "failed" : "unknown";
}

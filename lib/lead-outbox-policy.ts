/**
 * When the lead outbox (lib/lead-outbox.ts) tries a sink again, and when it
 * gives up. Pure, so the schedule is tested on its own.
 *
 * A sink is the CRM webhook or the team email. The first attempt runs right
 * after the visitor's request returns; each failure waits longer before the
 * next one (1, 5, 15, 60 minutes, then 4 hours), and the sixth failure, or a
 * lead more than three days old, marks it dead. Retries run whenever the
 * outbox is swept: after every new lead, and from the daily cron
 * (/api/cron/lead-redeliver; Vercel's Hobby plan allows one run a day).
 */

export type OutboxSink = "crm" | "team_email";

export const OUTBOX_MAX_ATTEMPTS = 6;
export const OUTBOX_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];

/** How long to wait after the `attempts`-th failure before trying again. */
export function backoffMs(attempts: number): number {
  const i = Math.min(Math.max(attempts, 1), BACKOFF_MINUTES.length) - 1;
  return BACKOFF_MINUTES[i]! * 60_000;
}

export type FailureStep = { status: "pending"; nextAttemptAt: Date } | { status: "dead" };

/** What to record after a failed attempt: try again later, or give up. */
export function afterFailure(attempts: number, submittedAt: Date, now: Date = new Date()): FailureStep {
  if (attempts >= OUTBOX_MAX_ATTEMPTS) return { status: "dead" };
  if (now.getTime() - submittedAt.getTime() > OUTBOX_MAX_AGE_MS) return { status: "dead" };
  return { status: "pending", nextAttemptAt: new Date(now.getTime() + backoffMs(attempts)) };
}

/**
 * Whether a failure should raise the alarm that doesn't depend on Resend
 * (an error-level log line tagged [lead-alarm], plus Sentry when it's on).
 * Always when a sink dies. On the first failure, too, for the team email when
 * there's no CRM to fall back on: with CRM_PROVIDER=none the email is the
 * only thing that tells a person, so a broken email must not stay quiet.
 */
export function alarmOnFailure(sink: OutboxSink, step: FailureStep, attempts: number, crmProvider: string): boolean {
  if (step.status === "dead") return true;
  return sink === "team_email" && attempts === 1 && crmProvider === "none";
}

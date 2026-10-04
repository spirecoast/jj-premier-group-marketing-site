/**
 * One address's subscription to one list, as a small state machine. Pure:
 * the store (lib/newsletter/store.ts) reads the row, asks `transition` what
 * happens, writes the result and sends the email it names.
 *
 *   (none) ──request──▶ pending ──confirm──▶ confirmed ──unsubscribe──▶ unsubscribed
 *                          ▲                                                │
 *                          └──────────────────request───────────────────────┘
 *
 * - A request (a form) on a new or unsubscribed address makes it pending and
 *   sends one confirmation email. Asking again while pending sends another,
 *   but not more often than RESEND_CONFIRM_AFTER_MS, so nobody can fill an
 *   inbox by submitting a form over and over.
 * - Confirming works only from pending, and sends the welcome once.
 *   An old confirm link clicked after an unsubscribe changes nothing.
 * - Unsubscribing works from any state and sends nothing.
 * - `suppressed` is contacts.unsubscribed_email on any row for the address:
 *   the authoritative "never email this address". A suppressed address is
 *   never sent anything, a confirmation included, and can't be confirmed.
 *   Only a person clearing that flag (docs/ISSUES.md) lets it sign up again.
 */

export type SubscriptionStatus = "pending" | "confirmed" | "unsubscribed";

export type SubscriptionState = {
  status: SubscriptionStatus;
  confirmationSentAt: Date | null;
  welcomeSentAt: Date | null;
} | null;

export type SubscriptionEvent = "request" | "confirm" | "unsubscribe";

export type Transition = {
  /** The status to write; null leaves the row as it is (or absent). */
  next: SubscriptionStatus | null;
  /** The email to send as a result, if any. */
  send: "confirmation" | "welcome" | null;
  /** What happened, for the logs, the events table and the confirm page. */
  outcome:
    | "requested"
    | "resent"
    | "too_soon"
    | "already_confirmed"
    | "confirmed"
    | "not_pending"
    | "unsubscribed"
    | "already_unsubscribed"
    | "suppressed";
};

/** A second confirmation email for the same address and list waits at least this long. */
export const RESEND_CONFIRM_AFTER_MS = 10 * 60 * 1000;

export function transition(state: SubscriptionState, event: SubscriptionEvent, ctx: { suppressed: boolean; now: Date }): Transition {
  if (event === "unsubscribe") {
    if (state?.status === "unsubscribed") return { next: null, send: null, outcome: "already_unsubscribed" };
    return { next: state ? "unsubscribed" : null, send: null, outcome: state ? "unsubscribed" : "already_unsubscribed" };
  }
  if (ctx.suppressed) return { next: null, send: null, outcome: "suppressed" };

  if (event === "request") {
    if (!state || state.status === "unsubscribed") return { next: "pending", send: "confirmation", outcome: "requested" };
    if (state.status === "confirmed") return { next: null, send: null, outcome: "already_confirmed" };
    // pending: resend, but not too often.
    const last = state.confirmationSentAt?.getTime() ?? 0;
    if (ctx.now.getTime() - last < RESEND_CONFIRM_AFTER_MS) return { next: null, send: null, outcome: "too_soon" };
    return { next: "pending", send: "confirmation", outcome: "resent" };
  }

  // confirm
  if (!state) return { next: null, send: null, outcome: "not_pending" };
  if (state.status === "confirmed") return { next: null, send: state.welcomeSentAt ? null : "welcome", outcome: "already_confirmed" };
  if (state.status === "unsubscribed") return { next: null, send: null, outcome: "not_pending" };
  return { next: "confirmed", send: "welcome", outcome: "confirmed" };
}

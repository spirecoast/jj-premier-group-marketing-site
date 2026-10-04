/**
 * When an issue goes to subscribers, and whether it goes now. Pure.
 *
 *   Tide:   built and previewed to the team on the 1st (12:00 UTC); sent on
 *           the 3rd at 13:00 UTC (9am in Sarasota in daylight time, 8am in
 *           winter), so the team has two days to read it, write the story and
 *           the notes, or hold it.
 *   Encore: previewed Monday 10:00 UTC; sent the same Monday at 12:00 UTC.
 *
 * A send that's created late (a manual re-run after the nominal time, or a
 * missed cron) never goes out without a window to hold it: it's pushed to
 * at least MIN_LEAD_MS after it was created.
 *
 * Each send also has an end: an Encore issue is about one week and is
 * pointless after it, and a Tide issue that hasn't gone out within two weeks
 * of its date waits for the next month instead.
 */

export type IssueKindName = "tide" | "encore";
export type IssueSendStatus = "scheduled" | "held" | "sending" | "sent" | "expired";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Encore's preview runs two hours before its send; an hour of slack lets a preview a few seconds late keep the nominal time.
export const MIN_LEAD_MS: Record<IssueKindName, number> = { tide: 24 * HOUR, encore: 1 * HOUR };

/** The UTC hour each kind goes out. */
export const SEND_HOUR_UTC: Record<IssueKindName, number> = { tide: 13, encore: 12 };
/** Tide goes out on this day of the month. */
export const TIDE_SEND_DAY = 3;

/**
 * The nominal send time. Tide: the 3rd of the month the issue was prepared
 * in (UTC), at 13:00 UTC. Encore: the week's Monday (`period`, YYYY-MM-DD) at
 * 12:00 UTC.
 */
export function nominalSendTime(kind: IssueKindName, period: string, preparedAt: Date): Date {
  if (kind === "encore") {
    const [y, m, d] = period.split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, d, SEND_HOUR_UTC.encore));
  }
  return new Date(Date.UTC(preparedAt.getUTCFullYear(), preparedAt.getUTCMonth(), TIDE_SEND_DAY, SEND_HOUR_UTC.tide));
}

/** The nominal time, or later when that leaves less than the minimum window to hold it. */
export function scheduledSendTime(kind: IssueKindName, period: string, preparedAt: Date): Date {
  const nominal = nominalSendTime(kind, period, preparedAt);
  const earliest = preparedAt.getTime() + MIN_LEAD_MS[kind];
  return nominal.getTime() >= earliest ? nominal : new Date(earliest);
}

/**
 * After this, the send is abandoned. Encore: the Monday after the week
 * (`periodEnd` is its Sunday), 04:00 UTC, about midnight in Sarasota. Tide:
 * fourteen days after it was scheduled.
 */
export function sendExpiry(kind: IssueKindName, periodEnd: string, scheduledFor: Date): Date {
  if (kind === "encore") {
    const [y, m, d] = periodEnd.split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, d + 1, 4));
  }
  return new Date(scheduledFor.getTime() + 14 * DAY);
}

/** Why a new send starts held instead of scheduled, if it does. */
export function initialHold(opts: { fairHousingPassed: boolean; issueHold?: string | null; addressComplete: boolean }): string | null {
  if (!opts.fairHousingPassed) return "the Fair Housing checker flagged it";
  if (opts.issueHold) return opts.issueHold;
  if (!opts.addressComplete) return "the office street address and ZIP are empty in settings";
  return null;
}

export type SendDecision = "send" | "wait" | "held" | "done" | "expired";

/**
 * What a run does with one send. `force` is the team's "Send it now": it
 * releases a hold and skips the wait, but never revives an expired or
 * finished send.
 */
export function sendDecision(row: { status: IssueSendStatus; scheduledFor: Date; expiresAt: Date }, now: Date, force = false): SendDecision {
  if (row.status === "sent") return "done";
  if (row.status === "expired" || now.getTime() >= row.expiresAt.getTime()) return "expired";
  if (row.status === "held") return force ? "send" : "held";
  if (force || now.getTime() >= row.scheduledFor.getTime()) return "send";
  return "wait";
}

export type IssueAction = "hold" | "send";

/**
 * What the team's hold link does to a send. Holding a send that's already
 * going out stops the batches still to come; what went out stays out.
 */
export function holdDecision(status: IssueSendStatus): "hold" | "already_held" | "already_sent" | "expired" {
  if (status === "held") return "already_held";
  if (status === "sent") return "already_sent";
  if (status === "expired") return "expired";
  return "hold";
}

/** "Saturday, October 3 at 9:00 AM" in Sarasota's time. */
export function easternWhen(d: Date): string {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(d);
  return `${day} at ${time}`;
}

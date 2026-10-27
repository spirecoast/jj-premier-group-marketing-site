import { createHash } from "node:crypto";

/**
 * The lead guard's limits and keys (lib/lead-guard.ts), kept apart so they
 * can be tested without a database.
 */

export const RATE_LIMITS = {
  /** Sends from one network address. */
  address: { max: 6, windowMinutes: 10 },
  /** Sends for one email (or phone, when there's no email). */
  person: { max: 4, windowMinutes: 60 },
} as const;

const SALT = "jjpg-lead-guard-v1";

/** The start of the window `now` falls in. */
export function windowStart(now: Date, minutes: number): Date {
  const ms = minutes * 60_000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

/**
 * The stored key: a one-way hash of the kind, the value and the window,
 * never the value itself, so a row can't be traced back to an address or
 * followed from one window to the next.
 */
export function guardKey(kind: "address" | "person", value: string, start: Date): string {
  const digest = createHash("sha256").update(`${SALT}|${kind}|${value.trim().toLowerCase()}|${start.toISOString()}`).digest("hex");
  return `${kind}:${digest.slice(0, 40)}`;
}

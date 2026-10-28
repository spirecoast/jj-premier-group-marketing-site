/**
 * The limits on "Email me this" (lib/keep/send.ts), apart so they can be
 * tested without a database. Pure.
 */

export const KEEP_LIMITS = {
  /** Requests from one network address. */
  address: { max: 4, windowMinutes: 60 },
  /** Emails to one address. */
  person: { max: 2, windowMinutes: 24 * 60 },
} as const;

/** Default emails a day for the whole site: the Resend allowance is shared with the team's lead emails and the newsletter. */
export const KEEP_DAILY_CAP_DEFAULT = 10;

/** KEEP_EMAIL_DAILY_CAP: a whole number of emails a day, 0 to turn "Email me this" off. Unset or unreadable: the default. */
export function keepDailyCap(env: Record<string, string | undefined> = process.env): number {
  const raw = env.KEEP_EMAIL_DAILY_CAP?.trim();
  if (!raw) return KEEP_DAILY_CAP_DEFAULT;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, 100) : KEEP_DAILY_CAP_DEFAULT;
}

/** On only with the email path (the Resend key and sender the lead email uses), a database to count in, and a cap above 0. */
export function keepEmailEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.RESEND_FROM_EMAIL?.trim() && env.DATABASE_URL?.trim() && keepDailyCap(env) > 0);
}

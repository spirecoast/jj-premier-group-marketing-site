/**
 * Whether the site may email subscribers, and with what. Pure: reads the env
 * object it's given (process.env by default), so the tests can pass their own.
 *
 * Sending to subscribers needs every one of these; with any missing, nothing
 * goes to a subscriber, one line says why in the logs, and the team hand-off
 * (lib/issues/handoff.ts) runs exactly as it did before:
 *
 *   RESEND_API_KEY      the Resend key (the team email uses it too)
 *   NEWSLETTER_FROM     "JJ Premier Group <letters@mail.jjpremiergroup.com>", on a domain verified in Resend
 *   NEWSLETTER_SECRET   signs the confirm links and the team's hold and send links (32+ characters)
 *   UNSUBSCRIBE_SECRET  signs the unsubscribe links (lib/unsubscribe.ts, 32+ characters)
 *   DATABASE_URL        the subscriptions and the send records live in Postgres
 *
 * Optional: NEWSLETTER_REPLY_TO (where a reply goes; also the List-Unsubscribe
 * mailto) and NEWSLETTER_DAILY_CAP (default 100, Resend's free daily limit).
 */

export const DEFAULT_DAILY_CAP = 100;

export type NewsletterConfig = {
  enabled: boolean;
  /** The variables that are missing or too short, by name. Empty when enabled. */
  missing: string[];
  apiKey: string;
  from: string;
  replyTo: string | null;
  secret: string;
  dailyCap: number;
};

type Env = Record<string, string | undefined>;

/** NEWSLETTER_DAILY_CAP as a whole number of emails a day; the default when unset or not a positive number. */
export function parseDailyCap(value: string | undefined): number {
  const n = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

export function newsletterConfig(env: Env = process.env): NewsletterConfig {
  const apiKey = (env.RESEND_API_KEY ?? "").trim();
  const from = (env.NEWSLETTER_FROM ?? "").trim();
  const secret = env.NEWSLETTER_SECRET ?? "";
  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!from) missing.push("NEWSLETTER_FROM");
  if (secret.length < 32) missing.push("NEWSLETTER_SECRET (32+ characters)");
  if ((env.UNSUBSCRIBE_SECRET ?? "").length < 32) missing.push("UNSUBSCRIBE_SECRET (32+ characters)");
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  return {
    enabled: missing.length === 0,
    missing,
    apiKey,
    from,
    replyTo: (env.NEWSLETTER_REPLY_TO ?? "").trim() || null,
    secret,
    dailyCap: parseDailyCap(env.NEWSLETTER_DAILY_CAP),
  };
}

/** The one log line for a deployment that can't send to subscribers. */
export function disabledLine(config: Pick<NewsletterConfig, "missing">, where: string): string {
  return `[newsletter] ${where}: subscriber email is off (missing ${config.missing.join(", ")}). Nothing was sent to subscribers; the team hand-off runs as before.`;
}

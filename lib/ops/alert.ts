import "server-only";
import { escapeHtml, sendEmail } from "@/lib/email";
import { emailList } from "@/lib/email/recipients";
import { claimAlert, releaseAlert } from "./store";

/**
 * The site's own alarm for things nobody would otherwise see: a scheduled
 * job that failed or stopped running, the nightly purge not running, a
 * newsletter send that ran out of days. It goes the way the lead alert goes:
 * an email to LEAD_ALERT_EMAIL (falling back to TEAM_NOTIFY_EMAIL) through
 * Resend, plus an error line in the logs tagged [ops-alert] and, when
 * NEXT_PUBLIC_SENTRY_DSN is set, a Sentry issue.
 *
 * Each alert has a key. The email goes once per key, then again only if the
 * problem is still there `repeatAfterDays` later (ops_alerts, migration
 * 0016). The log line is written every time.
 */

export type OpsAlert = {
  key: string;
  /** "Encore's daily check failed": the subject after "ALERT · ". */
  subject: string;
  /** Plain sentences, one paragraph each. */
  lines: string[];
  /** Details for whoever fixes it: shown in a smaller monospace block. */
  detail?: string;
  level?: "error" | "warning";
  repeatAfterDays?: number;
};

export type OpsAlertResult = { emailed: boolean; reason?: string };

const alertRecipients = () => emailList(process.env.LEAD_ALERT_EMAIL || process.env.TEAM_NOTIFY_EMAIL);

async function toSentry(alert: OpsAlert): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(alert.subject, { level: alert.level === "warning" ? "warning" : "error", tags: { ops_alert: alert.key.split(":")[0] }, extra: { key: alert.key } });
    await Sentry.flush(2000);
  } catch {
    // never let reporting break the job
  }
}

export async function opsAlert(alert: OpsAlert): Promise<OpsAlertResult> {
  const level = alert.level ?? "error";
  console.error(`[ops-alert] ${JSON.stringify({ key: alert.key, level, subject: alert.subject, detail: alert.detail?.slice(0, 500) })}`);
  if (!(await claimAlert(alert.key, alert.repeatAfterDays ?? 7))) return { emailed: false, reason: "already sent" };
  await toSentry(alert);
  const to = alertRecipients();
  if (!to.length) return { emailed: false, reason: "LEAD_ALERT_EMAIL and TEAM_NOTIFY_EMAIL are empty" };
  const p = (text: string) => `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5">${escapeHtml(text)}</p>`;
  const html = [
    ...alert.lines.map(p),
    alert.detail ? `<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(alert.detail)}</pre>` : "",
    `<p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#63666A">From the site's checks on its scheduled jobs (docs/SITE.md, "Scheduled jobs and alerts"). While this lasts you'll hear about it once a week, not on every run.</p>`,
  ].join("");
  const res = await sendEmail({ to, subject: `${level === "warning" ? "Heads-up" : "ALERT"} · ${alert.subject}`, html });
  if (!res.ok) {
    console.error(`[ops-alert] email not sent: ${res.error}`);
    await releaseAlert(alert.key);
    return { emailed: false, reason: res.error };
  }
  return { emailed: res.id !== "dev-noop", reason: res.id === "dev-noop" ? "Resend not configured" : undefined };
}

import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import { getSiteSettings, getTeam } from "@/lib/content";
import { emailList } from "@/lib/email/recipients";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";
import { keepEmail } from "./email";
import { KEEP_LIMITS, keepDailyCap, keepEmailEnabled } from "./limits";
import { keepPath, type KeepToolId } from "./tools";

/**
 * "Email me this" on the server (app/api/keep). On only when the site's
 * email path is configured (RESEND_API_KEY and RESEND_FROM_EMAIL, the same
 * key the team's lead email uses) and there is a database to count sends
 * in, because an address-to-email form with no limit is a way to send our
 * name to strangers. KEEP_EMAIL_DAILY_CAP (default 10, 0 turns it off)
 * keeps it from eating the Resend allowance the lead emails share. Every
 * check fails closed: no table, no send.
 *
 * Nothing is stored: the limits keep one-way hashes in lead_rate_limits
 * (migration 0015), which the daily cron prunes after a day.
 */

const SALT = "jjpg-keep-v1";
function key(kind: string, value: string, start: Date): string {
  const digest = createHash("sha256").update(`${SALT}|${kind}|${value.trim().toLowerCase()}|${start.toISOString()}`).digest("hex");
  return `keep-${kind}:${digest.slice(0, 40)}`;
}

function windowStart(now: Date, minutes: number): Date {
  const ms = minutes * 60_000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

async function hit(kind: keyof typeof KEEP_LIMITS | "day", value: string, minutes: number, now: Date): Promise<number> {
  const start = windowStart(now, minutes);
  const rows = await getDb().execute<{ hits: number }>(sql`
    INSERT INTO lead_rate_limits (key, window_start, hits) VALUES (${key(kind, value, start)}, ${start.toISOString()}::timestamptz, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET hits = lead_rate_limits.hits + 1
    RETURNING hits
  `);
  return Number(rows[0]?.hits ?? Infinity);
}

export type KeepSendResult = { ok: true } | { ok: false; status: number; error: "off" | "invalid" | "busy" | "failed" };

export async function sendKeepEmail(input: { tool: KeepToolId; url: unknown; email: string; honeypot: boolean; address: string | null }, now = new Date()): Promise<KeepSendResult> {
  if (!keepEmailEnabled()) return { ok: false, status: 404, error: "off" };
  const path = keepPath(input.tool, input.url);
  if (!path) return { ok: false, status: 400, error: "invalid" };
  // A filled honeypot is answered like a send, and nothing goes.
  if (input.honeypot) return { ok: true };

  try {
    const byAddress = await hit("address", input.address || "unknown", KEEP_LIMITS.address.windowMinutes, now);
    if (byAddress > KEEP_LIMITS.address.max) return { ok: false, status: 429, error: "busy" };
    const byPerson = await hit("person", input.email, KEEP_LIMITS.person.windowMinutes, now);
    if (byPerson > KEEP_LIMITS.person.max) return { ok: false, status: 429, error: "busy" };
    const today = await hit("day", "all", 24 * 60, now);
    if (today > keepDailyCap()) {
      console.warn(`[keep] the day's cap of ${keepDailyCap()} emails is reached; "Email me this" answers busy until tomorrow (UTC).`);
      return { ok: false, status: 429, error: "busy" };
    }
  } catch (err) {
    if (isMissingTable(err)) warnMissingTable("lead_rate_limits", "0015_lead_guard_and_outbox.sql");
    else console.error("[keep] limits:", err instanceof Error ? err.message : err);
    return { ok: false, status: 503, error: "failed" };
  }

  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()]);
  const replyTo = emailList(process.env.TEAM_NOTIFY_EMAIL);
  const link = absoluteUrl(path);
  const { subject, html } = keepEmail({
    tool: input.tool,
    link,
    siteName: site.name,
    siteHost: new URL(site.url).host,
    brokerage: settings.brokerageName,
    team: team.map((m) => ({ name: m.name, phone: m.phone })),
    replyable: replyTo.length > 0,
  });
  const res = await sendEmail({ to: input.email, subject, html, replyTo: replyTo[0], category: "transactional" });
  if (!res.ok) {
    console.error("[keep] send failed:", res.error);
    return { ok: false, status: 502, error: "failed" };
  }
  return { ok: true };
}

import "server-only";
import { eq, sql } from "drizzle-orm";
import { deliverLeadToCrm, type CrmLead, type CrmResult } from "@/lib/crm";
import { getDb } from "@/lib/db";
import { isMissingTable, warnMissingTable } from "@/lib/db/missing-table";
import { leadDeliveries, leads } from "@/lib/db/schema";
import { alertLeadDelivery, notifyTeamOfLead } from "@/lib/lead-alert";
import { afterFailure, alarmOnFailure, type FailureStep, type OutboxSink } from "@/lib/lead-outbox-policy";
import { getCrmProvider } from "@/lib/lead-sinks";
import { sideEffectsAllowed } from "@/lib/deploy-env";

/**
 * The lead outbox. The leads row is written while the visitor waits; the
 * CRM webhook and the team email are then tried after the response has gone
 * (next/server `after`), and every failure is retried on a schedule
 * (lib/lead-outbox-policy.ts) until it works or is given up as dead.
 *
 * One `lead_outbox` row per lead and sink (migration 0015) says what's still
 * owed. A row is claimed for three minutes before each attempt, so the
 * request that saved the lead, the sweep after the next lead and the daily
 * cron never send the same lead twice at once. Before 0015 is applied the
 * table doesn't exist: each sink is then tried once, as it always was, and one
 * line in the log says which migration to apply.
 *
 * Nothing here throws to a caller.
 */

export type SinkOutcome = { status: "ok" | "failed" | "skipped"; detail?: string; statusCode?: number };

const OUTBOX_MIGRATION = "0015_lead_guard_and_outbox.sql";

/** Whether this deployment has anywhere to send each sink, so a row is only owed when the send can happen. */
export function owedSinks(): OutboxSink[] {
  const out: OutboxSink[] = [];
  if (getCrmProvider() !== "none") out.push("crm");
  if (process.env.TEAM_NOTIFY_EMAIL?.trim()) out.push("team_email");
  return out;
}

/** Records the sinks still owed for a new lead. False when the table is missing or the write failed: the caller then tries each sink once, untracked. */
export async function enqueue(leadId: string, sinks: OutboxSink[]): Promise<boolean> {
  if (!sinks.length) return true;
  try {
    const db = getDb();
    for (const sink of sinks) {
      await db.execute(sql`INSERT INTO lead_outbox (lead_id, sink) VALUES (${leadId}::uuid, ${sink}) ON CONFLICT (lead_id, sink) DO NOTHING`);
    }
    return true;
  } catch (err) {
    if (isMissingTable(err)) warnMissingTable("lead_outbox", OUTBOX_MIGRATION);
    else console.error("[lead-outbox] enqueue failed", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Claims a row for one attempt. Returns the attempt number, or null when it isn't due, is held by another run, or is finished. */
async function claim(leadId: string, sink: OutboxSink): Promise<number | null> {
  const rows = await getDb().execute<{ attempts: number }>(sql`
    UPDATE lead_outbox
       SET attempts = attempts + 1, locked_until = now() + interval '3 minutes', updated_at = now()
     WHERE lead_id = ${leadId}::uuid AND sink = ${sink} AND status = 'pending'
       AND next_attempt_at <= now() AND (locked_until IS NULL OR locked_until < now())
    RETURNING attempts
  `);
  return rows[0]?.attempts ?? null;
}

async function settle(leadId: string, sink: OutboxSink, result: { ok: true } | { ok: false; step: FailureStep; error: string }): Promise<void> {
  try {
    const db = getDb();
    if (result.ok) {
      await db.execute(sql`UPDATE lead_outbox SET status = 'done', locked_until = NULL, last_error = NULL, updated_at = now() WHERE lead_id = ${leadId}::uuid AND sink = ${sink}`);
    } else if (result.step.status === "dead") {
      await db.execute(sql`UPDATE lead_outbox SET status = 'dead', locked_until = NULL, last_error = ${result.error.slice(0, 1000)}, updated_at = now() WHERE lead_id = ${leadId}::uuid AND sink = ${sink}`);
    } else {
      await db.execute(sql`
        UPDATE lead_outbox SET locked_until = NULL, last_error = ${result.error.slice(0, 1000)},
               next_attempt_at = ${result.step.nextAttemptAt.toISOString()}::timestamptz, updated_at = now()
         WHERE lead_id = ${leadId}::uuid AND sink = ${sink}
      `);
    }
  } catch (err) {
    console.error("[lead-outbox] could not record the attempt", err instanceof Error ? err.message : err);
  }
}

/** One lead_deliveries row, and the CRM status on the lead row. Best effort. */
export async function recordDelivery(
  leadId: string | null,
  sink: "crm_webhook" | "fub" | "team_email" | "plausible",
  outcome: SinkOutcome & { attempts?: number },
  crm?: { status: "delivered" | "failed" | "skipped"; error?: string },
): Promise<void> {
  if (!leadId || !process.env.DATABASE_URL) return;
  try {
    const db = getDb();
    await db.insert(leadDeliveries).values({
      leadId,
      sink,
      status: outcome.status,
      statusCode: outcome.statusCode ?? null,
      attempts: outcome.attempts ?? 1,
      detail: outcome.detail?.slice(0, 1000) ?? null,
    });
    if (crm) {
      await db
        .update(leads)
        .set({
          deliveryStatus: crm.status,
          deliveryError: crm.error?.slice(0, 1000) ?? null,
          deliveredAt: crm.status === "delivered" ? new Date() : null,
        })
        .where(eq(leads.id, leadId));
    }
  } catch (err) {
    console.error("[lead] could not record delivery (non-fatal)", err instanceof Error ? err.message : err);
  }
}

/**
 * The alarm that doesn't need Resend: an error line tagged [lead-alarm] for
 * the log drain, and a Sentry message when NEXT_PUBLIC_SENTRY_DSN is set. No
 * names or addresses, only the lead's id and what failed.
 */
export async function raiseLeadAlarm(message: string, extra: Record<string, unknown>): Promise<void> {
  console.error(`[lead-alarm] ${message}`, extra);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage(`[lead-alarm] ${message}`, { level: "error", extra });
  } catch {
    // Sentry missing or not started: the log line above stands.
  }
}

export function crmOutcome(result: CrmResult): SinkOutcome & { provider: string; attempts: number } {
  if (result.ok) return { status: "ok", provider: result.provider, statusCode: result.status, attempts: result.attempts, detail: result.detail };
  if (result.reason === "not_configured") return { status: "skipped", provider: result.provider, attempts: 0, detail: result.error };
  return { status: "failed", provider: result.provider, statusCode: result.status, attempts: result.attempts, detail: result.error };
}

export type DeliveryReport = { crm: SinkOutcome & { provider: string }; teamEmail: SinkOutcome };

/**
 * Try the CRM and then the team email for one lead. `tracked` means the
 * outbox rows exist: each attempt is claimed first and its result recorded,
 * and a sink that isn't due (or is being tried elsewhere) is left alone.
 * Untracked (no database, or before migration 0015) each sink runs once.
 */
export async function deliver(
  leadId: string | null,
  lead: CrmLead,
  opts: { tracked: boolean; submittedAt: Date; mirrored: boolean; firstRun: boolean },
): Promise<DeliveryReport> {
  const provider = getCrmProvider();
  const isProd = process.env.NODE_ENV === "production";
  const explicitNone = (process.env.CRM_PROVIDER || "").trim().toLowerCase() === "none";
  const report: DeliveryReport = {
    crm: { status: "skipped", provider, detail: "not due" },
    teamEmail: { status: "skipped", detail: "not due" },
  };

  // 1. CRM.
  // With no CRM there's nothing to retry; the first run records it as skipped.
  const crmAttempt = provider === "none" ? (opts.firstRun ? 1 : null) : opts.tracked && leadId ? await claimSafe(leadId, "crm") : 1;
  if (crmAttempt !== null) {
    const result = await deliverLeadToCrm(lead, { idempotencyKey: leadId ?? undefined });
    const crm = crmOutcome(result);
    report.crm = crm;
    await recordDelivery(leadId, provider === "fub" ? "fub" : "crm_webhook", crm, {
      status: crm.status === "ok" ? "delivered" : crm.status === "failed" ? "failed" : "skipped",
      error: crm.status === "ok" ? undefined : crm.detail,
    });
    if (crm.status === "skipped" && !isProd) {
      console.info(`[lead] dev mode — no CRM configured (${provider}); lead logged only`, { form: lead.form, leadId, tags: lead.tags });
    }
    let step: FailureStep | null = null;
    if (opts.tracked && leadId && crmAttempt !== null && provider !== "none") {
      if (result.ok) await settle(leadId, "crm", { ok: true });
      else {
        step = afterFailure(crmAttempt, opts.submittedAt);
        await settle(leadId, "crm", { ok: false, step, error: result.error });
      }
    }
    // The team hears about a CRM failure by email on the first try (when the
    // failure is real, or a production site has no CRM it didn't choose), and
    // again through the alarm if the retries run out.
    if (!result.ok && crmAttempt === 1 && (result.reason !== "not_configured" || (isProd && !explicitNone))) {
      await alertLeadDelivery(result.reason, lead, {
        provider,
        detail: result.error,
        leadId,
        mirrored: opts.mirrored,
        notified: false,
        retrying: Boolean(step && step.status === "pending"),
      }).catch((err) => console.error("[lead] alert email failed", err));
    }
    if (step && alarmOnFailure("crm", step, crmAttempt, provider)) {
      await raiseLeadAlarm("CRM delivery gave up", { leadId, provider, attempts: crmAttempt, error: result.ok ? undefined : result.error.slice(0, 300) });
    }
  }

  // 2. The team email, with the full payload.
  const emailAttempt = opts.tracked && leadId ? await claimSafe(leadId, "team_email") : 1;
  if (emailAttempt !== null) {
    const crmDelivered = report.crm.status === "ok" || (opts.tracked && leadId ? await crmAlreadyDelivered(leadId) : false);
    const notify = await notifyTeamOfLead(lead, { leadId, crmDelivered, crmProvider: provider }).catch((err) => ({
      ok: false as const,
      skipped: false,
      error: err instanceof Error ? err.message : String(err),
    }));
    const teamEmail: SinkOutcome = notify.ok
      ? { status: "ok", detail: notify.id }
      : { status: notify.skipped ? "skipped" : "failed", detail: notify.error };
    report.teamEmail = teamEmail;
    await recordDelivery(leadId, "team_email", { ...teamEmail, attempts: emailAttempt });
    if (opts.tracked && leadId) {
      if (teamEmail.status === "ok" || teamEmail.status === "skipped") await settle(leadId, "team_email", { ok: true });
      else {
        const step = afterFailure(emailAttempt, opts.submittedAt);
        await settle(leadId, "team_email", { ok: false, step, error: teamEmail.detail ?? "failed" });
        if (alarmOnFailure("team_email", step, emailAttempt, provider)) {
          await raiseLeadAlarm(step.status === "dead" ? "Team email gave up" : "Team email failed and there's no CRM", { leadId, attempts: emailAttempt, error: teamEmail.detail?.slice(0, 300) });
        }
      }
    } else if (teamEmail.status === "failed" && provider === "none") {
      await raiseLeadAlarm("Team email failed and there's no CRM", { leadId, error: teamEmail.detail?.slice(0, 300) });
    }
  }
  return report;
}

async function claimSafe(leadId: string, sink: OutboxSink): Promise<number | null> {
  try {
    return await claim(leadId, sink);
  } catch (err) {
    console.error("[lead-outbox] claim failed", err instanceof Error ? err.message : err);
    return null;
  }
}

async function crmAlreadyDelivered(leadId: string): Promise<boolean> {
  try {
    const [row] = await getDb().select({ s: leads.deliveryStatus }).from(leads).where(eq(leads.id, leadId)).limit(1);
    return row?.s === "delivered";
  } catch {
    return false;
  }
}

/**
 * Work through what's due: every outbox row whose next attempt has come,
 * oldest first, at most `limit` leads. Called after each new lead and by the
 * daily cron. Returns how many leads were tried.
 */
export async function redeliverDue(limit = 10): Promise<{ tried: number; skipped?: string }> {
  if (!process.env.DATABASE_URL) return { tried: 0, skipped: "DATABASE_URL not set" };
  // The outbox is production's: a preview shares the database but sends nowhere (lib/deploy-env.ts), so a
  // sweep from a preview would settle production's leads without delivering them.
  if (!sideEffectsAllowed()) return { tried: 0, skipped: "preview deployment" };
  let rows: { lead_id: string; payload: CrmLead | null; submitted_at: string | Date }[];
  try {
    rows = await getDb().execute(sql`
      SELECT DISTINCT ON (o.lead_id) o.lead_id, l.payload, l.submitted_at
        FROM lead_outbox o JOIN leads l ON l.id = o.lead_id
       WHERE o.status = 'pending' AND o.next_attempt_at <= now() AND (o.locked_until IS NULL OR o.locked_until < now())
         -- A preview's leads are tests (tag "preview"): production never retries them into real inboxes.
         AND NOT coalesce(l.payload->'tags' ? 'preview', false)
       ORDER BY o.lead_id, o.next_attempt_at
       LIMIT ${limit}
    `);
  } catch (err) {
    if (isMissingTable(err)) {
      warnMissingTable("lead_outbox", OUTBOX_MIGRATION);
      return { tried: 0, skipped: `apply ${OUTBOX_MIGRATION}` };
    }
    console.error("[lead-outbox] could not read what's due", err instanceof Error ? err.message : err);
    return { tried: 0, skipped: "read failed" };
  }
  let tried = 0;
  for (const row of rows) {
    if (!row.payload || typeof row.payload !== "object") {
      await settle(row.lead_id, "crm", { ok: false, step: { status: "dead" }, error: "payload missing" });
      await settle(row.lead_id, "team_email", { ok: false, step: { status: "dead" }, error: "payload missing" });
      continue;
    }
    tried += 1;
    await deliver(row.lead_id, row.payload, { tracked: true, submittedAt: new Date(row.submitted_at), mirrored: true, firstRun: false });
  }
  return { tried };
}

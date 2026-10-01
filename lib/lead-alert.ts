import "server-only";
import type { CrmFailure, CrmLead } from "@/lib/crm";
import { escapeHtml, sendEmail } from "@/lib/email";
import { IMPLIED_CONSENT_VERSION, NOT_SHOWN_CONSENT_VERSION } from "@/lib/leads";

/**
 * Internal email for the lead pipeline. Two jobs, both addressed to the team,
 * never to the visitor (the site does not email visitors; replies go out from
 * the agents' own Coldwell Banker mailboxes through Zapier):
 *
 *  1. notifyTeamOfLead — every lead, with the full payload, to TEAM_NOTIFY_EMAIL.
 *     This is the safety net when the CRM path is down.
 *  2. alertLeadDelivery — an error-level alert when the CRM path failed, to
 *     LEAD_ALERT_EMAIL (falling back to TEAM_NOTIFY_EMAIL).
 */

function alertRecipient(): string | undefined {
  return process.env.LEAD_ALERT_EMAIL || process.env.TEAM_NOTIFY_EMAIL;
}

/** For subjects and the table: never the email address, which would end up in log lines. */
function fullName(lead: CrmLead): string {
  return `${lead.firstName} ${lead.lastName}`.trim() || "subscriber";
}

function consentLine(lead: CrmLead): string {
  const parts: string[] = [];
  if (lead.consent.wordingVersion === NOT_SHOWN_CONSENT_VERSION) {
    // e.g. the review permission: no email or call/text box on the form.
    parts.push("Email and calls/texts: not asked on this form");
  } else {
    parts.push(lead.consent.email ? "Email: yes" : "Email: no", lead.consent.sms ? "Calls/texts: yes" : "Calls/texts: no");
    if (lead.consent.timestamp) parts.push(`at ${lead.consent.timestamp}`);
    const how = lead.consent.wordingVersion === IMPLIED_CONSENT_VERSION ? "email implied by subscribing; no box shown" : "both boxes unchecked by default";
    parts.push(`(wording ${lead.consent.wordingVersion}; ${how})`);
  }
  if (lead.consent.review) parts.push(`Review permission: yes at ${lead.consent.reviewAt} (wording ${lead.consent.reviewWordingVersion})`);
  return parts.join(" · ");
}

function leadHtml(lead: CrmLead): string {
  const rows: [string, string | null | undefined][] = [
    ["Form", lead.form],
    ["Name", fullName(lead)],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Message", lead.message],
    ["Timing", lead.timing],
    ["House to sell first", lead.sellFirst],
    ["Market", lead.market],
    ["Address to value", lead.propertyAddress],
    ["Property", lead.property?.title ?? lead.property?.street],
    ["Referring", lead.referral ? `${[lead.referral.firstName, lead.referral.lastName].filter(Boolean).join(" ")} · ${[lead.referral.email, lead.referral.phone].filter(Boolean).join(" · ")}${lead.referral.plan ? ` · ${lead.referral.plan}` : ""}` : null],
    ["Referral note", lead.referral?.note],
    ["Consent", consentLine(lead)],
    ["Tags", lead.tags.join(", ")],
    ["Came through", lead.source.channel ? `/from/${lead.source.channel}` : null],
    ["Source", lead.source.utm_source ? `${lead.source.utm_source} / ${lead.source.utm_medium ?? ""} / ${lead.source.utm_campaign ?? ""}` : "direct"],
    ["Page", lead.source.page],
    ["Referrer", lead.source.referrer],
    ["Submitted", lead.submittedAt],
    ["Test lead", lead.test ? "YES — from scripts/test-lead.mjs, ignore" : null],
  ];
  const table = `<table cellpadding="6" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="color:#63666A;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="white-space:pre-wrap">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("")}</table>`;
  // The full payload, exactly as the CRM webhook received it, so nothing is lost
  // if Zapier or the CRM dropped the lead.
  const json = `<details style="margin-top:16px"><summary style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#63666A;cursor:pointer">Full payload (JSON)</summary><pre style="font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(JSON.stringify(lead, null, 2))}</pre></details>`;
  return table + json;
}

export async function notifyTeamOfLead(
  lead: CrmLead,
  context: { leadId?: string | null; crmDelivered: boolean; crmProvider: string },
): Promise<{ ok: boolean; id?: string; error?: string; skipped?: boolean }> {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return { ok: false, skipped: true, error: "TEAM_NOTIFY_EMAIL not set" };
  const status = context.crmDelivered
    ? `Also sent to the CRM (${context.crmProvider}).`
    : context.crmProvider === "none"
      ? "No CRM is configured on this deployment; this email and the database are the record."
      : `The CRM (${context.crmProvider}) did NOT accept it; see the alert. Enter it by hand.`;
  const res = await sendEmail({
    to,
    subject: `${lead.test ? "TEST · " : ""}New lead · ${lead.form} · ${fullName(lead)}`,
    html: `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px">New website lead. ${escapeHtml(status)}${context.leadId ? ` Database id ${escapeHtml(context.leadId)}.` : ""}</p>${leadHtml(lead)}`,
    replyTo: lead.email,
  });
  // The email helper returns a dev no-op when Resend is not configured; that is not delivery.
  if (!res.ok) return { ok: false, error: res.error };
  if (res.id === "dev-noop") return { ok: false, skipped: true, error: "Resend not configured" };
  return { ok: true, id: res.id };
}

const HEADLINES: Record<CrmFailure, string> = {
  fub_archived_204:
    "Follow Up Boss returned 204: the lead flow for this source is ARCHIVED. The lead below was accepted and discarded by the CRM. Un-archive the source in Follow Up Boss and re-enter this lead by hand.",
  not_configured: "No CRM is configured on this production deployment. The lead below was NOT sent to the CRM.",
  rejected: "The CRM webhook rejected the lead below. Check the Zap (or the CRM) and enter it by hand.",
  network: "The CRM webhook could not be reached. Enter the lead below by hand and check the integration.",
};

export async function alertLeadDelivery(
  reason: CrmFailure,
  lead: CrmLead,
  context: { provider: string; detail?: string; leadId?: string | null; mirrored: boolean; notified: boolean },
): Promise<void> {
  console.error(`[lead-alert] ${reason}`, { form: lead.form, leadId: context.leadId, provider: context.provider, detail: context.detail });
  const to = alertRecipient();
  if (!to) return;
  const kept = [
    context.mirrored ? `saved in the database${context.leadId ? ` (id ${context.leadId})` : ""}` : null,
    context.notified ? "in the team notification email" : null,
  ].filter(Boolean);
  const where = kept.length ? `The lead is ${kept.join(" and ")}.` : "The lead was NOT kept anywhere else: this email is the only copy.";
  await sendEmail({
    to,
    subject: `ALERT · lead not delivered to CRM (${context.provider}: ${reason})`,
    html: `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px"><strong>${escapeHtml(HEADLINES[reason])}</strong> ${escapeHtml(where)}</p>${context.detail ? `<p style="font-family:monospace;font-size:12px">${escapeHtml(context.detail)}</p>` : ""}${leadHtml(lead)}`,
    replyTo: lead.email,
  });
}

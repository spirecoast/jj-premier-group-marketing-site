import "server-only";
import { escapeHtml, sendEmail } from "@/lib/email";

/**
 * Internal alerting for the lead pipeline. Two jobs:
 *  1. Tell the team about every lead (belt and braces next to the CRM).
 *  2. Raise an error-level alert when Follow Up Boss reports the lead flow is
 *     archived (204) or the CRM could not be reached, so nothing disappears silently.
 */

export type LeadSummary = {
  form: string;
  fubType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  consent: boolean;
  consentAt?: string;
  property?: string;
  pageUrl?: string;
};

function alertRecipient(): string | undefined {
  return process.env.LEAD_ALERT_EMAIL ?? process.env.TEAM_NOTIFY_EMAIL;
}

function leadHtml(lead: LeadSummary): string {
  const rows: [string, string | undefined][] = [
    ["Form", lead.form],
    ["CRM event type", lead.fubType],
    ["Name", `${lead.firstName} ${lead.lastName}`.trim()],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Property", lead.property],
    ["Message", lead.message],
    ["Call/text consent", lead.consent ? `Yes · ${lead.consentAt ?? ""}` : "No"],
    ["Page", lead.pageUrl],
  ];
  return `<table cellpadding="6" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="color:#63666A;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`,
    )
    .join("")}</table>`;
}

export async function notifyTeamOfLead(lead: LeadSummary): Promise<boolean> {
  const to = process.env.TEAM_NOTIFY_EMAIL;
  if (!to) return false;
  const res = await sendEmail({
    to,
    subject: `New lead · ${lead.form} · ${lead.firstName} ${lead.lastName}`.trim(),
    html: `<p>New website lead.</p>${leadHtml(lead)}`,
    replyTo: lead.email,
  });
  // The email helper returns a dev no-op when Resend is not configured; that is not delivery.
  return res.ok && res.id !== "dev-noop";
}

export async function alertLeadDelivery(
  reason: "fub_archived_204" | "fub_not_configured" | "fub_failed",
  lead: LeadSummary,
  detail?: string,
): Promise<void> {
  console.error(`[lead-alert] ${reason}`, { email: lead.email, form: lead.form, detail });
  const to = alertRecipient();
  if (!to) return;
  const headline =
    reason === "fub_archived_204"
      ? "Follow Up Boss returned 204: the lead flow for this source is ARCHIVED. The lead below was accepted and discarded by the CRM. Un-archive the source in Follow Up Boss and re-enter this lead by hand."
      : reason === "fub_not_configured"
        ? "Follow Up Boss credentials are not configured on this deployment. The lead below was NOT sent to the CRM."
        : "Follow Up Boss rejected or could not receive the lead below. Enter it by hand and check the integration.";
  await sendEmail({
    to,
    subject: `ALERT · lead not delivered to Follow Up Boss (${reason})`,
    html: `<p><strong>${escapeHtml(headline)}</strong></p>${detail ? `<p style="font-family:monospace">${escapeHtml(detail)}</p>` : ""}${leadHtml(lead)}`,
    replyTo: lead.email,
  });
}

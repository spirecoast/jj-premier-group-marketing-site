"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { checkSubmission, settleSubmission } from "@/lib/lead-guard";
import { processLead } from "@/lib/lead-pipeline";
import { LEAD_FAILURE_MESSAGE, isLeadForm, thanksPath, type LeadFormState } from "@/lib/leads/constants";
import { parseLead } from "@/lib/leads/schema";

/**
 * The one server action every public form posts to.
 *
 * Validate (lib/leads/rules.ts, the same rules the browser ran) → the guard
 * (lib/lead-guard.ts: a resend, the honeypot, the rate limit) → the pipeline
 * (lib/lead-pipeline.ts: Postgres while the visitor waits, the CRM and the
 * team email after the response) → send the visitor to the thank-you page.
 * With JavaScript off the inline success state shows instead.
 *
 * On any failure the visitor's own words come back in `values`, so a form
 * rendered from this state (the no-JavaScript path) still has them.
 *
 * Both consent boxes are unchecked by default, stored with their timestamp
 * and wording version, and never required for submission. The only email the
 * site sends the visitor is the newsletter confirmation (double opt-in), when
 * they subscribed or ticked the email box.
 */

/** Hidden fields the forms add themselves; never echoed back. */
const NOT_ECHOED = new Set(["website", "form", "pageUrl", "pageTitle", "homePlatformPixel", "submissionId", "source", "market", "watchStreet", "watchZip", "watchPlace", "watchName"]);

function extractUtm(formData: FormData): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("utm__") && typeof value === "string" && value) {
      utm[key.slice("utm__".length)] = value.slice(0, 200);
    }
  }
  return utm;
}

/** What the visitor typed, for re-rendering the form: plain strings, no hidden fields, nothing long. */
function echo(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== "string" || NOT_ECHOED.has(k) || k.startsWith("utm__") || k.startsWith("$ACTION") || k.startsWith("property")) continue;
    out[k] = v.slice(0, 5000);
  }
  return out;
}

export async function submitLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") raw[k] = v;
  const values = echo(raw);
  const form = isLeadForm(raw.form) ? raw.form : undefined;

  try {
    const parsed = parseLead(raw);
    if (!parsed.ok) {
      return {
        ok: false,
        form,
        errors: parsed.errors,
        values,
        formError: parsed.hidden.length && !Object.keys(parsed.errors).length ? LEAD_FAILURE_MESSAGE : undefined,
      };
    }
    const data = parsed.data;
    const success: LeadFormState = { ok: true, form: data.form, redirectTo: thanksPath(data.form, data.market) };

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip");
    const verdict = await checkSubmission({
      submissionId: data.submissionId,
      honeypot: Boolean(data.website),
      address: ip,
      person: data.email || data.phoneE164 || null,
    });
    // A resend of something already kept: the same answer, nothing sent twice.
    if (verdict.action === "duplicate") return success;

    const ctx = {
      utm: extractUtm(formData),
      referrer: hdrs.get("referer"),
      userAgent: hdrs.get("user-agent"),
      ip,
    };

    // The honeypot or the rate limit: the same success, so a bot learns nothing; kept for a person to look at, sent nowhere.
    if (verdict.action === "suspect") {
      if (verdict.keep) {
        const kept = await processLead(data, ctx, { suspect: "suspected_bot" });
        await settleSubmission(data.submissionId, kept.leadId, true);
      }
      return success;
    }

    const outcome = await processLead(data, ctx, { defer: (task) => after(task) });
    await settleSubmission(data.submissionId, outcome.leadId, outcome.captured);
    if (!outcome.captured) return { ok: false, form: data.form, values, formError: LEAD_FAILURE_MESSAGE };
    const confirmEmail = outcome.newsletter.some((n) => n.confirmationSent) || Boolean(outcome.watch?.confirmationSent);
    return { ...success, ...(confirmEmail ? { confirmEmail } : {}) };
  } catch (err) {
    // Nothing above should throw; if something does, the visitor keeps their words and gets the numbers, never the error page.
    console.error("[lead] submitLead failed", err instanceof Error ? err.message : err);
    return { ok: false, form, values, formError: LEAD_FAILURE_MESSAGE };
  }
}

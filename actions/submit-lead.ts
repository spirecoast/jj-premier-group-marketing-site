"use server";

import { headers } from "next/headers";
import { processLead } from "@/lib/lead-pipeline";
import { leadSchema, thanksPath, type LeadFormState } from "@/lib/leads";

/**
 * The one server action every public form posts to.
 *
 * Validate → lib/lead-pipeline.ts (Postgres first, then the CRM webhook, then
 * the team email, then the conversion event) → send the visitor to the
 * thank-you page. With JavaScript off the inline success state shows instead.
 *
 * Both consent boxes are unchecked by default, stored with their timestamp
 * and wording version, and never required for submission. The site never
 * emails the visitor.
 */

function extractUtm(formData: FormData): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("utm__") && typeof value === "string" && value) {
      utm[key.slice("utm__".length)] = value.slice(0, 200);
    }
  }
  return utm;
}

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const rendered = new Set([
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "timing",
      "sellFirst",
      "message",
      "referredName",
      "referredLastName",
      "referredEmail",
      "referredPhone",
      "referredPlan",
      "referralConsent",
      "reviewConsent",
    ]);
    const hidden = Object.keys(errors).filter((k) => !rendered.has(k));
    return {
      ok: false,
      errors,
      formError: hidden.length
        ? "Something in the form did not send. Call or text us and we will pick it up from there."
        : undefined,
    };
  }
  const data = parsed.data;

  // Honeypot tripped: pretend it worked so bots learn nothing.
  if (data.website) return { ok: true, form: data.form, redirectTo: thanksPath(data.form) };

  const hdrs = await headers();
  const outcome = await processLead(data, {
    utm: extractUtm(formData),
    referrer: hdrs.get("referer"),
    userAgent: hdrs.get("user-agent"),
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip"),
  });

  if (!outcome.captured) {
    return {
      ok: false,
      formError:
        "We could not send that just now. Call or text us directly and we will pick it up from there.",
    };
  }
  return { ok: true, form: data.form, redirectTo: thanksPath(data.form, data.market) };
}

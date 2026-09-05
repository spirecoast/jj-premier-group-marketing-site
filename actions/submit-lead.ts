"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendLeadEvent, type FubEventType, type FubProperty } from "@/lib/fub";
import { alertLeadDelivery, notifyTeamOfLead, type LeadSummary } from "@/lib/lead-alert";
import { site } from "@/lib/site";
import { EMAIL_ONLY_FORMS, FUB_TYPE, leadSchema, type LeadFormState } from "@/lib/leads";

/**
 * The one server action every public form posts to.
 *
 * Flow: validate → build the Follow Up Boss event for this form → POST /v1/events
 * → handle 201/200/204/429/failure explicitly → mirror to the local database
 * when one is configured → confirm to the visitor.
 *
 * Consent is captured as submitted (unchecked by default), stored with its
 * timestamp in the lead message and as a tag, and never required for submission.
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

function splitName(first: string, last: string): { firstName: string; lastName: string } {
  if (last) return { firstName: first, lastName: last };
  const parts = first.split(/\s+/);
  if (parts.length > 1) return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
  return { firstName: first, lastName: "" };
}

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const rendered = new Set(["firstName", "lastName", "email", "phone", "address", "timing", "message"]);
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
  if (data.website) return { ok: true, form: data.form };

  const utm = extractUtm(formData);
  const now = new Date();
  const consentAt = data.consent ? now.toISOString() : undefined;
  const { firstName, lastName } = splitName(data.firstName || "", data.lastName || "");
  const type = FUB_TYPE[data.form];

  const hdrs = await headers();
  const referer = hdrs.get("referer") ?? undefined;
  const pageUrl = data.pageUrl ?? referer;

  const messageLines = [
    data.message,
    data.timing ? `Timing: ${data.timing}` : undefined,
    data.address ? `Address to value: ${data.address}` : undefined,
    data.propertyTitle ? `Property: ${data.propertyTitle}` : undefined,
    "",
    `Form: ${data.form} · ${site.domain}`,
    data.consent
      ? `Call/text consent: YES at ${consentAt} (unchecked by default; visitor opted in)`
      : "Call/text consent: NO (box left unchecked)",
  ].filter((l) => l !== undefined);

  const property: FubProperty | undefined =
    data.form === "listing"
      ? {
          street: data.propertyStreet,
          city: data.propertyCity,
          state: data.propertyState,
          code: data.propertyZip,
          price: data.propertyPrice ? Number(data.propertyPrice) || undefined : undefined,
          mlsNumber: data.propertyMls,
          url: data.propertySlug ? `${site.url}/listings/${data.propertySlug}` : undefined,
        }
      : undefined;

  const tags = [
    "website",
    `form:${data.form}`,
    data.consent ? "sms-consent" : "no-sms-consent",
    ...(utm.utm_campaign ? [`campaign:${utm.utm_campaign}`] : []),
  ];

  const summary: LeadSummary = {
    form: data.form,
    fubType: type,
    firstName,
    lastName,
    email: data.email,
    phone: data.phone,
    message: data.message,
    consent: data.consent,
    consentAt,
    property: data.propertyTitle ?? data.address,
    pageUrl,
  };

  const result = await sendLeadEvent({
    type,
    message: messageLines.join("\n"),
    description: `${data.form} form on ${site.domain}`,
    person: {
      firstName,
      lastName,
      emails: [{ value: data.email }],
      phones: data.phone ? [{ value: data.phone }] : undefined,
      tags,
    },
    property,
    campaign: utm.utm_source
      ? {
          source: utm.utm_source,
          medium: utm.utm_medium,
          term: utm.utm_term,
          content: utm.utm_content,
          campaign: utm.utm_campaign,
        }
      : undefined,
    pageUrl,
    pageTitle: data.pageTitle,
    pageReferrer: referer,
  });

  // Every outcome is handled explicitly. Nothing is allowed to look fine by accident.
  let crmDelivered = false;
  if (result.ok && result.status === 204) {
    await alertLeadDelivery("fub_archived_204", summary);
  } else if (result.ok) {
    crmDelivered = true;
  } else if (result.error === "not_configured") {
    if (process.env.NODE_ENV === "production") {
      await alertLeadDelivery("fub_not_configured", summary);
    } else {
      console.info("[lead] dev mode — Follow Up Boss not configured; lead logged only", summary);
    }
  } else {
    await alertLeadDelivery("fub_failed", summary, `${result.status} ${result.error}`);
  }

  const mirrored = await mirrorToDatabase(summary, utm, now);
  const notified = await notifyTeamOfLead(summary).catch(() => false);

  const captured =
    crmDelivered || mirrored || notified || process.env.NODE_ENV !== "production";
  if (!captured) {
    return {
      ok: false,
      formError:
        "We could not send that just now. Call or text us directly and we will pick it up from there.",
    };
  }
  return { ok: true, form: data.form };
}

/**
 * Best-effort mirror into the local Postgres (the agent portal reads it).
 * Skipped entirely when DATABASE_URL is not set. Never blocks the CRM path.
 */
async function mirrorToDatabase(
  lead: LeadSummary,
  utm: Record<string, string>,
  now: Date,
): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    const { getDb } = await import("@/lib/db");
    const { contacts, events } = await import("@/lib/db/schema");
    const db = getDb();
    const [row] = await db
      .insert(contacts)
      .values({
        fullName: `${lead.firstName} ${lead.lastName}`.trim(),
        firstName: lead.firstName,
        lastName: lead.lastName || null,
        email: lead.email,
        phone: lead.phone ?? null,
        type: ["lead"],
        lifecycleStage: "new",
        source: utm.utm_source ?? "website",
        sourceDetail: `${lead.form}_form`,
        utm: Object.keys(utm).length ? utm : null,
        consentEmail: EMAIL_ONLY_FORMS.includes(lead.form as (typeof EMAIL_ONLY_FORMS)[number]),
        consentEmailAt: EMAIL_ONLY_FORMS.includes(lead.form as (typeof EMAIL_ONLY_FORMS)[number]) ? now : null,
        consentSms: lead.consent,
        consentSmsAt: lead.consent ? now : null,
        consentSmsMethod: lead.consent ? "web_form_checkbox" : null,
        firstTouchAt: now,
        lastTouchAt: now,
      })
      .returning({ id: contacts.id });
    if (row) {
      // Letter subscribers are not enrolled in the portal's welcome series: its
      // templates are placeholders from an earlier phase. The quarterly letter
      // itself is sent from the CRM.
      await db.insert(events).values({
        eventType: "form_submit",
        contactId: row.id,
        payload: {
          form: lead.form,
          fub_type: lead.fubType,
          message: lead.message,
          property: lead.property,
          consent_sms: lead.consent,
          consent_at: lead.consentAt,
          page_url: lead.pageUrl,
        },
      });
    }
    return true;
  } catch (err) {
    console.error("[lead] database mirror failed (non-fatal)", err);
    return false;
  }
}

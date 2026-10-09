import "server-only";
import { sendLeadEvent, type FubProperty } from "@/lib/fub";
import { FUB_TYPE, IMPLIED_CONSENT_VERSION, NOT_SHOWN_CONSENT_VERSION, type LeadForm } from "@/lib/leads";
import { getCrmProvider, type CrmProvider } from "@/lib/lead-sinks";
import { site } from "@/lib/site";

/**
 * The CRM side of the lead pipeline, behind one switch:
 *
 *   CRM_PROVIDER=webhook  POST the lead as JSON to CRM_WEBHOOK_URL, a Zapier
 *                         Catch Hook. Zapier runs "Compass: Create a New Lead"
 *                         (the Home Platform has no API) and the agents' reply
 *                         step. Default whenever CRM_WEBHOOK_URL is set.
 *   CRM_PROVIDER=fub      The previous Follow Up Boss events client (lib/fub.ts).
 *   CRM_PROVIDER=none     No CRM; Postgres and the team email keep the lead.
 *
 * This module never emails the visitor and never throws: every outcome comes
 * back as a CrmResult so lib/lead-pipeline.ts can record it and decide what
 * the visitor sees.
 */

export type { CrmProvider };

export type LeadConsent = {
  email: boolean;
  sms: boolean;
  /** When the email or call/text box was ticked (or email was implied by subscribing); null when neither. Never the review box. */
  timestamp: string | null;
  /**
   * The marketing-consent wording the visitor saw (lib/leads.ts):
   * CONSENT_WORDING_VERSION beside the two boxes, IMPLIED_CONSENT_VERSION
   * (`implied:subscribe`) on the Tide and Encore bars, NOT_SHOWN_CONSENT_VERSION
   * (`none:not-shown`) on a form that shows neither box (review-permission).
   */
  wordingVersion: string;
  /**
   * Review-permission form only: the visitor ticked REVIEW_CONSENT_WORDING
   * (their words, first name and place on the site). Always false elsewhere.
   */
  review: boolean;
  /** When the review box was ticked; null otherwise. */
  reviewAt: string | null;
  /** REVIEW_CONSENT_VERSION when `review` is true; null otherwise. */
  reviewWordingVersion: string | null;
};

export type LeadSource = {
  /** The /from/<channel> landing page the visitor came through this session (youtube, instagram, facebook, nextdoor). */
  channel: string | null;
  page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  /** The first page of the visitor's first visit (90-day first touch, components/utm-tracker.tsx). */
  landingPath: string | null;
  /** The external site that sent them on that first visit, if any. */
  firstTouchReferrer: string | null;
  /** When the first touch was recorded. */
  firstTouchAt: string | null;
  /**
   * True when Home Platform's lead pixel was running on the page, so the form
   * already reached the CRM from the browser (lib/home-platform.ts). A
   * server-side path into Home Platform skips these, except referrals: the
   * pixel sends the referrer, not the person who is moving.
   */
  homePlatformPixel: boolean;
};

export type LeadProperty = {
  slug: string | null;
  title: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  mls: string | null;
  url: string | null;
};

/**
 * Referral form only: the person who is moving, as the referrer gave them.
 * The lead's own firstName/lastName/email/phone are the referrer's; these are
 * the person to create in the CRM, with `note` as the contact's note. The
 * referrer ticked REFERRAL_CONSENT_WORDING (lib/leads.ts), so `told` is
 * always true here, with the time and the wording version it was ticked under.
 */
export type LeadReferral = {
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  /** Buying, Selling or Moving here (REFERRAL_PLANS), when the referrer said. */
  plan: string | null;
  told: true;
  toldAt: string;
  toldWordingVersion: string;
  /** The referrer's name, e.g. "Pat Example". */
  referredBy: string;
  /** The referrer's email, and phone when given, for the note and the thank-you. */
  referredByEmail: string;
  referredByPhone: string | null;
  /** The CRM note: that the contact came via a referral, who referred them, and what they're planning. */
  note: string;
};

/** The JSON a Zapier Catch Hook receives. Field map: docs/INTEGRATIONS.md. */
export type CrmLead = {
  form: LeadForm;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  message: string | null;
  market: string | null;
  propertyAddress: string | null;
  timing: string | null;
  sellFirst: string | null;
  /** Listing inquiries only. */
  property: LeadProperty | null;
  /** Referral form only: the person who's moving and the note for the CRM (LeadReferral). */
  referral: LeadReferral | null;
  consent: LeadConsent;
  source: LeadSource;
  submittedAt: string;
  tags: string[];
  site: string;
  /** Set by scripts/test-lead.mjs so Zapier can filter rehearsal leads. */
  test: boolean;
};

export type CrmResult =
  | { ok: true; provider: CrmProvider; status: number; attempts: number; detail?: string }
  | { ok: false; provider: CrmProvider; status: number; attempts: number; error: string; reason: CrmFailure };

export type CrmFailure = "not_configured" | "rejected" | "network" | "fub_archived_204";

/** Build the tag list the CRM sees. Zapier maps it to the Compass tags field. */
export function leadTags(input: {
  form: LeadForm;
  market?: string | null;
  consentEmail: boolean;
  consentSms: boolean;
  /** Review-permission form: the visitor gave permission to use their words. */
  consentReview?: boolean;
  /** The /from/<channel> page this session came through; wins over utm_source. */
  channel?: string | null;
  utmSource?: string | null;
  test?: boolean;
}): string[] {
  const tags = [`form:${input.form}`];
  if (input.market) tags.push(`market:${input.market}`);
  if (input.consentEmail) tags.push("consent:email");
  if (input.consentSms) tags.push("consent:sms");
  if (input.consentReview) tags.push("consent:review");
  tags.push(`source:${(input.channel || input.utmSource || "direct").toLowerCase().replace(/\s+/g, "-").slice(0, 60)}`);
  tags.push("site:jjpremiergroup");
  if (input.test) tags.push("test");
  return tags;
}

const WEBHOOK_TIMEOUT_MS = 8_000;
const WEBHOOK_ATTEMPTS = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST to the Zapier Catch Hook. Any 2xx is success; one retry on anything else. */
async function deliverViaWebhook(lead: CrmLead, fetchImpl: typeof fetch): Promise<CrmResult> {
  const url = process.env.CRM_WEBHOOK_URL;
  if (!url) {
    return { ok: false, provider: "webhook", status: 0, attempts: 0, error: "CRM_WEBHOOK_URL is not set", reason: "not_configured" };
  }
  const body = JSON.stringify(lead);
  let lastError = "unknown";
  let lastStatus = 0;
  let reason: CrmFailure = "network";
  for (let attempt = 1; attempt <= WEBHOOK_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      if (res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: true, provider: "webhook", status: res.status, attempts: attempt, detail: text.slice(0, 200) || undefined };
      }
      const text = await res.text().catch(() => "");
      lastStatus = res.status;
      lastError = `${res.status} ${text.slice(0, 300)}`.trim();
      reason = "rejected";
      console.error(`[crm] webhook ${res.status} (attempt ${attempt}/${WEBHOOK_ATTEMPTS})`, text.slice(0, 300));
    } catch (err) {
      lastStatus = 0;
      lastError = err instanceof Error ? err.message : String(err);
      reason = "network";
      console.error(`[crm] webhook network error (attempt ${attempt}/${WEBHOOK_ATTEMPTS})`, lastError);
    }
    if (attempt < WEBHOOK_ATTEMPTS) await sleep(750);
  }
  return { ok: false, provider: "webhook", status: lastStatus, attempts: WEBHOOK_ATTEMPTS, error: lastError, reason };
}

/** The Follow Up Boss path, kept intact for CRM_PROVIDER=fub. */
async function deliverViaFub(lead: CrmLead): Promise<CrmResult> {
  const messageLines = [
    lead.message,
    lead.timing ? `Timing: ${lead.timing}` : undefined,
    lead.sellFirst ? `House to sell first: ${lead.sellFirst}` : undefined,
    lead.market ? `Market: ${lead.market}` : undefined,
    lead.propertyAddress ? `Address to value: ${lead.propertyAddress}` : undefined,
    lead.property?.title ? `Property: ${lead.property.title}` : undefined,
    lead.referral ? lead.referral.note : undefined,
    lead.consent.review ? `Review permission: YES at ${lead.consent.reviewAt} (wording ${lead.consent.reviewWordingVersion})` : undefined,
    lead.source.channel ? `Came through: /from/${lead.source.channel}` : undefined,
    "",
    `Form: ${lead.form} · ${lead.site}`,
    lead.consent.wordingVersion === NOT_SHOWN_CONSENT_VERSION
      ? "Email and call/text consent: not asked on this form"
      : `Email consent: ${lead.consent.email ? `YES at ${lead.consent.timestamp}` : "NO"} · Call/text consent: ${lead.consent.sms ? `YES at ${lead.consent.timestamp}` : "NO"} (${lead.consent.wordingVersion === IMPLIED_CONSENT_VERSION ? "email implied by subscribing" : "both unchecked by default"}; wording ${lead.consent.wordingVersion})`,
  ].filter((l): l is string => l !== undefined && l !== null);

  const property: FubProperty | undefined = lead.property
    ? {
        street: lead.property.street ?? undefined,
        city: lead.property.city ?? undefined,
        state: lead.property.state ?? undefined,
        code: lead.property.zip ?? undefined,
        price: lead.property.price ?? undefined,
        mlsNumber: lead.property.mls ?? undefined,
        url: lead.property.url ?? undefined,
      }
    : undefined;

  const result = await sendLeadEvent({
    type: FUB_TYPE[lead.form],
    message: messageLines.join("\n"),
    description: `${lead.form} form on ${lead.site}`,
    person: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      emails: [{ value: lead.email }],
      phones: lead.phone ? [{ value: lead.phone }] : undefined,
      tags: ["website", ...lead.tags],
    },
    property,
    campaign: lead.source.utm_source || lead.source.channel
      ? {
          source: (lead.source.utm_source ?? lead.source.channel)!,
          medium: lead.source.utm_medium ?? undefined,
          term: lead.source.utm_term ?? undefined,
          content: lead.source.utm_content ?? undefined,
          campaign: lead.source.utm_campaign ?? undefined,
        }
      : undefined,
    pageUrl: lead.source.page ?? undefined,
    pageReferrer: lead.source.referrer ?? undefined,
  });

  if (result.ok && result.status === 204) {
    return { ok: false, provider: "fub", status: 204, attempts: 1, error: "204: lead flow archived in Follow Up Boss", reason: "fub_archived_204" };
  }
  if (result.ok) {
    return { ok: true, provider: "fub", status: result.status, attempts: 1, detail: result.personId ? `person ${result.personId}` : undefined };
  }
  if (result.error === "not_configured") {
    return { ok: false, provider: "fub", status: 0, attempts: 0, error: "FUB_API_KEY / FUB_SYSTEM / FUB_SYSTEM_KEY not set", reason: "not_configured" };
  }
  return {
    ok: false,
    provider: "fub",
    status: result.status,
    attempts: 3,
    error: result.error,
    reason: result.status === 0 ? "network" : "rejected",
  };
}

/**
 * Send one lead to whichever CRM is configured. Resolves, never throws.
 * With CRM_PROVIDER=none the result is a "not_configured" failure, which the
 * pipeline records as skipped rather than alerting on.
 */
export async function deliverLeadToCrm(
  lead: CrmLead,
  opts: { fetchImpl?: typeof fetch } = {},
): Promise<CrmResult> {
  const provider = getCrmProvider();
  if (provider === "webhook") return deliverViaWebhook(lead, opts.fetchImpl ?? fetch);
  if (provider === "fub") return deliverViaFub(lead);
  return { ok: false, provider: "none", status: 0, attempts: 0, error: "CRM_PROVIDER=none", reason: "not_configured" };
}

/** The lead source as the CRM sees it; the webhook payload carries `site` too. */
export const LEAD_SITE = site.domain;

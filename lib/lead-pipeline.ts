import "server-only";
import { deliverLeadToCrm, LEAD_SITE, leadTags, type CrmLead, type CrmResult, type LeadReferral } from "@/lib/crm";
import { alertLeadDelivery, notifyTeamOfLead } from "@/lib/lead-alert";
import { getCrmProvider } from "@/lib/lead-sinks";
import {
  CONSENT_WORDING_VERSION,
  EMAIL_ONLY_FORMS,
  IMPLIED_CONSENT_VERSION,
  NO_MARKETING_CONSENT_FORMS,
  NOT_SHOWN_CONSENT_VERSION,
  REFERRAL_CONSENT_VERSION,
  REVIEW_CONSENT_VERSION,
  type LeadInput,
} from "@/lib/leads";
import { requestSubscriptions, type SubscribeOutcome } from "@/lib/newsletter/service";
import { sendPlausibleEvent } from "@/lib/plausible-server";
import { site } from "@/lib/site";

/**
 * One lead, start to finish. Order matters:
 *
 *   1. Mirror to Postgres (leads + contacts + events). The lead row exists
 *      before anything external is tried, so a CRM outage loses nothing.
 *   2. Deliver to the CRM (lib/crm.ts) and record the result on the lead row
 *      and in lead_deliveries.
 *   3. Email the team the full payload (Resend) — the safety net.
 *   4. If the CRM failed, send the alert email.
 *   5. Server-side "Lead server" Plausible event, the ad-blocker backstop (the
 *      browser owns the Lead and Subscribe goals).
 *   6. Newsletter sign-up (lib/newsletter): for the Tide and Encore boxes, or
 *      the email box ticked on another form, the subscription is recorded and
 *      one confirmation email goes to the visitor (double opt-in). Off unless
 *      subscriber email is configured; never affects whether the lead counts.
 *
 * The visitor is shown an error only when nothing kept the lead. Apart from
 * that confirmation (and, once they confirm, the newsletters), the site never
 * emails the visitor; agents reply from their own mailboxes.
 */

export type LeadContext = {
  /** utm_* / gclid / fbclid / captured_at / landing_path from the session store. */
  utm: Record<string, string>;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  /** Marks a rehearsal lead (scripts/test-lead.mjs). */
  test?: boolean;
};

export type SinkOutcome = { status: "ok" | "failed" | "skipped"; detail?: string; statusCode?: number };

export type LeadOutcome = {
  /** True when at least one sink kept the lead (or in development, where logging counts). */
  captured: boolean;
  leadId: string | null;
  lead: CrmLead;
  sinks: {
    postgres: SinkOutcome;
    crm: SinkOutcome & { provider: string };
    teamEmail: SinkOutcome;
    plausible: SinkOutcome;
  };
  /** What happened with each newsletter the form asked for (empty when none, or when subscriber email is off). */
  newsletter: SubscribeOutcome[];
};

function splitName(first: string, last: string): { firstName: string; lastName: string } {
  if (last) return { firstName: first, lastName: last };
  const parts = first.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
  return { firstName: first, lastName: "" };
}

const nul = (v: string | undefined | null): string | null => (v ? v : null);

/**
 * The referred person, with the note the CRM shows on their contact: that
 * they came via a referral, who referred them, and what they're planning.
 * Only when the form is the referral and the box was ticked (the schema
 * requires both).
 */
function buildReferral(data: LeadInput, referrer: { firstName: string; lastName: string }, now: Date): LeadReferral | null {
  if (data.form !== "referral" || !data.referredName || !data.referralConsent) return null;
  const them = `${data.referredName} ${data.referredLastName ?? ""}`.trim();
  const referredBy = `${referrer.firstName} ${referrer.lastName}`.trim();
  const reach = [data.referredEmail?.toLowerCase(), data.referredPhone].filter(Boolean).join(", ");
  const note = [
    `Came via a referral from ${referredBy} (${[data.email.toLowerCase(), data.phone].filter(Boolean).join(", ")}).`,
    `${referredBy} says ${them} knows their details were passed along and expects to hear from Joelyn and Jessica.`,
    data.referredPlan ? `Planning: ${data.referredPlan.toLowerCase()}.` : null,
    reach ? `Reach them at ${reach}.` : null,
    data.message ? `Note from ${referrer.firstName}: ${data.message}` : null,
  ]
    .filter((l): l is string => Boolean(l))
    .join(" ");
  return {
    firstName: data.referredName,
    lastName: nul(data.referredLastName),
    email: data.referredEmail ? data.referredEmail.toLowerCase() : null,
    phone: nul(data.referredPhone),
    plan: nul(data.referredPlan),
    told: true,
    toldAt: now.toISOString(),
    toldWordingVersion: REFERRAL_CONSENT_VERSION,
    referredBy,
    referredByEmail: data.email.toLowerCase(),
    referredByPhone: nul(data.phone),
    note,
  };
}

/** Shape the validated form input into the payload every sink receives. */
export function buildCrmLead(data: LeadInput, ctx: LeadContext, now: Date): CrmLead {
  const { firstName, lastName } = splitName(data.firstName || "", data.lastName || "");
  const impliedEmail = EMAIL_ONLY_FORMS.includes(data.form);
  // A form that shows neither marketing box can't collect that consent, whatever was posted.
  const marketingShown = !NO_MARKETING_CONSENT_FORMS.includes(data.form);
  const consentEmail = impliedEmail || (marketingShown && data.consentEmail);
  const consentSms = marketingShown && data.consent;
  const consentReview = data.form === "review-permission" && data.reviewConsent;
  const utm = ctx.utm;
  const channel = data.source ?? null;
  const tags = leadTags({
    form: data.form,
    market: data.market,
    consentEmail,
    consentSms,
    consentReview,
    channel,
    utmSource: utm.utm_source,
    test: ctx.test,
  });
  return {
    form: data.form,
    firstName,
    lastName,
    email: data.email.toLowerCase(),
    phone: nul(data.phone),
    message: nul(data.message),
    market: nul(data.market),
    propertyAddress: nul(data.address),
    timing: nul(data.timing),
    sellFirst: nul(data.sellFirst),
    property:
      data.form === "listing"
        ? {
            slug: nul(data.propertySlug),
            title: nul(data.propertyTitle),
            street: nul(data.propertyStreet),
            city: nul(data.propertyCity),
            state: nul(data.propertyState),
            zip: nul(data.propertyZip),
            price: data.propertyPrice ? Number(data.propertyPrice) || null : null,
            mls: nul(data.propertyMls),
            url: data.propertySlug ? `${site.url}/listings/${data.propertySlug}` : null,
          }
        : null,
    referral: buildReferral(data, { firstName, lastName }, now),
    consent: {
      email: consentEmail,
      sms: consentSms,
      // Email and call/text consent only; the review permission has its own clock below.
      timestamp: consentEmail || consentSms ? now.toISOString() : null,
      // Subscribers saw the band copy, not the checkbox: their consent is implied by subscribing.
      // A form with no marketing boxes records that none were shown.
      wordingVersion: impliedEmail ? IMPLIED_CONSENT_VERSION : marketingShown ? CONSENT_WORDING_VERSION : NOT_SHOWN_CONSENT_VERSION,
      review: consentReview,
      reviewAt: consentReview ? now.toISOString() : null,
      reviewWordingVersion: consentReview ? REVIEW_CONSENT_VERSION : null,
    },
    source: {
      channel,
      page: nul(data.pageUrl) ?? nul(ctx.referrer),
      referrer: nul(ctx.referrer),
      utm_source: nul(utm.utm_source),
      utm_medium: nul(utm.utm_medium),
      utm_campaign: nul(utm.utm_campaign),
      utm_term: nul(utm.utm_term),
      utm_content: nul(utm.utm_content),
      gclid: nul(utm.gclid),
      fbclid: nul(utm.fbclid),
      landingPath: nul(utm.landing_path),
      firstTouchReferrer: nul(utm.referrer),
      firstTouchAt: nul(utm.captured_at),
    },
    submittedAt: now.toISOString(),
    tags,
    site: LEAD_SITE,
    test: Boolean(ctx.test),
  };
}

type Db = Awaited<ReturnType<typeof loadDb>>;

async function loadDb() {
  const { getDb } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema");
  return { db: getDb(), ...schema };
}

/**
 * Write the lead (and its contacts/events rows: the consent record). Returns the
 * leads.id, or null when DATABASE_URL is unset or the write failed.
 */
async function mirrorToDatabase(lead: CrmLead, now: Date): Promise<{ leadId: string | null; contactId: string | null; outcome: SinkOutcome; db: Db | null }> {
  if (!process.env.DATABASE_URL) return { leadId: null, contactId: null, outcome: { status: "skipped", detail: "DATABASE_URL not set" }, db: null };
  let handle: Db | null = null;
  try {
    handle = await loadDb();
    const { db, contacts, events, leads } = handle;

    let contactId: string | null = null;
    try {
      const [contact] = await db
        .insert(contacts)
        .values({
          fullName: `${lead.firstName} ${lead.lastName}`.trim() || null,
          firstName: lead.firstName || null,
          lastName: lead.lastName || null,
          email: lead.email,
          phone: lead.phone,
          type: ["lead"],
          lifecycleStage: "new",
          source: lead.source.channel ?? lead.source.utm_source ?? "website",
          sourceDetail: `${lead.form}_form`,
          utm: lead.source.utm_source || lead.source.gclid || lead.source.fbclid ? lead.source : null,
          consentEmail: lead.consent.email,
          consentEmailAt: lead.consent.email ? now : null,
          consentSms: lead.consent.sms,
          consentSmsAt: lead.consent.sms ? now : null,
          consentSmsMethod: lead.consent.sms ? "web_form_checkbox" : null,
          firstTouchAt: now,
          lastTouchAt: now,
        })
        .returning({ id: contacts.id });
      contactId = contact?.id ?? null;
      if (contactId) {
        await db.insert(events).values({
          eventType: "form_submit",
          contactId,
          payload: {
            form: lead.form,
            message: lead.message,
            property: lead.property?.title ?? lead.propertyAddress,
            consent_email: lead.consent.email,
            consent_sms: lead.consent.sms,
            consent_review: lead.consent.review,
            consent_review_at: lead.consent.reviewAt,
            referred_first_name: lead.referral?.firstName ?? null,
            referred_last_name: lead.referral?.lastName ?? null,
            referred_email: lead.referral?.email ?? null,
            referred_phone: lead.referral?.phone ?? null,
            referred_plan: lead.referral?.plan ?? null,
            referral_told_at: lead.referral?.toldAt ?? null,
            referral_note: lead.referral?.note ?? null,
            consent_at: lead.consent.timestamp,
            page_url: lead.source.page,
            test: lead.test,
          },
        });
      }
    } catch (err) {
      // The contacts/events rows are secondary; the leads row below is the record.
      console.error("[lead] contacts mirror failed (non-fatal)", err);
    }

    const [row] = await db
      .insert(leads)
      .values({
        contactId,
        form: lead.form,
        firstName: lead.firstName || null,
        lastName: lead.lastName || null,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        market: lead.market,
        propertyAddress: lead.propertyAddress ?? lead.property?.street ?? null,
        timing: lead.timing,
        sellFirst: lead.sellFirst,
        consentEmail: lead.consent.email,
        consentSms: lead.consent.sms,
        consentAt: lead.consent.timestamp ? new Date(lead.consent.timestamp) : null,
        consentWordingVersion: lead.consent.wordingVersion,
        source: lead.source,
        payload: lead,
        isTest: lead.test,
        deliveryStatus: "pending",
        submittedAt: now,
      })
      .returning({ id: leads.id });
    return { leadId: row?.id ?? null, contactId, outcome: { status: "ok", detail: row?.id }, db: handle };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lead] database mirror failed (non-fatal)", message);
    return { leadId: null, contactId: null, outcome: { status: "failed", detail: message.slice(0, 300) }, db: handle };
  }
}

/** Best-effort bookkeeping: one lead_deliveries row, and the status on the lead row for the CRM sink. */
async function recordDelivery(
  db: Db | null,
  leadId: string | null,
  sink: "crm_webhook" | "fub" | "team_email" | "plausible",
  outcome: SinkOutcome & { attempts?: number },
  crm?: { status: "delivered" | "failed" | "skipped"; error?: string },
): Promise<void> {
  if (!db || !leadId) return;
  try {
    await db.db.insert(db.leadDeliveries).values({
      leadId,
      sink,
      status: outcome.status,
      statusCode: outcome.statusCode ?? null,
      attempts: outcome.attempts ?? 1,
      detail: outcome.detail?.slice(0, 1000) ?? null,
    });
    if (crm) {
      const { eq } = await import("drizzle-orm");
      await db.db
        .update(db.leads)
        .set({
          deliveryStatus: crm.status,
          deliveryError: crm.error?.slice(0, 1000) ?? null,
          deliveredAt: crm.status === "delivered" ? new Date() : null,
        })
        .where(eq(db.leads.id, leadId));
    }
  } catch (err) {
    console.error("[lead] could not record delivery (non-fatal)", err);
  }
}

function crmOutcome(result: CrmResult): SinkOutcome & { provider: string; attempts: number } {
  if (result.ok) return { status: "ok", provider: result.provider, statusCode: result.status, attempts: result.attempts, detail: result.detail };
  if (result.reason === "not_configured") return { status: "skipped", provider: result.provider, attempts: 0, detail: result.error };
  return { status: "failed", provider: result.provider, statusCode: result.status, attempts: result.attempts, detail: result.error };
}

export async function processLead(data: LeadInput, ctx: LeadContext): Promise<LeadOutcome> {
  const now = new Date();
  const lead = buildCrmLead(data, ctx, now);
  const provider = getCrmProvider();
  const isProd = process.env.NODE_ENV === "production";

  // 1. Postgres first.
  const mirror = await mirrorToDatabase(lead, now);
  const { leadId, db } = mirror;

  // 2. CRM.
  const crmResult = await deliverLeadToCrm(lead);
  const crm = crmOutcome(crmResult);
  await recordDelivery(db, leadId, provider === "fub" ? "fub" : "crm_webhook", crm, {
    status: crm.status === "ok" ? "delivered" : crm.status === "failed" ? "failed" : "skipped",
    error: crm.status === "ok" ? undefined : crm.detail,
  });
  if (crm.status === "skipped" && !isProd) {
    console.info(`[lead] dev mode — no CRM configured (${provider}); lead logged only`, { form: lead.form, leadId, tags: lead.tags });
  }

  // 3. Team email with the full payload.
  const notify = await notifyTeamOfLead(lead, { leadId, crmDelivered: crm.status === "ok", crmProvider: provider }).catch((err) => ({
    ok: false as const,
    error: err instanceof Error ? err.message : String(err),
  }));
  const teamEmail: SinkOutcome = notify.ok
    ? { status: "ok", detail: notify.id }
    : { status: "skipped" in notify && notify.skipped ? "skipped" : "failed", detail: notify.error };
  await recordDelivery(db, leadId, "team_email", teamEmail);

  // 4. Alert when the CRM path failed, or is missing in production. An explicit
  //    CRM_PROVIDER=none is a decision, not a misconfiguration, so it stays quiet.
  const explicitNone = (process.env.CRM_PROVIDER || "").trim().toLowerCase() === "none";
  if (!crmResult.ok && (crmResult.reason !== "not_configured" || (isProd && !explicitNone))) {
    await alertLeadDelivery(crmResult.reason, lead, {
      provider,
      detail: crmResult.error,
      leadId,
      mirrored: mirror.outcome.status === "ok",
      notified: teamEmail.status === "ok",
    }).catch((err) => console.error("[lead] alert email failed", err));
  }

  // 5. Server-side backstop event, attributed to the visitor through the forwarded UA and IP.
  const pageUrl = lead.source.page ?? `${site.url}/${lead.form}`;
  const plausibleResult = await sendPlausibleEvent({
    name: "Lead server",
    url: pageUrl,
    props: { form: lead.form, channel: "server" },
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  });
  const plausible: SinkOutcome = plausibleResult.ok
    ? { status: "ok", statusCode: plausibleResult.status }
    : { status: plausibleResult.skipped ? "skipped" : "failed", detail: plausibleResult.error };
  await recordDelivery(db, leadId, "plausible", plausible);

  const captured = mirror.outcome.status === "ok" || crm.status === "ok" || teamEmail.status === "ok" || !isProd;
  if (!captured) console.error("[lead] NOT CAPTURED by any sink", { form: lead.form, leadId });

  // 6. Newsletter sign-up, once the lead is safe. Needs the contacts row; never throws.
  const newsletter = mirror.outcome.status === "ok"
    ? await requestSubscriptions({ contactId: mirror.contactId, email: lead.email, form: lead.form, consentEmail: lead.consent.email, test: lead.test })
    : [];

  return {
    captured,
    leadId,
    lead,
    sinks: { postgres: mirror.outcome, crm, teamEmail, plausible },
    newsletter,
  };
}

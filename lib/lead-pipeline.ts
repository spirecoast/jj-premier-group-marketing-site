import "server-only";
import { LEAD_SITE, leadTags, type CrmLead, type LeadReferral } from "@/lib/crm";
import {
  CONSENT_WORDING_VERSION,
  EMAIL_ONLY_FORMS,
  IMPLIED_CONSENT_VERSION,
  NO_MARKETING_CONSENT_FORMS,
  NOT_SHOWN_CONSENT_VERSION,
  REFERRAL_CONSENT_VERSION,
  REVIEW_CONSENT_VERSION,
} from "@/lib/leads/constants";
import type { LeadInput } from "@/lib/leads/schema";
import { crmOutcome, deliver, enqueue, owedSinks, recordDelivery, redeliverDue, type SinkOutcome } from "@/lib/lead-outbox";
import { getCrmProvider } from "@/lib/lead-sinks";
import { requestSubscriptions, type SubscribeOutcome } from "@/lib/newsletter/service";
import { sendPlausibleEvent } from "@/lib/plausible-server";
import { site } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/deploy-env";

/**
 * One lead, start to finish.
 *
 *   1. Mirror to Postgres (leads + contacts + events) while the visitor waits.
 *      The lead row exists before anything external is tried, so a CRM
 *      outage loses nothing. A returning visitor's contacts row is updated
 *      rather than duplicated, and the lead says how many enquiries came
 *      before it.
 *   2. Newsletter sign-up (lib/newsletter), for the Tide and Encore bars or
 *      the email box ticked on another form: the subscription is recorded
 *      and one confirmation goes out (double opt-in). Off unless subscriber
 *      email is configured; never affects whether the lead counts. It runs
 *      before the response because the success line says whether to look for
 *      the confirmation.
 *   3. The visitor gets their answer. Once the row is saved, the rest runs
 *      after the response (`defer`, next/server `after`), so nobody waits on
 *      Zapier or Resend:
 *   4. The CRM, then the team email with the full payload, through the outbox
 *      (lib/lead-outbox.ts): recorded per sink, retried on a schedule when it
 *      fails, alarmed when it gives up.
 *   5. Server-side "Lead server" Plausible event, the ad-blocker backstop.
 *   6. A sweep of anything else due in the outbox.
 *
 * Without a database (or when the write fails) there's no outbox to come
 * back to, so steps 4 and 5 run before the response and decide whether the
 * lead was kept. The visitor is shown an error only when nothing kept it.
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

export type { SinkOutcome };

export type LeadOutcome = {
  /** True when at least one sink kept the lead (or in development, where logging counts). */
  captured: boolean;
  leadId: string | null;
  lead: CrmLead;
  sinks: {
    postgres: SinkOutcome;
    /** "deferred" sinks run after the response; their results are in lead_deliveries. */
    crm: (SinkOutcome | { status: "deferred" }) & { provider: string };
    teamEmail: SinkOutcome | { status: "deferred" };
    plausible: SinkOutcome | { status: "deferred" };
  };
  /** What happened with each newsletter the form asked for (empty when none, or when subscriber email is off). */
  newsletter: SubscribeOutcome[];
};

export type ProcessOptions = {
  /** Run work after the response (next/server `after`). Without it every sink runs before processLead returns. */
  defer?: (task: () => Promise<void>) => void;
  /**
   * Keep the lead but send it nowhere: a tripped honeypot or a sender over the
   * rate limit (lib/lead-guard.ts). The row is saved with this as its
   * delivery_status, so a person can still find it.
   */
  suspect?: "suspected_bot";
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
  const reach = [data.referredEmail, data.referredPhone].filter(Boolean).join(", ");
  const note = [
    `Came via a referral from ${referredBy} (${[data.email, data.phone].filter(Boolean).join(", ")}).`,
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
    email: nul(data.referredEmail),
    phone: nul(data.referredPhone),
    plan: nul(data.referredPlan),
    told: true,
    toldAt: now.toISOString(),
    toldWordingVersion: REFERRAL_CONSENT_VERSION,
    referredBy,
    referredByEmail: data.email,
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
  // Consent belongs to an address or a number: a ticked box with nothing to send to records nothing.
  const consentEmail = Boolean(data.email) && (impliedEmail || (marketingShown && data.consentEmail));
  const consentSms = marketingShown && data.consent && Boolean(data.phoneE164);
  const smsWithoutPhone = marketingShown && data.consent && !data.phoneE164;
  const consentReview = data.form === "review-permission" && data.reviewConsent;
  const utm = ctx.utm;
  const channel = data.source ?? null;
  const tags = leadTags({
    form: data.form,
    market: data.market,
    consentEmail,
    consentSms,
    consentReview,
    smsWithoutPhone,
    channel,
    utmSource: utm.utm_source,
    test: ctx.test,
  });
  return {
    leadId: null,
    form: data.form,
    firstName,
    lastName,
    email: data.email,
    phone: nul(data.phone),
    phoneE164: nul(data.phoneE164),
    priorEnquiries: null,
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
      homePlatformPixel: Boolean(data.homePlatformPixel),
    },
    submittedAt: now.toISOString(),
    tags,
    site: LEAD_SITE,
    test: Boolean(ctx.test) || isPreviewDeployment(),
  };
}

async function loadDb() {
  const { getDb } = await import("@/lib/db");
  const schema = await import("@/lib/db/schema");
  const orm = await import("drizzle-orm");
  return { db: getDb(), ...schema, orm };
}

type Db = Awaited<ReturnType<typeof loadDb>>;

/**
 * The person's contacts row: the oldest open row with the same email when
 * there is one (bumped, gaps filled, consent only ever added), a new row
 * otherwise. A per-submission `events` row is written either way, so the
 * history stays complete. Rows duplicated before this change are left as
 * they are.
 */
async function upsertContact(h: Db, lead: CrmLead, now: Date): Promise<string | null> {
  const { db, contacts, orm } = h;
  const { and, asc, isNull, sql } = orm;
  const existing = lead.email
    ? await db
        .select({ id: contacts.id, consentEmail: contacts.consentEmail, consentSms: contacts.consentSms })
        .from(contacts)
        .where(and(sql`lower(${contacts.email}) = ${lead.email}`, isNull(contacts.archivedAt)))
        .orderBy(asc(contacts.createdAt))
        .limit(1)
    : [];
  const found = existing[0];
  if (found) {
    await db
      .update(contacts)
      .set({
        firstName: sql`coalesce(${contacts.firstName}, ${lead.firstName || null})`,
        lastName: sql`coalesce(${contacts.lastName}, ${lead.lastName || null})`,
        fullName: sql`coalesce(${contacts.fullName}, ${`${lead.firstName} ${lead.lastName}`.trim() || null})`,
        phone: lead.phone ?? sql`${contacts.phone}`,
        lastTouchAt: now,
        ...(lead.consent.email && !found.consentEmail ? { consentEmail: true, consentEmailAt: now } : {}),
        ...(lead.consent.sms && !found.consentSms ? { consentSms: true, consentSmsAt: now, consentSmsMethod: "web_form_checkbox" } : {}),
      })
      .where(orm.eq(contacts.id, found.id));
    return found.id;
  }
  const [contact] = await db
    .insert(contacts)
    .values({
      fullName: `${lead.firstName} ${lead.lastName}`.trim() || null,
      firstName: lead.firstName || null,
      lastName: lead.lastName || null,
      email: lead.email || null,
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
  return contact?.id ?? null;
}

/** How many leads the site already has from this email or phone number. */
async function priorEnquiries(h: Db, lead: CrmLead): Promise<number | null> {
  if (!lead.email && !lead.phone) return 0;
  const { db, leads, orm } = h;
  const { and, eq, or, sql } = orm;
  const match = [lead.email ? eq(leads.email, lead.email) : null, lead.phone ? eq(leads.phone, lead.phone) : null].filter((c) => c !== null);
  try {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.isTest, false), match.length > 1 ? or(...match) : match[0]));
    return row?.n ?? 0;
  } catch (err) {
    console.error("[lead] prior enquiry count failed (non-fatal)", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Write the lead (and its contacts/events rows: the consent record). Returns the
 * leads.id, or null when DATABASE_URL is unset or the write failed.
 */
async function mirrorToDatabase(lead: CrmLead, now: Date, status: string): Promise<{ leadId: string | null; contactId: string | null; outcome: SinkOutcome }> {
  if (!process.env.DATABASE_URL) return { leadId: null, contactId: null, outcome: { status: "skipped", detail: "DATABASE_URL not set" } };
  try {
    const h = await loadDb();
    const { db, events, leads } = h;

    let contactId: string | null = null;
    try {
      contactId = await upsertContact(h, lead, now);
      if (contactId) {
        await db.insert(events).values({
          eventType: "form_submit",
          contactId,
          payload: {
            form: lead.form,
            message: lead.message,
            property: lead.property?.title ?? lead.propertyAddress,
            phone_e164: lead.phoneE164 ?? null,
            consent_email: lead.consent.email,
            consent_sms: lead.consent.sms,
            consent_wording_version: lead.consent.wordingVersion,
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
            suspected: status === "suspected_bot" || undefined,
            test: lead.test,
          },
        });
      }
    } catch (err) {
      // The contacts/events rows are secondary; the leads row below is the record.
      console.error("[lead] contacts mirror failed (non-fatal)", err instanceof Error ? err.message : err);
    }

    lead.priorEnquiries = lead.test || status === "suspected_bot" ? lead.priorEnquiries : await priorEnquiries(h, lead);

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
        deliveryStatus: status,
        submittedAt: now,
      })
      .returning({ id: leads.id });
    const leadId = row?.id ?? null;
    if (leadId) {
      // The payload carries its own id from here on, for the webhook and any redelivery.
      lead.leadId = leadId;
      await db
        .update(leads)
        .set({ payload: lead })
        .where(h.orm.eq(leads.id, leadId))
        .catch((err: unknown) => console.error("[lead] payload id update failed (non-fatal)", err instanceof Error ? err.message : err));
    }
    return { leadId, contactId, outcome: { status: "ok", detail: leadId ?? undefined } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[lead] database mirror failed (non-fatal)", message);
    return { leadId: null, contactId: null, outcome: { status: "failed", detail: message.slice(0, 300) } };
  }
}

async function sendServerEvent(lead: CrmLead, leadId: string | null, ctx: LeadContext): Promise<SinkOutcome> {
  const pageUrl = lead.source.page ?? `${site.url}/${lead.form}`;
  const result = await sendPlausibleEvent({
    name: "Lead server",
    url: pageUrl,
    props: { form: lead.form, channel: "server" },
    userAgent: ctx.userAgent,
    ip: ctx.ip,
  }).catch((err: unknown) => ({ ok: false as const, skipped: false, error: err instanceof Error ? err.message : String(err) }));
  const plausible: SinkOutcome = result.ok
    ? { status: "ok", statusCode: "status" in result ? result.status : undefined }
    : { status: "skipped" in result && result.skipped ? "skipped" : "failed", detail: "error" in result ? result.error : undefined };
  await recordDelivery(leadId, "plausible", plausible);
  return plausible;
}

export async function processLead(data: LeadInput, ctx: LeadContext, opts: ProcessOptions = {}): Promise<LeadOutcome> {
  const now = new Date();
  const lead = buildCrmLead(data, ctx, now);
  const provider = getCrmProvider();
  const isProd = process.env.NODE_ENV === "production";

  // 1. Postgres first.
  const mirror = await mirrorToDatabase(lead, now, opts.suspect ?? "pending");
  const { leadId } = mirror;
  const saved = mirror.outcome.status === "ok";

  if (opts.suspect) {
    console.warn("[lead] kept as suspected and sent nowhere", { form: lead.form, leadId, saved });
    return {
      captured: true,
      leadId,
      lead,
      sinks: { postgres: mirror.outcome, crm: { status: "skipped", provider, detail: opts.suspect }, teamEmail: { status: "skipped", detail: opts.suspect }, plausible: { status: "skipped", detail: opts.suspect } },
      newsletter: [],
    };
  }

  // 2. Newsletter sign-up, once the lead is safe. Needs the contacts row; never throws.
  const newsletter = saved
    ? await requestSubscriptions({ contactId: mirror.contactId, email: lead.email, form: lead.form, consentEmail: lead.consent.email, test: lead.test })
    : [];

  // 3-6. Saved and able to defer: answer the visitor now, deliver afterwards.
  if (saved && leadId && opts.defer) {
    const tracked = await enqueue(leadId, owedSinks());
    opts.defer(async () => {
      await deliver(leadId, lead, { tracked, submittedAt: now, mirrored: true, firstRun: true });
      await sendServerEvent(lead, leadId, ctx);
      if (tracked) await redeliverDue(5);
    });
    return {
      captured: true,
      leadId,
      lead,
      sinks: { postgres: mirror.outcome, crm: { status: "deferred", provider }, teamEmail: { status: "deferred" }, plausible: { status: "deferred" } },
      newsletter,
    };
  }

  // No database to come back to (or the JSON test route, which reports every sink): deliver now.
  const tracked = saved && leadId ? await enqueue(leadId, owedSinks()) : false;
  const report = await deliver(leadId, lead, { tracked, submittedAt: now, mirrored: saved, firstRun: true });
  const plausible = await sendServerEvent(lead, leadId, ctx);

  const captured = saved || report.crm.status === "ok" || report.teamEmail.status === "ok" || !isProd;
  if (!captured) console.error("[lead] NOT CAPTURED by any sink", { form: lead.form, leadId });

  return {
    captured,
    leadId,
    lead,
    sinks: { postgres: mirror.outcome, crm: report.crm, teamEmail: report.teamEmail, plausible },
    newsletter,
  };
}

export { crmOutcome };

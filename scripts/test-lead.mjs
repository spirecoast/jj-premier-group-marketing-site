#!/usr/bin/env node
/**
 * Launch rehearsal: post one test lead through the real pipeline and print
 * which sinks accepted it (Postgres, CRM webhook, team email, Plausible).
 *
 *   node scripts/test-lead.mjs                       # local dev server on :3000
 *   node scripts/test-lead.mjs --port 3401 --form sell
 *   LEAD_TEST_SECRET=… node scripts/test-lead.mjs --live https://jjpremiergroup.com --form buy
 *
 * Or skip the site and post the sample payload straight to the Zapier Catch
 * Hook, so the Zap editor has a complete sample before the site is deployed:
 *
 *   CRM_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/…" node scripts/test-lead.mjs --hook --form buy
 *
 * The lead is tagged "test" everywhere it lands (leads.is_test, the CRM tags,
 * the team email subject) so the Zap can filter it and nobody calls it back.
 * Forms: contact, buy, sell, listing, valuation, letter, calendar, referral
 * (/refer) and review-permission (/reviews). Each payload carries only the
 * fields its form can send: no marketing boxes on review-permission, no
 * timing or market on either of the last two, and the referred person's
 * details plus the ticked box on the referral.
 */

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const live = args.includes("--live") ? opt("live", "") : "";
const hookMode = args.includes("--hook");
const hookUrl = opt("hook", "") || process.env.CRM_WEBHOOK_URL || "";
const port = opt("port", "3000");
const form = opt("form", "buy");
const base = (live || `http://localhost:${port}`).replace(/\/$/, "");
const secret = process.env.LEAD_TEST_SECRET;

if (hookMode && !hookUrl) {
  console.error("--hook needs the Catch Hook URL: set CRM_WEBHOOK_URL or pass --hook <url>.");
  process.exit(2);
}
if (!hookMode && live && !secret) {
  console.error("LEAD_TEST_SECRET is required against a live site (the same value as in Vercel).");
  process.exit(2);
}

const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const emailOnly = form === "letter" || form === "calendar";
const review = form === "review-permission";
const referral = form === "referral";
/** The email and call/text boxes: every form with a name field except the review permission. */
const marketing = !emailOnly && !review;
/** A phone field: not on the subscribe bars or the review permission. */
const withPhone = !emailOnly && !review;
/** Timing select and a market (hidden, from a hub, the planner or Atlas match): the original enquiry forms only. */
const withTiming = !emailOnly && !review && !referral;
const withMarket = withTiming;
const lead = {
  form,
  firstName: emailOnly ? "" : "Test",
  lastName: emailOnly ? "" : `Lead ${stamp}`,
  email: `test+${stamp}@jjpremiergroup.com`,
  phone: withPhone ? "(941) 555-0199" : "",
  message: `TEST LEAD from scripts/test-lead.mjs at ${new Date().toISOString()}. Ignore; do not call.`,
  timing: withTiming ? "Just watching the market" : "",
  sellFirst: form === "buy" ? "Not sure yet" : "",
  market: withMarket ? "sarasota" : "",
  address: form === "valuation" || form === "sell" ? "1 Test Street, Sarasota, FL" : "",
  pageUrl: `${base}/${form === "letter" ? "blog" : form === "calendar" ? "calendar" : form === "referral" ? "refer" : form === "review-permission" ? "reviews" : form}`,
  referredName: referral ? "Sam" : "",
  referredLastName: referral ? "Referred" : "",
  referredEmail: referral ? `test+referred-${stamp}@jjpremiergroup.com` : "",
  referredPhone: referral ? "(941) 555-0198" : "",
  referredPlan: referral ? "Moving here" : "",
  referralConsent: referral ? "on" : "",
  reviewConsent: review ? "on" : "",
  consent: marketing ? "on" : "",
  consentEmail: marketing ? "on" : "",
  utm: { utm_source: "launch-test", utm_medium: "script", utm_campaign: "rehearsal", landing_path: "/", captured_at: new Date().toISOString() },
  test: true,
};

/** The payload as lib/lead-pipeline.ts builds it, for --hook mode. Keep in step with CrmLead in lib/crm.ts. */
function samplePayload() {
  const now = new Date().toISOString();
  // Subscribing implies email; otherwise the rehearsal ticks both boxes wherever the form shows them.
  const consentEmail = emailOnly || marketing;
  const consentSms = marketing && withPhone;
  const tags = [`form:${form}`];
  if (lead.market) tags.push(`market:${lead.market}`);
  if (consentEmail) tags.push("consent:email");
  if (consentSms) tags.push("consent:sms");
  if (review) tags.push("consent:review");
  tags.push("source:launch-test", "site:jjpremiergroup", "test");
  return {
    form,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone || null,
    message: lead.message,
    market: lead.market || null,
    propertyAddress: lead.address || null,
    timing: lead.timing || null,
    sellFirst: lead.sellFirst || null,
    property:
      form === "listing"
        ? { slug: "sample-listing", title: "Sample listing", street: "1 Test Street", city: "Sarasota", state: "FL", zip: "34236", price: 1, mls: "TEST", url: `${base}/listings/sample-listing` }
        : null,
    referral: referral
      ? {
          firstName: lead.referredName,
          lastName: lead.referredLastName,
          email: lead.referredEmail,
          phone: lead.referredPhone,
          plan: lead.referredPlan,
          told: true,
          toldAt: now,
          toldWordingVersion: "referral:2026-10-01.1",
          referredBy: `${lead.firstName} ${lead.lastName}`,
          referredByEmail: lead.email,
          referredByPhone: lead.phone,
          note: `Came via a referral from ${lead.firstName} ${lead.lastName} (${lead.email}, ${lead.phone}). ${lead.firstName} ${lead.lastName} says ${lead.referredName} ${lead.referredLastName} knows their details were passed along and expects to hear from Joelyn and Jessica. Planning: moving here. Reach them at ${lead.referredEmail}, ${lead.referredPhone}. Note from ${lead.firstName}: ${lead.message}`,
        }
      : null,
    consent: {
      email: consentEmail,
      sms: consentSms,
      timestamp: consentEmail || consentSms ? now : null,
      wordingVersion: emailOnly ? "implied:subscribe" : marketing ? "2026-10-01.2" : "none:not-shown",
      review,
      reviewAt: review ? now : null,
      reviewWordingVersion: review ? "review:2026-10-01.1" : null,
    },
    source: {
      channel: null,
      page: lead.pageUrl,
      referrer: null,
      utm_source: lead.utm.utm_source,
      utm_medium: lead.utm.utm_medium,
      utm_campaign: lead.utm.utm_campaign,
      utm_term: null,
      utm_content: null,
      gclid: null,
      fbclid: null,
      landingPath: lead.utm.landing_path,
      firstTouchReferrer: null,
      firstTouchAt: lead.utm.captured_at,
    },
    submittedAt: now,
    tags,
    site: "jjpremiergroup.com",
    test: true,
  };
}

async function postToHook() {
  const payload = samplePayload();
  console.log(`Posting a sample ${form} lead straight to the Catch Hook …`);
  let res;
  try {
    res = await fetch(hookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20_000) });
  } catch (err) {
    console.error(`Could not reach the hook: ${err.message}`);
    process.exit(1);
  }
  const text = await res.text();
  console.log(`HTTP ${res.status} ${text.slice(0, 200)}`);
  console.log(res.ok ? "The hook accepted it. Open the Zap editor and pick this sample; then check Zap History." : "The hook did not accept it.");
  process.exit(res.ok ? 0 : 1);
}

const headers = { "Content-Type": "application/json", "User-Agent": "jjpremiergroup-test-lead/1.0" };
if (secret) headers.Authorization = `Bearer ${secret}`;

const mark = (s) => (s === "ok" ? "accepted" : s === "skipped" ? "skipped (not configured)" : "FAILED");

async function main() {
  console.log(`Posting a test ${form} lead to ${base}/api/leads …`);
  let res;
  try {
    res = await fetch(`${base}/api/leads`, { method: "POST", headers, body: JSON.stringify(lead), signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    console.error(`Could not reach ${base}: ${err.message}`);
    process.exit(1);
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(`HTTP ${res.status}, not JSON:\n${text.slice(0, 500)}`);
    process.exit(1);
  }
  if (res.status === 404) {
    console.error("404: on a live site POST /api/leads needs LEAD_TEST_SECRET set in Vercel and passed here.");
    process.exit(1);
  }
  if (!json.sinks) {
    console.error(`HTTP ${res.status}:`, JSON.stringify(json, null, 2));
    process.exit(1);
  }
  const { sinks } = json;
  console.log("");
  console.log(`  lead id      ${json.leadId ?? "(no database)"}`);
  console.log(`  tags         ${(json.tags ?? []).join(", ")}`);
  console.log(`  postgres     ${mark(sinks.postgres.status)}${sinks.postgres.detail && sinks.postgres.status !== "ok" ? ` — ${sinks.postgres.detail}` : ""}`);
  console.log(`  crm          ${mark(sinks.crm.status)} via ${sinks.crm.provider}${sinks.crm.statusCode ? ` (HTTP ${sinks.crm.statusCode})` : ""}${sinks.crm.status === "failed" ? ` — ${sinks.crm.detail}` : ""}`);
  console.log(`  team email   ${mark(sinks.teamEmail.status)}${sinks.teamEmail.status !== "ok" && sinks.teamEmail.detail ? ` — ${sinks.teamEmail.detail}` : ""}`);
  console.log(`  plausible    ${mark(sinks.plausible.status)}${sinks.plausible.status === "failed" ? ` — ${sinks.plausible.detail}` : ""}`);
  console.log("");
  console.log(json.ok ? "Captured: at least one sink kept the lead." : "NOT CAPTURED: no sink kept the lead. Fix the configuration before launch.");
  const health = await fetch(`${base}/api/health`).then((r) => r.json()).catch(() => null);
  if (health) console.log(`Health: ok=${health.ok} env=${health.env} crm=${health.sinks.crm.provider} postgres=${health.sinks.postgres} teamEmail=${health.sinks.teamEmail} plausible=${health.sinks.plausible} booking=${health.sinks.booking}`);
  process.exit(json.ok ? 0 : 1);
}

if (hookMode) postToHook();
else main();

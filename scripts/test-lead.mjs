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
 * Forms: contact, buy, sell, listing, valuation, letter, calendar.
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
const lead = {
  form,
  firstName: emailOnly ? "" : "Test",
  lastName: emailOnly ? "" : `Lead ${stamp}`,
  email: `test+${stamp}@jjpremiergroup.com`,
  phone: emailOnly ? "" : "(941) 555-0199",
  message: `TEST LEAD from scripts/test-lead.mjs at ${new Date().toISOString()}. Ignore; do not call.`,
  timing: emailOnly ? "" : "Just watching the market",
  sellFirst: form === "buy" ? "Not sure yet" : "",
  market: emailOnly ? "" : "sarasota",
  address: form === "valuation" || form === "sell" ? "1 Test Street, Sarasota, FL" : "",
  pageUrl: `${base}/${form === "letter" ? "blog" : form === "calendar" ? "calendar" : form}`,
  consent: emailOnly ? "" : "on",
  consentEmail: emailOnly ? "" : "on",
  utm: { utm_source: "launch-test", utm_medium: "script", utm_campaign: "rehearsal", landing_path: "/", captured_at: new Date().toISOString() },
  test: true,
};

/** The payload as lib/lead-pipeline.ts builds it, for --hook mode. Keep in step with CrmLead in lib/crm.ts. */
function samplePayload() {
  const now = new Date().toISOString();
  const consentEmail = true;
  const consentSms = !emailOnly;
  const tags = [`form:${form}`];
  if (lead.market) tags.push(`market:${lead.market}`);
  if (consentEmail) tags.push("consent:email");
  if (consentSms) tags.push("consent:sms");
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
    consent: { email: consentEmail, sms: consentSms, timestamp: now, wordingVersion: emailOnly ? "implied:subscribe" : "2026-10-01.2" },
    source: {
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

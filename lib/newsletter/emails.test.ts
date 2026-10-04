import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { aiTells } from "../voice";
import { FOOTER, LICENSE, SITE, SUPERLATIVES, salesFixture, MANIFEST_COMPLETE, encoreFixture } from "../issues/fixtures";
import { buildTideIssue } from "../issues/tide-monthly";
import { buildEncoreIssue } from "../issues/encore-weekly";
import { newsletterStrings } from "./copy";
import { UNSUBSCRIBE_PLACEHOLDERS, confirmationEmail, personalize, unsentable, welcomeEmail } from "./emails";
import { ONE_CLICK_BODY, bareAddress, listUnsubscribeHeaders, subscriptionSigningId, unsubscribeLinks } from "./headers";
import { RESEND_API, sendBatch, sendOne, type OutgoingEmail } from "./resend";

const SUB = "3f1c3c1e-4a8b-4c55-9a0e-0d7c2b8f6a11";
const SIG = "abc-_123";
const links = unsubscribeLinks(SITE, SUB, SIG, "tide");
const flat = (s: string) => s.replace(/\s+/g, " ");
const FACTS = { siteUrl: FOOTER.siteUrl, domain: FOOTER.domain, teamName: FOOTER.teamName, brokerageName: FOOTER.brokerageName, officeAddress: FOOTER.officeAddress, phoneDisplay: FOOTER.phoneDisplay };

describe("unsubscribe links and headers", () => {
  it("links the page for the list, for everything, and the one-click endpoint", () => {
    assert.equal(links.list, `${SITE}/unsubscribe?s=${SUB}&sig=${SIG}&list=tide`);
    assert.equal(links.all, `${SITE}/unsubscribe?s=${SUB}&sig=${SIG}&list=all`);
    assert.equal(links.oneClick, `${SITE}/api/newsletter/unsubscribe?s=${SUB}&sig=${SIG}&list=tide`);
    assert.equal(unsubscribeLinks(`${SITE}/`, SUB, SIG, "encore").list, `${SITE}/unsubscribe?s=${SUB}&sig=${SIG}&list=encore`);
  });
  it("signs subscriptions apart from contacts", () => {
    assert.equal(subscriptionSigningId(SUB), `sub:${SUB}`);
  });
  it("sets List-Unsubscribe to the https endpoint and List-Unsubscribe-Post for one click (RFC 8058)", () => {
    const h = listUnsubscribeHeaders(links.oneClick);
    assert.deepEqual(h, { "List-Unsubscribe": `<${links.oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    assert.equal(ONE_CLICK_BODY, "List-Unsubscribe=One-Click");
    assert.ok(h["List-Unsubscribe"].startsWith("<https://"), "RFC 8058 needs an https URI");
  });
  it("adds a mailto after the https link when there's a reply-to", () => {
    const h = listUnsubscribeHeaders(links.oneClick, "team@jjpremiergroup.com");
    assert.equal(h["List-Unsubscribe"], `<${links.oneClick}>, <mailto:team@jjpremiergroup.com?subject=unsubscribe>`);
  });
  it("reads the bare address out of a From", () => {
    assert.equal(bareAddress("JJ Premier Group <letters@mail.jjpremiergroup.com>"), "letters@mail.jjpremiergroup.com");
    assert.equal(bareAddress("letters@mail.jjpremiergroup.com"), "letters@mail.jjpremiergroup.com");
  });
});

describe("the subscriber copy of an issue", () => {
  const placeholders = { list: UNSUBSCRIBE_PLACEHOLDERS.list, all: UNSUBSCRIBE_PLACEHOLDERS.all };
  const tide = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: { ...FOOTER, unsubscribe: placeholders }, audience: "subscriber" });
  const encore = buildEncoreIssue({ index: encoreFixture(), today: "2026-10-05", footer: { ...FOOTER, unsubscribe: placeholders } });

  for (const [name, issue] of [["Tide", tide], ["Encore", encore]] as const) {
    it(`${name}: each recipient gets their own links, in the HTML and the text`, () => {
      const mine = personalize(issue, links);
      assert.ok(!/%%UNSUBSCRIBE_/.test(mine.html + mine.text));
      assert.ok(mine.html.includes(`href="${links.list.replace(/&/g, "&amp;")}"`));
      assert.ok(mine.html.includes(`href="${links.all.replace(/&/g, "&amp;")}"`));
      assert.ok(mine.text.includes(links.list) && mine.text.includes(links.all));
      assert.equal(unsentable(mine), null);
      assert.match(unsentable(issue) ?? "", /placeholder/, "unfilled, it can't go");
    });
    it(`${name}: carries the brokerage, the postal address, the stop line and the UTM tags`, () => {
      const t = flat(personalize(issue, links).text);
      assert.ok(t.includes("Coldwell Banker Realty"));
      assert.ok(t.includes("100 Example Way, Suite 1, Lakewood Ranch, FL 34202"));
      assert.ok(t.includes(`Stop ${name}`));
      assert.ok(t.includes("You can also reply ‘stop’."));
      assert.ok(!t.includes("use the link in the email you received"), "the send tool's line is gone");
      assert.match(issue.html, new RegExp(`utm_source=${name.toLowerCase()}&amp;utm_medium=email&amp;utm_campaign=`));
    });
  }

  it("Tide for subscribers has no dashed boxes, no facts list and no empty note slots", () => {
    const notes = [
      { key: "joelyn" as const, name: "Joelyn Nauman", first: "Joelyn", paragraphs: ["My words."] },
      { key: "jessica" as const, name: "Jessica Garza", first: "Jessica", paragraphs: null },
    ];
    const writing = { narrative: null, notes, facts: ["A fact for the writer."] };
    const team = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER, writing });
    const sub = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER, writing, audience: "subscriber" });
    assert.ok(team.html.includes("dashed") && team.needsEdit);
    assert.ok(!sub.html.includes("dashed"));
    assert.equal(sub.needsEdit, false);
    const t = flat(sub.text);
    assert.ok(!t.includes("A fact for the writer."));
    assert.ok(!t.includes("Jessica: a few sentences"));
    assert.ok(t.includes("My words. Joelyn Nauman"), "a written note goes out");
    assert.ok(t.includes("Here’s how home sales went in July 2026"), "the plain intro stands in for the story");
  });
});

describe("the confirmation and the welcome", () => {
  const confirm = confirmationEmail({ list: "tide", origin: "signup", confirmUrl: `${SITE}/subscribe/confirm?t=abc.def`, footer: FACTS, ttlDays: 7 });
  const consent = confirmationEmail({ list: "tide", origin: "consent", confirmUrl: `${SITE}/subscribe/confirm?t=abc.def`, footer: FACTS, ttlDays: 7 });
  const encoreConfirm = confirmationEmail({ list: "encore", origin: "signup", confirmUrl: `${SITE}/subscribe/confirm?t=x.y`, footer: FACTS, ttlDays: 7 });
  const welcomeTide = welcomeEmail({ list: "tide", footer: FACTS, latestTidePath: "/tide/2026-10", unsubscribe: links });
  const welcomeEncore = welcomeEmail({ list: "encore", footer: FACTS, latestTidePath: "/tide/2026-10", unsubscribe: unsubscribeLinks(SITE, SUB, SIG, "encore") });

  it("the confirmation has the link, the expiry, the brokerage and the address, and no unsubscribe (there's no list yet)", () => {
    assert.equal(confirm.subject, "Please confirm your Tide subscription");
    assert.ok(confirm.html.includes(`href="${SITE}/subscribe/confirm?t=abc.def"`));
    const t = flat(confirm.text);
    for (const s of ["Yes, send me Tide", "7 days", "Coldwell Banker Realty", "100 Example Way, Suite 1, Lakewood Ranch, FL 34202", "Equal Housing Opportunity."]) assert.ok(t.includes(s), s);
    assert.ok(!t.includes("unsubscribe"));
    assert.ok(flat(consent.text).includes("you said we could email you"));
    assert.equal(encoreConfirm.subject, "Please confirm your Encore subscription");
  });
  it("the Tide welcome links the newest issue, tagged, with the footer and the stop links", () => {
    assert.equal(welcomeTide.subject, "Welcome to Tide");
    assert.ok(welcomeTide.html.includes(`${SITE}/tide/2026-10?utm_source=tide&amp;utm_medium=email&amp;utm_campaign=welcome`));
    const t = flat(welcomeTide.text);
    for (const s of ["first days of each month", "Lakewood Ranch, Sarasota and Bradenton", "Coldwell Banker Realty", "100 Example Way", links.list, links.all]) assert.ok(t.includes(s), s);
  });
  it("the Encore welcome links the calendar", () => {
    assert.ok(welcomeEncore.html.includes(`${SITE}/calendar?utm_source=encore&amp;utm_medium=email&amp;utm_campaign=welcome`));
    assert.ok(flat(welcomeEncore.text).includes("Monday mornings"));
  });
  it("stay short", () => {
    for (const e of [confirm, encoreConfirm, welcomeTide, welcomeEncore]) {
      const body = e.text.split("\n--\n")[0]!;
      assert.ok(body.split(/\s+/).length < 110, `${e.subject}: ${body.split(/\s+/).length} words`);
    }
  });
});

describe("the new copy", () => {
  it("passes Fair Housing, the voice rules, and has no superlatives or license numbers", () => {
    for (const { where, text } of newsletterStrings()) {
      assert.ok(checkFairHousing(text).passed, where);
      assert.deepEqual(aiTells(text), [], where);
      assert.ok(!SUPERLATIVES.test(text), where);
      assert.ok(!LICENSE.test(text), where);
      assert.ok(!/\blands?\b/i.test(text), `${where}: "lands"`);
    }
  });
});

describe("the Resend calls", () => {
  type Call = { url: string; init: RequestInit };
  const fake = (responses: (Response | Error)[]) => {
    const calls: Call[] = [];
    const impl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const r = responses.shift() ?? new Response("{}", { status: 200 });
      if (r instanceof Error) throw r;
      return r;
    }) as unknown as typeof fetch;
    return { calls, impl };
  };
  const email = (to: string): OutgoingEmail => ({ from: "JJ Premier Group <letters@mail.jjpremiergroup.com>", to, subject: "Tide · July 2026", html: "<p>x</p>", text: "x", headers: listUnsubscribeHeaders(links.oneClick), tags: [{ name: "campaign", value: "tide-2026-07" }] });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  it("posts a batch to /emails/batch with the key, the headers and the ids back in order", async () => {
    const { calls, impl } = fake([json({ data: [{ id: "e1" }, { id: "e2" }] })]);
    const res = await sendBatch([email("a@x.com"), email("b@x.com")], { apiKey: "re_test", idempotencyKey: "issue-1-abc", fetchImpl: impl });
    assert.deepEqual(res, { ok: true, ids: ["e1", "e2"], httpStatus: 200, attempts: 1 });
    assert.equal(calls[0]!.url, `${RESEND_API}/emails/batch`);
    const h = calls[0]!.init.headers as Record<string, string>;
    assert.equal(h.Authorization, "Bearer re_test");
    assert.equal(h["Idempotency-Key"], "issue-1-abc");
    const body = JSON.parse(String(calls[0]!.init.body)) as Record<string, unknown>[];
    assert.equal(body.length, 2);
    assert.deepEqual(body[0]!.to, ["a@x.com"]);
    assert.deepEqual(body[0]!.headers, { "List-Unsubscribe": `<${links.oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    assert.deepEqual(body[0]!.tags, [{ name: "campaign", value: "tide-2026-07" }]);
  });
  it("refuses more than 100 in one call", () => {
    assert.throws(() => sendBatch(Array.from({ length: 101 }, (_, i) => email(`${i}@x.com`)), { apiKey: "k", idempotencyKey: "k" }));
  });
  it("retries no answer once, with the same key and body, so Resend can't send it twice", async () => {
    const { calls, impl } = fake([new Error("socket hang up"), json({ data: [{ id: "e1" }] })]);
    const res = await sendBatch([email("a@x.com")], { apiKey: "k", idempotencyKey: "issue-1-k", fetchImpl: impl });
    assert.equal(res.ok, true);
    assert.equal(calls.length, 2);
    assert.equal((calls[0]!.init.headers as Record<string, string>)["Idempotency-Key"], (calls[1]!.init.headers as Record<string, string>)["Idempotency-Key"]);
    assert.equal(calls[0]!.init.body, calls[1]!.init.body);
  });
  it("doesn't retry a refusal (the daily quota, a bad request)", async () => {
    const { calls, impl } = fake([json({ statusCode: 429, name: "daily_quota_exceeded", message: "You have reached your daily email sending quota." }, 429)]);
    const res = await sendBatch([email("a@x.com")], { apiKey: "k", idempotencyKey: "k", fetchImpl: impl });
    assert.equal(calls.length, 1);
    assert.deepEqual(res, { ok: false, httpStatus: 429, error: "You have reached your daily email sending quota.", attempts: 1 });
  });
  it("sends one email to /emails", async () => {
    const { calls, impl } = fake([json({ id: "one" })]);
    const res = await sendOne(email("a@x.com"), { apiKey: "k", idempotencyKey: "confirm-1", fetchImpl: impl });
    assert.deepEqual(res, { ok: true, ids: ["one"], httpStatus: 200, attempts: 1 });
    assert.equal(calls[0]!.url, `${RESEND_API}/emails`);
  });
});

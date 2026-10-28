import assert from "node:assert/strict";
import { test } from "node:test";
import { keepEmail } from "./email";
import { KEEP_DAILY_CAP_DEFAULT, keepDailyCap, keepEmailEnabled } from "./limits";
import { KEEP_TOOLS, isKeepTool, keepPath } from "./tools";

test("isKeepTool knows the registry and nothing else", () => {
  assert.equal(isKeepTool("atlas-move"), true);
  assert.equal(isKeepTool("tide-issue"), true);
  assert.equal(isKeepTool("toString"), false);
  assert.equal(isKeepTool("__proto__"), false);
  assert.equal(isKeepTool(3), false);
});

test("keepPath keeps the tool's own page and its query, on this site only", () => {
  assert.equal(keepPath("atlas-move", "/relocate?in=2027-02-15&path=buying"), "/relocate?in=2027-02-15&path=buying");
  // Any host is dropped: the link is always built on the site's own origin.
  assert.equal(keepPath("atlas-move", "https://evil.example/relocate?in=2027-02-15"), "/relocate?in=2027-02-15");
  assert.equal(keepPath("tide-sale-calculator", "https://jjpremiergroup.com/sell/net-proceeds?price=650000&county=manatee"), "/sell/net-proceeds?price=650000&county=manatee");
  assert.equal(keepPath("atlas-move", "/sell/net-proceeds?price=1"), null);
  assert.equal(keepPath("atlas-move", "/relocate/../admin"), null);
  assert.equal(keepPath("atlas-move", "javascript:alert(1)"), null);
  assert.equal(keepPath("atlas-move", "mailto:a@b.co"), null);
  assert.equal(keepPath("atlas-move", ""), null);
  assert.equal(keepPath("atlas-move", 42), null);
  assert.equal(keepPath("atlas-move", `/relocate?x=${"a".repeat(1600)}`), null);
  // An issue lives under /tide/, never at /tide itself or anywhere odd.
  assert.equal(keepPath("tide-issue", "/tide/2026-10"), "/tide/2026-10");
  assert.equal(keepPath("tide-issue", "/tide/"), null);
  assert.equal(keepPath("tide-issue", "/tide"), null);
  assert.equal(keepPath("tide-issue", "/tide/<script>"), null);
});

test("every tool names a page, a subject and a source line", () => {
  for (const [id, t] of Object.entries(KEEP_TOOLS)) {
    assert.ok(t.path.startsWith("/"), id);
    assert.ok(t.subject.length > 3, id);
    assert.ok(t.source.length > 10, id);
  }
});

test("the daily cap reads KEEP_EMAIL_DAILY_CAP, 0 turning it off", () => {
  assert.equal(keepDailyCap({}), KEEP_DAILY_CAP_DEFAULT);
  assert.equal(keepDailyCap({ KEEP_EMAIL_DAILY_CAP: "0" }), 0);
  assert.equal(keepDailyCap({ KEEP_EMAIL_DAILY_CAP: " 25 " }), 25);
  assert.equal(keepDailyCap({ KEEP_EMAIL_DAILY_CAP: "1000" }), 100);
  assert.equal(keepDailyCap({ KEEP_EMAIL_DAILY_CAP: "-3" }), KEEP_DAILY_CAP_DEFAULT);
  assert.equal(keepDailyCap({ KEEP_EMAIL_DAILY_CAP: "lots" }), KEEP_DAILY_CAP_DEFAULT);
});

test("Email me this is on only with the email path and a database", () => {
  const full = { RESEND_API_KEY: "re_x", RESEND_FROM_EMAIL: "website@mail.example.com", DATABASE_URL: "postgres://x" };
  assert.equal(keepEmailEnabled(full), true);
  assert.equal(keepEmailEnabled({ ...full, RESEND_API_KEY: "" }), false);
  assert.equal(keepEmailEnabled({ ...full, RESEND_FROM_EMAIL: undefined }), false);
  assert.equal(keepEmailEnabled({ ...full, DATABASE_URL: " " }), false);
  assert.equal(keepEmailEnabled({ ...full, KEEP_EMAIL_DAILY_CAP: "0" }), false);
  assert.equal(keepEmailEnabled({}), false);
});

test("the email carries the link, the team and nothing a request could inject", () => {
  const { subject, html } = keepEmail({
    tool: "atlas-move",
    link: 'https://jjpremiergroup.com/relocate?in=2027-02-15&x="><script>',
    siteName: "JJ Premier Group",
    siteHost: "jjpremiergroup.com",
    brokerage: "Coldwell Banker Realty",
    team: [
      { name: "Joelyn Nauman", phone: "(941) 555-0100" },
      { name: "Jessica Garza", phone: "(941) 555-0101" },
    ],
    replyable: true,
  });
  assert.equal(subject, "Your Atlas Move plan");
  assert.ok(html.includes("Here&rsquo;s your moving plan."));
  assert.ok(html.includes("Joelyn &amp; Jessica"));
  assert.ok(html.includes("Coldwell Banker Realty"));
  assert.ok(html.includes("reply to this email"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"));
  const quiet = keepEmail({ tool: "tide-home-value", link: "https://jjpremiergroup.com/sell/home-value", siteName: "JJ Premier Group", siteHost: "jjpremiergroup.com", brokerage: "Coldwell Banker Realty", team: [], replyable: false });
  assert.ok(!quiet.html.includes("reply to this email"));
});

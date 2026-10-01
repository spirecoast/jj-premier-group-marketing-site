import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { ENCORE_COPY, FOOTER_COPY, issueStrings } from "./copy";
import { MAX_PICKS, buildEncoreIssue, encoreTeamSubject, encoreWeek, onViewInWeek, pickWeek } from "./encore-weekly";
import { FOOTER, FOOTER_NO_STREET, LICENSE, SITE, SUPERLATIVES, encoreFixture } from "./fixtures";
import { wrapLine } from "./render";

const flat = (s: string) => s.replace(/\s+/g, " ");

describe("encoreWeek", () => {
  it("covers the coming Monday to Sunday", () => {
    assert.deepEqual(encoreWeek("2026-10-01"), { from: "2026-10-05", to: "2026-10-11" }); // Thursday
    assert.deepEqual(encoreWeek("2026-10-04"), { from: "2026-10-05", to: "2026-10-11" }); // Sunday
    assert.deepEqual(encoreWeek("2026-10-06"), { from: "2026-10-12", to: "2026-10-18" }); // Tuesday
  });
  it("is this week on a Monday, when the cron runs", () => {
    assert.deepEqual(encoreWeek("2026-10-05"), { from: "2026-10-05", to: "2026-10-11" });
  });
  it("crosses a month and a year", () => {
    assert.deepEqual(encoreWeek("2026-12-30"), { from: "2027-01-04", to: "2027-01-10" });
  });
});

describe("pickWeek", () => {
  const index = encoreFixture();
  const picks = pickWeek(index, "2026-10-05", "2026-10-11");

  it("takes up to twelve, one per production, inside the week, in time order", () => {
    assert.equal(picks.length, MAX_PICKS);
    assert.equal(new Set(picks.map((o) => o.e.s)).size, picks.length);
    for (const o of picks) assert.ok(o.day >= "2026-10-05" && o.day <= "2026-10-11");
    for (let i = 1; i < picks.length; i += 1) assert.ok(picks[i - 1]!.start <= picks[i]!.start);
  });
  it("never picks a sold-out show or one outside the week", () => {
    assert.ok(!picks.some((o) => o.e.s === "sold-out-gala" || o.e.s === "next-week-only"));
  });
  it("spreads the picks across the three markets and the categories", () => {
    const byMarket = new Map<string, number>();
    for (const o of picks) byMarket.set(o.e.m, (byMarket.get(o.e.m) ?? 0) + 1);
    assert.deepEqual([...byMarket.values()].sort(), [4, 4, 4]);
    assert.ok(new Set(picks.map((o) => o.e.c)).size >= 6);
  });
  it("is deterministic", () => {
    assert.deepEqual(
      pickWeek(index, "2026-10-05", "2026-10-11").map((o) => `${o.e.s}@${o.start}`),
      picks.map((o) => `${o.e.s}@${o.start}`),
    );
  });
});

describe("onViewInWeek", () => {
  it("lists exhibitions open during the week, closing soonest first", () => {
    assert.deepEqual(
      onViewInWeek(encoreFixture(), "2026-10-05", "2026-10-11").map((e) => e.s),
      ["prints-on-paper", "river-photographs"],
    );
  });
});

describe("buildEncoreIssue", () => {
  const issue = buildEncoreIssue({ index: encoreFixture(), today: "2026-10-01", footer: FOOTER });

  it("names the week in the subject, the period and the team subject", () => {
    assert.equal(issue.subject, "Encore · the week of October 5 to 11");
    assert.deepEqual(issue.period, { from: "2026-10-05", to: "2026-10-11", label: "October 5 to 11" });
    assert.equal(encoreTeamSubject(issue), "Encore for Monday October 5, 2026: ready to send");
    assert.equal(issue.needsEdit, false);
  });
  it("counts the week's performances in the intro", () => {
    // 30 productions with two dates each in the week, plus the sold-out gala.
    assert.equal(issue.performances, 61);
    assert.ok(flat(issue.text).includes("12 picks from the 61 performances"));
  });
  it("links every pick to its event page, with day, time, venue and market", () => {
    for (const o of issue.picks) {
      assert.ok(issue.html.includes(`${SITE}/calendar/${o.e.s}?utm_source=encore`), o.e.s);
      assert.ok(flat(issue.text).includes(o.e.t));
      assert.ok(issue.html.includes(o.e.vn.replace(/&/g, "&amp;")));
    }
    assert.ok(issue.html.includes("Tuesday, October 6 · 7:30 PM") || issue.html.includes("Monday, October 5 · 7:30 PM"));
  });
  it("has the On view block", () => {
    assert.ok(issue.html.includes(ENCORE_COPY.onViewHeading));
    assert.ok(issue.text.includes("Prints on Paper"));
    assert.ok(issue.text.includes("Through Oct 31"));
  });
  it("is email HTML: one 600px column, inline styles, no external CSS, no scripts", () => {
    assert.match(issue.html, /^<!doctype html>/);
    assert.ok(issue.html.includes('width="600"'));
    assert.ok(!/<link\b/i.test(issue.html));
    assert.ok(!/<style\b/i.test(issue.html));
    assert.ok(!/<script\b/i.test(issue.html));
    assert.ok(!/class="/i.test(issue.html));
  });
  it("loads images and links only from the site", () => {
    const srcs = [...issue.html.matchAll(/\bsrc="([^"]+)"/g)].map((m) => m[1]!);
    assert.deepEqual(srcs, [`${SITE}/api/issues/encore/image/${issue.picks[0]!.e.s}`]);
    for (const s of srcs) assert.ok(s.startsWith(`${SITE}/`), s);
    for (const [, href] of issue.html.matchAll(/\bhref="([^"]+)"/g)) assert.ok(href!.startsWith(`${SITE}/`), href);
  });
  it("carries the CAN-SPAM footer: sender, postal address, unsubscribe instruction", () => {
    for (const body of [issue.html, flat(issue.text)]) {
      assert.ok(body.includes("Sent by Joelyn Nauman and Jessica Garza, JJ Premier Group, Coldwell Banker Realty."));
      assert.ok(body.includes("100 Example Way, Suite 1, Lakewood Ranch, FL 34202"));
      assert.ok(body.includes(FOOTER_COPY.unsubscribe));
      assert.ok(body.includes(`${SITE}/api/calendar.ics`));
      assert.ok(body.includes("Equal Housing Opportunity."));
    }
    assert.deepEqual(issue.warnings, []);
  });
  it("warns when settings have no street address", () => {
    const thin = buildEncoreIssue({ index: encoreFixture(), today: "2026-10-01", footer: FOOTER_NO_STREET });
    assert.ok(thin.warnings.some((w) => w.includes("CAN-SPAM")));
    assert.ok(thin.text.includes("\nLakewood Ranch, FL\n"));
  });
  it("leaves no token unfilled", () => {
    assert.ok(!/\{\w+\}/.test(issue.html));
    assert.ok(!/\{\w+\}/.test(issue.text));
  });
  it("passes Fair Housing, has no superlatives and no license numbers", () => {
    assert.equal(checkFairHousing(issue.html).passed, true);
    assert.equal(checkFairHousing(issue.text).passed, true);
    const prose = issue.text.replace(/JJ Premier Group/g, "");
    assert.ok(!SUPERLATIVES.test(prose), prose.match(SUPERLATIVES)?.[0]);
    assert.ok(!LICENSE.test(issue.html));
  });
  it("says so when the week is empty, and still renders", () => {
    const empty = buildEncoreIssue({ index: { ...encoreFixture(), perfs: [] }, today: "2026-10-01", footer: FOOTER });
    assert.equal(empty.picks.length, 0);
    assert.ok(flat(empty.text).includes(ENCORE_COPY.introEmpty));
    assert.ok(empty.warnings.some((w) => w.includes("no dated performances")));
  });
});

describe("the plain text", () => {
  it("wraps a long pick title under itself, indented like the lines after it", () => {
    const line = "Wed Oct 7, 6:30 PM · Salsa & Sunsets 4th Anniversary Community Celebration at the bay";
    const out = wrapLine(line, 40, "  ").split("\n");
    assert.ok(out.length >= 3);
    assert.ok(out[0]!.startsWith("Wed Oct 7"));
    for (const l of out.slice(1)) assert.ok(l.startsWith("  ") && !l.startsWith("   "), l);
    for (const l of out) assert.ok(l.length <= 40, l);
    assert.equal(out.join(" ").replace(/\s+/g, " "), line);
  });
  it("keeps a URL whole", () => {
    const url = `  ${SITE}/calendar/a-very-long-slug-that-goes-on-and-on?utm_source=encore&utm_medium=email`;
    assert.equal(wrapLine(url, 40), url);
  });
});

describe("the issue templates", () => {
  it("pass Fair Housing and carry no superlatives or license numbers", () => {
    for (const { where, text } of issueStrings()) {
      const fh = checkFairHousing(text);
      assert.equal(fh.passed, true, `${where}: ${JSON.stringify(fh)}`);
      assert.ok(!SUPERLATIVES.test(text), `${where}: ${text}`);
      assert.ok(!LICENSE.test(text), where);
    }
  });
  it("use the guide's contractions", () => {
    const all = issueStrings().map((s) => s.text).join(" ");
    assert.match(all, /\b(Here’s|doesn’t|What’s|You’re|isn’t|aren’t)\b/);
  });
});

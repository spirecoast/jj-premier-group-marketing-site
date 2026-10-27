import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import vercel from "../../vercel.json";
import { CRON_JOBS, compactSummary, describeSchedule, jobForPath, jobSlug, judge, maxGapHours, problemsToReport, standing } from "./jobs";

describe("jobSlug", () => {
  it("names a job after its path", () => {
    assert.equal(jobSlug("/api/encore/check"), "encore-check");
    assert.equal(jobSlug("/api/cron/archive-events"), "archive-events");
    assert.equal(jobSlug("/api/newsletter/send/encore/"), "newsletter-send-encore");
    assert.equal(jobSlug("/api/search/reindex"), "search-reindex");
  });
  it("finds every cron in vercel.json by its path", () => {
    assert.equal(CRON_JOBS.length, vercel.crons.length);
    for (const c of vercel.crons) assert.equal(jobForPath(c.path)?.schedule, c.schedule);
    assert.equal(new Set(CRON_JOBS.map((j) => j.slug)).size, CRON_JOBS.length, "two crons share a slug");
  });
});

describe("every cron route is monitored", () => {
  it("wraps its handler in monitoredCron (lib/ops/cron.ts)", () => {
    const root = join(import.meta.dirname, "../..");
    for (const c of vercel.crons) {
      const direct = join(root, "app", c.path, "route.ts");
      // /api/newsletter/send/encore is served by /api/newsletter/send/[kind].
      const dynamic = join(root, "app", c.path.replace(/\/[^/]+$/, "/[kind]"), "route.ts");
      const file = existsSync(direct) ? direct : dynamic;
      assert.ok(existsSync(file), `no route file for ${c.path}`);
      assert.match(readFileSync(file, "utf8"), /monitoredCron\(/, `${c.path} isn't wrapped in monitoredCron: its failures would go unnoticed`);
    }
  });
});

describe("maxGapHours", () => {
  it("allows a day and two hours for a daily job", () => {
    assert.equal(maxGapHours("41 7 * * *"), 26);
  });
  it("allows a week for a weekly job", () => {
    assert.equal(maxGapHours("0 9 * * 1"), 7 * 24 + 2);
    assert.equal(maxGapHours("17 5 * * 0"), 7 * 24 + 2);
  });
  it("allows the longest gap between the days listed", () => {
    assert.equal(maxGapHours("0 9 * * 1-5"), 3 * 24 + 2);
    assert.equal(maxGapHours("0 9 * * 1,4"), 4 * 24 + 2);
  });
  it("allows a 31-day month for a monthly job", () => {
    assert.equal(maxGapHours("0 12 1 * *"), 31 * 24 + 2);
    assert.equal(maxGapHours("0 13 3 * *"), 31 * 24 + 2);
  });
});

describe("judge", () => {
  it("passes a 2xx run", () => {
    assert.deepEqual(judge(200, { deleted: 0 }), { outcome: "ok", problems: [], headline: "ok" });
  });
  it("names the Encore sources behind a 207, the follow-up's too", () => {
    const v = judge(207, { failed: [{ id: "van-wezel", error: "403" }], followUp: { failed: [{ id: "asolo-rep", error: "timeout" }] } });
    assert.equal(v.outcome, "partial");
    assert.deepEqual(v.problems, ["source:asolo-rep", "source:van-wezel"]);
    assert.match(v.headline, /2 sources failed: asolo-rep, van-wezel/);
  });
  it("names the search sources behind a 207", () => {
    assert.deepEqual(judge(207, { sourceErrors: ["guides: fetch failed", "events: 500"] }).problems, ["source:events", "source:guides"]);
  });
  it("counts a held newsletter hand-off as held, not failed", () => {
    assert.equal(judge(422, { ok: false, held: "the month isn't complete" }).outcome, "held");
  });
  it("fails anything else, with the message", () => {
    const v = judge(500, { message: "DATABASE_URL is not set" });
    assert.equal(v.outcome, "failed");
    assert.deepEqual(v.problems, ["http-500"]);
    assert.match(v.headline, /HTTP 500: DATABASE_URL is not set/);
    assert.equal(judge(503, { ok: false, message: "No county sales data" }).outcome, "failed");
    assert.equal(judge(502, null).headline, "failed with HTTP 502");
  });
});

describe("problemsToReport", () => {
  it("reports a failed run at once", () => {
    assert.deepEqual(problemsToReport({ outcome: "failed", problems: ["http-500"], headline: "" }, null), ["http-500"]);
  });
  it("reports a partial failure once it shows on two runs in a row", () => {
    const v = { outcome: "partial" as const, problems: ["source:a", "source:b"], headline: "" };
    assert.deepEqual(problemsToReport(v, null), []);
    assert.deepEqual(problemsToReport(v, ["source:b"]), ["source:b"]);
  });
  it("reports nothing for a good or held run", () => {
    assert.deepEqual(problemsToReport({ outcome: "ok", problems: [], headline: "ok" }, ["source:a"]), []);
    assert.deepEqual(problemsToReport({ outcome: "held", problems: [], headline: "" }, null), []);
  });
});

describe("compactSummary", () => {
  it("keeps the small fields and cuts long lists", () => {
    const s = compactSummary({ deleted: 3, html: "<p>…</p>", note: "x".repeat(400), sources: Array.from({ length: 25 }, (_, i) => ({ id: `s${i}`, ok: true, nested: { a: 1 } })) });
    assert.equal(s?.deleted, 3);
    assert.equal(s?.html, undefined);
    assert.equal((s?.note as string).length, 300);
    assert.equal((s?.sources as unknown[]).length, 20);
    assert.deepEqual((s?.sources as unknown[])[0], { id: "s0", ok: true });
    assert.equal(s?.sourcesCount, 25);
  });
  it("is null for anything but an object", () => {
    assert.equal(compactSummary(null), null);
    assert.equal(compactSummary([1, 2]), null);
  });
});

describe("standing", () => {
  const job = { slug: "encore-check", maxGapHours: 26 };
  const now = new Date("2026-11-02T12:00:00Z");
  it("is the last outcome while the job keeps to its schedule", () => {
    assert.equal(standing(job, { outcome: "ok", startedAt: new Date("2026-11-02T07:41:00Z") }, now, null).state, "ok");
    assert.equal(standing(job, { outcome: "partial", startedAt: new Date("2026-11-02T07:41:00Z") }, now, null).state, "partial");
  });
  it("is stale once the gap is longer than the schedule allows", () => {
    const s = standing(job, { outcome: "ok", startedAt: new Date("2026-10-31T07:41:00Z") }, now, null);
    assert.equal(s.state, "stale");
    assert.equal(s.hoursSince, 52.3);
  });
  it("waits for a first run, then calls a job that never ran", () => {
    assert.equal(standing(job, null, now, new Date("2026-11-02T00:00:00Z")).state, "waiting");
    assert.equal(standing(job, null, now, new Date("2026-10-30T00:00:00Z")).state, "never");
    assert.equal(standing(job, null, now, null).state, "waiting");
  });
});

describe("describeSchedule", () => {
  it("says when a job runs in words", () => {
    assert.equal(describeSchedule("41 7 * * *"), "every day at 07:41 UTC");
    assert.equal(describeSchedule("0 10 * * 1"), "Mondays at 10:00 UTC");
    assert.equal(describeSchedule("0 13 3 * *"), "on the 3rd of each month at 13:00 UTC");
    assert.equal(describeSchedule("0 12 1 * *"), "on the 1st of each month at 12:00 UTC");
    assert.equal(describeSchedule("0 9 * * 1-5"), 'on the schedule "0 9 * * 1-5"');
  });
});

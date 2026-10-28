import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { roomStrings } from "./copy";
import { EMPTY_CONTENT, GUIDE_STEPS, dayLabel, noteParagraphs, parseStep, planQuery, readContent, stepKey, stepTitle, tokenShape, updatedLabel } from "./model";
import { contentFrom, createSchema, saveSchema } from "./validate";

const TODAY = "2026-10-28";

/** The step titles as the guide pages list them, in order. */
function pageTitles(file: string): string[] {
  const src = readFileSync(new URL(`../../app/(site)/${file}/page.tsx`, import.meta.url), "utf8");
  const steps = /const STEPS: GuideStep\[\] = \[([\s\S]*?)\n\];/.exec(src)?.[1] ?? "";
  return [...steps.matchAll(/^\s+title: "([^"]+)",$/gm)].map((m) => m[1]!);
}

describe("client rooms", () => {
  it("lists the guide steps exactly as the buy and sell pages do", () => {
    assert.deepEqual([...GUIDE_STEPS.buy], pageTitles("buy"));
    assert.deepEqual([...GUIDE_STEPS.sell], pageTitles("sell"));
  });

  it("reads a step back and refuses one the guide doesn't have", () => {
    assert.deepEqual(parseStep("buy:4"), { guide: "buy", n: 4 });
    assert.equal(stepTitle(parseStep("buy:4")), "Choose your agent");
    assert.equal(parseStep("sell:9"), null);
    assert.equal(parseStep("buy:0"), null);
    assert.equal(parseStep("rent:1"), null);
    assert.equal(parseStep(""), null);
    assert.equal(stepKey({ guide: "sell", n: 2 }), "sell:2");
  });

  it("turns a pasted Atlas Move link into the plan's own query, and nothing else", () => {
    const q = planQuery("https://jjpremiergroup.com/relocate?in=2027-02-15&path=buying&sell=no&from=NY&work=remote&county=manatee&fin=financed&off=3", "move", TODAY);
    assert.ok(q);
    assert.match(q, /^in=2027-02-15&path=buying/);
    assert.ok(!q.includes("?"));
    // A path, a bare query and the query alone all read the same.
    assert.equal(planQuery("/relocate?in=2027-02-15&path=buying&county=manatee", "move", TODAY), planQuery("in=2027-02-15&path=buying&county=manatee", "move", TODAY));
    // Keys the planner doesn't define never survive.
    const extra = planQuery("/relocate?in=2027-02-15&path=buying&email=someone%40example.com", "move", TODAY)!;
    assert.ok(!extra.includes("email"));
    // Another page, or nothing a plan reads, is refused.
    assert.equal(planQuery("https://jjpremiergroup.com/calendar/plan?from=2026-11-06", "move", TODAY), null);
    // Only the query is kept, so a link from a preview deployment reads the same as one from the live site.
    assert.equal(planQuery("https://preview.example.com/relocate?in=2027-02-15", "move", TODAY), planQuery("/relocate?in=2027-02-15", "move", TODAY));
    assert.equal(planQuery("/relocate", "move", TODAY), null);
    assert.equal(planQuery("", "move", TODAY), null);
    assert.equal(planQuery("not a link", "move", TODAY), null);
  });

  it("turns a pasted Encore Planner link into the visit's own query", () => {
    const q = planQuery("https://jjpremiergroup.com/calendar/plan?from=2026-11-06&to=2026-11-08&market=sarasota&cat=music&evenings=1", "visit", TODAY);
    assert.equal(q, "from=2026-11-06&to=2026-11-08&market=sarasota&cat=music&evenings=1");
    assert.equal(planQuery("/relocate?in=2027-02-15", "visit", TODAY), null);
    assert.equal(planQuery("/calendar/plan", "visit", TODAY), null);
  });

  it("reads stored content tolerantly", () => {
    assert.deepEqual(readContent(null), EMPTY_CONTENT);
    assert.deepEqual(readContent({ places: ["the-lake-club", "the-lake-club", "Bad Slug!"], step: "buy:3", notes: 7 }), {
      ...EMPTY_CONTENT,
      places: ["the-lake-club"],
      step: { guide: "buy", n: 3 },
    });
    assert.deepEqual(readContent({ step: { guide: "sell", n: 2 }, movePlan: "in=2027-02-15", visitPlan: "?from=x" }), {
      ...EMPTY_CONTENT,
      step: { guide: "sell", n: 2 },
      movePlan: "in=2027-02-15",
      visitPlan: null,
    });
  });

  it("holds a save to its shape and reports a bad plan link rather than dropping it", () => {
    const base = { token: "t".repeat(24), id: "6f1e1a2b-3c4d-4e5f-8a9b-0c1d2e3f4a5b", name: "  Sam   Lee ", kind: "both", step: "buy:2", places: "the-lake-club, waterside,,bad slug", movePlan: "", visitPlan: "", notes: "Hello\r\n\r\nThere" };
    const parsed = saveSchema.parse(base);
    assert.equal(parsed.name, "Sam Lee");
    const { content, problems } = contentFrom(parsed, TODAY);
    assert.deepEqual(problems, []);
    assert.deepEqual(content.places, ["the-lake-club", "waterside"]);
    assert.equal(content.notes, "Hello\n\nThere");
    const bad = contentFrom(saveSchema.parse({ ...base, movePlan: "https://example.com/elsewhere", visitPlan: "/calendar/plan?from=2026-11-06" }), TODAY);
    assert.deepEqual(bad.problems, ["move"]);
    assert.equal(bad.content.visitPlan, "from=2026-11-06&to=2026-11-06");
    assert.equal(saveSchema.safeParse({ ...base, id: "nope" }).success, false);
    assert.equal(saveSchema.safeParse({ ...base, kind: "renting" }).success, false);
    assert.equal(createSchema.safeParse({ token: "t", name: "   ", kind: "buying" }).success, false);
    assert.equal(createSchema.safeParse({ token: "t", name: "x".repeat(61), kind: "buying" }).success, false);
  });

  it("keeps tokens to their shape", () => {
    assert.equal(tokenShape("AbCdEfGhIjKlMnOpQrStUvWx"), true);
    assert.equal(tokenShape("short"), false);
    assert.equal(tokenShape("has space here and more"), false);
    assert.equal(tokenShape(null), false);
  });

  it("writes notes as paragraphs and dates in words", () => {
    assert.deepEqual(noteParagraphs("One\nstill one\n\n\nTwo \n"), ["One\nstill one", "Two"]);
    assert.equal(dayLabel("2027-02-15"), "Feb 15, 2027");
    const now = new Date("2026-10-28T15:00:00Z");
    assert.equal(updatedLabel("2026-10-28T09:00:00Z", now), "today");
    assert.equal(updatedLabel("2026-10-27T09:00:00Z", now), "yesterday");
    assert.equal(updatedLabel("2026-10-25T09:00:00Z", now), "3 days ago");
    assert.equal(updatedLabel("2026-09-01T09:00:00Z", now), "Sep 1, 2026");
  });

  it("says nothing Fair Housing forbids", () => {
    for (const { where, text } of roomStrings()) {
      const r = checkFairHousing(text);
      assert.equal(r.passed, true, `${where}: ${JSON.stringify(r)}`);
    }
  });
});

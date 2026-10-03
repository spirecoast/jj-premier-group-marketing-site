import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { aiTells } from "../voice";
import { FOOTER_COPY, TIDE_COPY } from "./copy";
import { FOOTER, FOOTER_NO_STREET, LICENSE, MANIFEST_COMPLETE, MANIFEST_SHORT, SITE, SUPERLATIVES, sale, salesFixture } from "./fixtures";
import { narrativeOf } from "../tide/notes";
import { ZIP_MARKET, zipMarketsFromAtlas } from "./tide-markets";
import {
  addMonths,
  buildTideIssue,
  isNewBuildOrVacant,
  marketOf,
  marketParagraph,
  monthBounds,
  previousMonth,
  tideStats,
  tideTeamSubject,
  titleCase,
  topStreets,
} from "./tide-monthly";

const flat = (s: string) => s.replace(/\s+/g, " ");

describe("months", () => {
  it("is the calendar month before today", () => {
    assert.equal(previousMonth("2026-10-01"), "2026-09");
    assert.equal(previousMonth("2026-01-31"), "2025-12");
    assert.deepEqual(monthBounds("2026-02"), { from: "2026-02-01", to: "2026-02-28" });
    assert.equal(addMonths("2026-01", -18), "2024-07");
  });
});

describe("the ZIP to market map", () => {
  it("matches the Atlas dataset under its stated rule", () => {
    const file = path.join(process.cwd(), "neighborhood-data", "data", "neighborhoods.search.json");
    const atlas = JSON.parse(readFileSync(file, "utf8")) as { market: string; zips?: string[] }[];
    assert.deepEqual(zipMarketsFromAtlas(atlas), { ...ZIP_MARKET });
  });
  it("puts a Lakewood Ranch postal city in Lakewood Ranch whatever the ZIP", () => {
    assert.equal(marketOf({ zip: "34240", city: "LAKEWOOD RANCH" }), "lakewood-ranch");
    assert.equal(marketOf({ zip: "34240", city: "SARASOTA" }), "sarasota");
    assert.equal(marketOf({ zip: "34211", city: "BRADENTON" }), "lakewood-ranch");
    assert.equal(marketOf({ zip: "34293", city: "VENICE" }), null);
  });
});

describe("tideStats", () => {
  const [lwr, srq, bra] = tideStats(salesFixture(), "2026-08");

  it("computes every Lakewood Ranch figure from the rows", () => {
    assert.equal(lwr!.count, 5); // the commercial parcel, the unqualified transfer and Venice are out
    // Over the homes only: 500k, 600k and 800k; the vacant parcel and the 03 sale stay in the count, out of the median.
    assert.equal(lwr!.medianPrice, 600_000);
    assert.equal(lwr!.priceSample, 3);
    // 500k/2000, 600k/2400 and 800k/2000; the vacant parcel and the 03 sale stay out.
    assert.equal(lwr!.medianPpsf, 250);
    assert.equal(lwr!.ppsfSample, 3);
    assert.equal(lwr!.newBuild, 3); // vacant, built in the sale year, roll changed (03)
    assert.equal(lwr!.newBuildPct, 60);
    assert.deepEqual(lwr!.streets, [
      { label: "Gander Ter", count: 2 },
      { label: "Lilac Sky Ter", count: 2 },
    ]);
    assert.equal(lwr!.typical, 4);
    assert.equal(lwr!.complete, true);
  });
  it("marks a market short of its typical month as incomplete", () => {
    assert.equal(srq!.count, 1);
    assert.equal(srq!.complete, false);
    assert.equal(bra!.count, 0);
    assert.equal(bra!.typical, 4);
    assert.equal(bra!.complete, false);
  });
  it("writes the paragraph from the figures and nothing else", () => {
    assert.equal(
      marketParagraph(lwr!, "2026-08"),
      "Lakewood Ranch had 5 home sales in August 2026. Counting only homes the county lists as built, the median price was $600,000, from 3 sales. The median price per square foot was $250, from the 3 homes with a size on record. 60% of the sales were new builds, or lots the county still lists as empty. The busiest streets were Gander Ter (2) and Lilac Sky Ter (2).",
    );
    assert.ok(marketParagraph(srq!, "2026-08").startsWith("The county has posted 1 home sale in Sarasota for August 2026 so far"));
    assert.ok(marketParagraph(bra!, "2026-08").startsWith("The county hasn’t posted any home sales in Bradenton"));
  });
});

describe("helpers", () => {
  it("title-cases county street names", () => {
    assert.equal(titleCase("74TH AVE E"), "74th Ave E");
    assert.equal(titleCase("GULF OF MEXICO DR"), "Gulf of Mexico Dr");
    assert.equal(titleCase("N TAMIAMI TRL"), "N Tamiami Trl");
  });
  it("lists only streets with two or more sales, ties alphabetical", () => {
    const rows = [sale({ street: "B" }), sale({ street: "B" }), sale({ street: "A" }), sale({ street: "A" }), sale({ street: "C" }), sale({ street: "D" }), sale({ street: "D" }), sale({ street: "D" }), sale({ street: "E" }), sale({ street: "E" })];
    assert.deepEqual(
      topStreets(rows).map((s) => s.label),
      ["D St", "A St", "B St"],
    );
  });
  it("drops a postal city that is a market's name, and keeps one that isn't", () => {
    const rows = [
      // One street, two postal spellings, both in Lakewood Ranch's ZIPs: counted together, no misleading city.
      sale({ street: "LORRAINE", suffix: "RD", city: "BRADENTON", zip: "34211" }),
      sale({ street: "LORRAINE", suffix: "RD", city: "LAKEWOOD RANCH", zip: "34202" }),
      sale({ street: "VIOLET JASPER", suffix: "DR", city: "PARRISH", zip: "34219" }),
      sale({ street: "VIOLET JASPER", suffix: "DR", city: "PARRISH", zip: "34219" }),
    ];
    assert.deepEqual(topStreets(rows), [
      { label: "Lorraine Rd", count: 2 },
      { label: "Violet Jasper Dr, Parrish", count: 2 },
    ]);
  });
  it("calls a sale a new build when the roll says vacant, built that year or changed", () => {
    assert.equal(isNewBuildOrVacant(sale({ propertyUse: "vacant" })), true);
    assert.equal(isNewBuildOrVacant(sale({ yearBuilt: 2026, saleDate: "2026-03-01" })), true);
    assert.equal(isNewBuildOrVacant(sale({ qualCode: "04" })), true);
    assert.equal(isNewBuildOrVacant(sale({ yearBuilt: 2025, saleDate: "2026-03-01" })), false);
  });
});

describe("buildTideIssue", () => {
  // August 2026 is short in Sarasota and Bradenton, so the default is July.
  const issue = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER });
  const coverage = "The county posts sales a few weeks late, so this issue looks back at July 2026. That’s the newest month that’s complete for all three places.";

  it("defaults to the latest month complete in all three markets, never a partial one", () => {
    assert.equal(issue.month, "2026-07");
    assert.equal(issue.latestComplete, "2026-07");
    assert.ok(issue.markets.every((m) => m.complete && m.count === 4));
    assert.equal(issue.subject, "Tide · July 2026");
    assert.equal(tideTeamSubject(issue), "Tide, July 2026: ready to send");
    assert.deepEqual(issue.period, { from: "2026-07-01", to: "2026-07-31", label: "July 2026" });
    assert.equal(issue.hold, undefined);
  });
  it("says at the top why it covers that month", () => {
    assert.ok(issue.html.includes(coverage));
    const text = flat(issue.text);
    assert.ok(text.includes(coverage));
    assert.ok(text.indexOf("Here’s how home sales went in July 2026") < text.indexOf(coverage));
    assert.ok(text.indexOf(coverage) < text.indexOf("Lakewood Ranch -"));
  });
  it("carries the source line with the manifest date", () => {
    assert.equal(issue.asOf, "September 15, 2026");
    assert.ok(flat(issue.text).includes("Source: County property appraisers, public record, qualified sales, as of September 15, 2026."));
    assert.equal(issue.through, null);
  });
  it("has a dashed box for the story and one for each signed note until they're written, and says it needs an edit", () => {
    assert.equal(issue.needsEdit, true);
    assert.equal(issue.placeholder, "Fill in or delete every dashed box before sending.");
    for (const box of [TIDE_COPY.storyPlaceholder, "Joelyn: a few sentences here in your own words", "Jessica: a few sentences here in your own words"]) {
      assert.ok(flat(issue.html).includes(box.replace(/[“”]/g, (q) => (q === "“" ? "&ldquo;" : "&rdquo;"))) || flat(issue.html).includes(box), box);
      assert.ok(flat(issue.text).includes(box), box);
    }
    assert.ok(!issue.text.includes(TIDE_COPY.buyersHeading));
  });
  it("carries the facts to write from until the story is written, and the story once it is", () => {
    const facts = ["Largest change against a typical month: home sales in Bradenton went up 12% to 793, from 706."];
    const notes = [
      { key: "joelyn" as const, name: "Joelyn Nauman", first: "Joelyn", paragraphs: null },
      { key: "jessica" as const, name: "Jessica Garza", first: "Jessica", paragraphs: null },
    ];
    const draft = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER, writing: { narrative: null, notes, facts } });
    assert.ok(flat(draft.text).includes("FACTS TO WRITE FROM"));
    assert.ok(flat(draft.text).includes(facts[0]!));
    assert.ok(draft.html.includes("Facts to write from"));

    const narrative = narrativeOf({ opening: ["Picture July in Bradenton."], buyers: ["Buy by the square foot."], sellers: ["Sell by the square foot."], watch: ["Watch August."] })!;
    const written = buildTideIssue({
      sales: salesFixture(),
      manifest: MANIFEST_COMPLETE,
      today: "2026-09-15",
      footer: FOOTER,
      writing: { narrative, notes: [{ ...notes[0]!, paragraphs: ["My words."] }, notes[1]!], facts },
    });
    const text = flat(written.text);
    assert.ok(!text.includes("FACTS TO WRITE FROM"), "the facts box goes once the story is written");
    assert.ok(!text.includes(TIDE_COPY.storyPlaceholder));
    assert.ok(!text.includes("Here’s how home sales went in July 2026"), "the opening replaces the plain intro");
    for (const s of ["Picture July in Bradenton.", "If you’re buying -", "Buy by the square foot.", "If you’re selling -", "Sell by the square foot.", TIDE_COPY.limits, "What to watch next month -", "- Watch August.", "From Joelyn and Jessica -", "My words. Joelyn Nauman"]) {
      assert.ok(text.includes(s), s);
    }
    assert.ok(text.indexOf("Sell by the square foot.") < text.indexOf("Lakewood Ranch -") && text.indexOf("Lakewood Ranch -") < text.indexOf("Watch August."));
    // Jessica's slot is still a box, so the draft still needs an edit; with both notes written it doesn't.
    assert.ok(text.includes("[Jessica: a few sentences here in your own words"));
    assert.equal(written.needsEdit, true);
    const done = buildTideIssue({
      sales: salesFixture(),
      manifest: MANIFEST_COMPLETE,
      today: "2026-09-15",
      footer: FOOTER,
      writing: { narrative, notes: notes.map((n) => ({ ...n, paragraphs: ["Words."] })), facts },
    });
    assert.equal(done.needsEdit, false);
    assert.equal(done.placeholder, undefined);
    assert.ok(!done.html.includes("dashed"));
  });
  it("carries the headline, dek, story, market paragraphs and moves, and the numbered moves", () => {
    const notes = [
      { key: "joelyn" as const, name: "Joelyn Nauman", first: "Joelyn", paragraphs: null },
      { key: "jessica" as const, name: "Jessica Garza", first: "Jessica", paragraphs: null },
    ];
    const narrative = narrativeOf({
      headline: "July was a busy month in Bradenton.",
      dek: "Sales ran ahead of a typical month.",
      opening: ["Picture July in Bradenton.", "A second paragraph."],
      markets: { sarasota: ["Sarasota had a steady month.", "Its second paragraph."] },
      marketMoves: { sarasota: "Price by the square foot." },
      buying: [
        { move: "Compare by the square foot.", why: "Two homes can share a median and differ by size.", link: { href: "/neighborhoods", label: "Look on Atlas" } },
        { move: "Look at last year too.", why: "July a year before tells you more than June." },
      ],
      selling: [{ move: "Start from the street.", why: "Buyers look at what sold nearby.", link: { href: "/sell/sold", label: "What sold on your street" } }],
      buyers: ["The old paragraph."],
    })!;
    const issue = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER, writing: { narrative, notes, facts: ["A fact."] } });
    const text = flat(issue.text);
    assert.ok(issue.html.includes("July was a busy month in Bradenton."), "the headline is the title");
    assert.equal(issue.preheader, "Sales ran ahead of a typical month.");
    for (const s of [
      "Sales ran ahead of a typical month.",
      "Picture July in Bradenton. A second paragraph.",
      "1. Compare by the square foot. Two homes can share a median and differ by size. Look on Atlas: https://jjpremiergroup.com/neighborhoods?utm_source=tide",
      "2. Look at last year too.",
      "1. Start from the street.",
      "Sarasota had a steady month. Its second paragraph.",
      "One move in Sarasota: Price by the square foot.",
    ]) {
      assert.ok(text.includes(s), s);
    }
    assert.ok(!text.includes("The old paragraph."), "the moves replace the first format's paragraph");
    assert.ok(!text.includes("FACTS TO WRITE FROM"));
    // Markets without written paragraphs keep the computed one.
    assert.ok(text.includes(marketParagraph(issue.markets[0]!, "2026-07")));
    assert.ok(!text.includes(marketParagraph(issue.markets[1]!, "2026-07")));
    assert.ok(issue.html.includes(`${SITE}/sell/sold?utm_source=tide`));
    assert.ok(!/\{\w+\}/.test(issue.html + issue.text));
  });
  it("links to /sell/sold, /relocate and the three hubs", () => {
    for (const p of ["/sell/sold", "/relocate", "/lakewood-ranch", "/sarasota", "/bradenton"]) assert.ok(issue.html.includes(`${SITE}${p}?utm_source=tide`), p);
  });
  it("names the median price as the homes' and says what isn't counted", () => {
    assert.ok(issue.html.includes("Median price"));
    // The baseline month: 300k, 310k, 320k and 330k in each market.
    assert.ok(flat(issue.text).includes("Median price: $315,000"));
    assert.ok(flat(issue.text).includes("sales elsewhere in the two counties, such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted."));
    // July has no sales outside the three markets in the fixture; August has one, in Venice.
    assert.deepEqual(issue.counties, { total: 12, outside: 0 });
    assert.ok(!issue.text.includes("aren’t counted here"));
    const aug = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", month: "2026-08", footer: FOOTER });
    assert.deepEqual(aug.counties, { total: 7, outside: 1 });
    assert.ok(
      flat(aug.text).includes(
        "Sales outside these three places’ ZIP codes, in places such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted here. That’s 1 of the 7 home sales the two counties recorded in August 2026.",
      ),
    );
  });
  it("builds a named partial month on request, says so, and holds it from the Zap", () => {
    const aug = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", month: "2026-08", footer: FOOTER });
    assert.equal(aug.month, "2026-08");
    assert.equal(aug.latestComplete, "2026-07");
    assert.ok(aug.warnings.some((w) => w.startsWith("Sarasota: 1 qualified home sale published")));
    assert.ok(aug.warnings.some((w) => w.includes("The latest month complete in all three markets is July 2026")));
    assert.ok(aug.html.includes(TIDE_COPY.figureSalesPartial));
    assert.ok(!aug.html.includes("so this issue covers"));
    assert.match(aug.hold ?? "", /August 2026 isn't complete/);
  });
  it("holds the previous month when no month is complete", () => {
    const thin = buildTideIssue({ sales: salesFixture().filter((s) => s.saleDate >= "2026-08-01"), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER });
    assert.equal(thin.latestComplete, null);
    assert.equal(thin.month, "2026-08");
    assert.ok(thin.hold);
    assert.ok(thin.warnings.some((w) => w.startsWith("None of the seven months up to August 2026")));
  });
  it("warns when the record runs further behind than usual or the data is stale", () => {
    // On November 15 the month before is October; September and October have no sales, August is short.
    const late = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-11-15", footer: FOOTER });
    assert.equal(late.month, "2026-07");
    assert.ok(late.warnings.some((w) => w.includes("further behind than usual") && w.includes("3 months before October 2026")));
    assert.ok(late.warnings.some((w) => w.startsWith("The sales data was last refreshed on September 15, 2026")));
    assert.ok(!issue.warnings.some((w) => w.includes("further behind") || w.includes("last refreshed")));
  });
  it("says when the county files stop before the month ends", () => {
    const short = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_SHORT, today: "2026-09-15", month: "2026-08", footer: FOOTER });
    assert.equal(short.through, "Aug 20 (Manatee) and Aug 22 (Sarasota)");
    assert.ok(flat(short.text).includes("The county files run through Aug 20 (Manatee) and Aug 22 (Sarasota)"));
  });
  it("is email HTML with the CAN-SPAM footer", () => {
    assert.ok(issue.html.includes('width="600"'));
    assert.ok(!/<(link|style|script)\b/i.test(issue.html));
    for (const [, href] of issue.html.matchAll(/\bhref="([^"]+)"/g)) assert.ok(href!.startsWith(`${SITE}/`), href);
    for (const body of [issue.html, flat(issue.text)]) {
      assert.ok(body.includes("Sent by Joelyn Nauman and Jessica Garza"));
      assert.ok(body.includes("100 Example Way, Suite 1, Lakewood Ranch, FL 34202"));
      assert.ok(body.includes(FOOTER_COPY.unsubscribe));
    }
    const noStreet = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", footer: FOOTER_NO_STREET });
    assert.ok(noStreet.warnings.some((w) => w.includes("CAN-SPAM")));
  });
  it("leaves no token unfilled, passes Fair Housing, has no superlatives or license numbers", () => {
    assert.ok(!/\{\w+\}/.test(issue.html + issue.text));
    assert.equal(checkFairHousing(issue.html).passed, true);
    assert.equal(checkFairHousing(issue.text).passed, true);
    assert.ok(!SUPERLATIVES.test(issue.text.replace(/JJ Premier Group/g, "")));
    assert.ok(!LICENSE.test(issue.html));
  });
  it("has none of the phrases that read as machine-written", () => {
    for (const para of issue.text.split(/\n\s*\n/).map((p) => flat(p).trim()).filter(Boolean)) {
      assert.deepEqual(aiTells(para.replace(/^\[|\]$/g, "")), [], para);
    }
  });
});

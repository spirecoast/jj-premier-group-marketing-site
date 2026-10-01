import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { FOOTER_COPY, TIDE_COPY } from "./copy";
import { FOOTER, FOOTER_NO_STREET, LICENSE, MANIFEST_COMPLETE, MANIFEST_SHORT, SITE, SUPERLATIVES, sale, salesFixture } from "./fixtures";
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
      "Lakewood Ranch had 5 qualified home sales in August 2026. Leaving out parcels vacant on the roll or changed since the sale, 3 homes are left, and their median price was $600,000. Across the 3 homes with a recorded living area, the median was $250 a square foot. 60% of the sales were new builds or parcels the roll still shows as vacant. The streets with the most sales were Gander Ter (2) and Lilac Sky Ter (2).",
    );
    assert.ok(marketParagraph(srq!, "2026-08").startsWith("The county has published 1 qualified home sale in Sarasota for August 2026 so far"));
    assert.ok(marketParagraph(bra!, "2026-08").startsWith("The county hasn’t published any qualified home sales in Bradenton"));
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
  const coverage = "The county property appraisers post a sale only after they’ve qualified it, so this issue covers July 2026, the latest month that’s complete for all three places.";

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
    assert.ok(text.indexOf(coverage) < text.indexOf("Here’s what the county records show"));
  });
  it("carries the source line with the manifest date", () => {
    assert.equal(issue.asOf, "September 15, 2026");
    assert.ok(flat(issue.text).includes("Source: County property appraisers, public record, qualified sales, as of September 15, 2026."));
    assert.equal(issue.through, null);
  });
  it("has the placeholder the agents fill in, and says it needs an edit", () => {
    assert.equal(issue.needsEdit, true);
    assert.equal(issue.placeholder, "Joelyn and Jessica add two paragraphs here before sending.");
    assert.ok(issue.html.includes(TIDE_COPY.placeholder));
    assert.ok(issue.text.includes(`[${TIDE_COPY.placeholder}]`));
  });
  it("links to /sell/sold, /relocate and the three hubs", () => {
    for (const p of ["/sell/sold", "/relocate", "/lakewood-ranch", "/sarasota", "/bradenton"]) assert.ok(issue.html.includes(`${SITE}${p}?utm_source=tide`), p);
  });
  it("names the median price as the homes' and says what isn't counted", () => {
    assert.ok(issue.html.includes("Median price, homes"));
    // The baseline month: 300k, 310k, 320k and 330k in each market.
    assert.ok(flat(issue.text).includes("Median price, homes: $315,000"));
    assert.ok(flat(issue.text).includes("sales elsewhere in the two counties, such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted."));
    // July has no sales outside the three markets in the fixture; August has one, in Venice.
    assert.deepEqual(issue.counties, { total: 12, outside: 0 });
    assert.ok(!issue.text.includes("aren’t counted here"));
    const aug = buildTideIssue({ sales: salesFixture(), manifest: MANIFEST_COMPLETE, today: "2026-09-15", month: "2026-08", footer: FOOTER });
    assert.deepEqual(aug.counties, { total: 7, outside: 1 });
    assert.ok(
      flat(aug.text).includes(
        "Sales outside these three markets’ ZIPs, in places such as Venice, Nokomis, Osprey, North Port, Englewood and Myakka City, aren’t counted here: 1 of the 7 qualified home sales the two counties recorded in August 2026.",
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
});

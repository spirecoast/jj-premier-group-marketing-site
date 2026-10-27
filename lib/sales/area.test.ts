import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cityZipTable, cityZips, matchPlace, normalizeCity, placeBySlug, placeZips, streetOptions, type PlaceRow } from "./area";
import { groupSummary, inSizeBand, isResale, sizeBand, summarize } from "./stats";
import { monthsSpanning, priceAxis, priceLabel, timelineGeometry } from "./timeline";
import type { Sale } from "./types";

/** A row in the shape the ingest writes. No names: the record has no field for one. */
function sale(over: Partial<Sale>): Sale {
  return {
    county: "manatee",
    parcelId: "P",
    number: "14447",
    predir: "",
    street: "LILAC SKY",
    suffix: "TER",
    postdir: "",
    unit: "",
    city: "BRADENTON",
    zip: "34211",
    saleDate: "2026-06-02",
    salePrice: 275_000,
    qualified: true,
    qualCode: "01",
    instrument: "WD",
    livingArea: null,
    lotSqft: 6_000,
    yearBuilt: null,
    beds: null,
    baths: null,
    propertyUse: "vacant",
    ...over,
  };
}

describe("a typed city resolves to the ZIPs the county files it in", () => {
  // 34211: mostly LAKEWOOD RANCH, plenty of BRADENTON. 34202 the same. 34209 is Bradenton only, with one stray label.
  const rows: Pick<Sale, "city" | "zip">[] = [
    ...Array.from({ length: 60 }, () => ({ city: "LAKEWOOD RANCH", zip: "34211" })),
    ...Array.from({ length: 40 }, () => ({ city: "BRADENTON", zip: "34211" })),
    ...Array.from({ length: 30 }, () => ({ city: "LAKEWOOD RANCH", zip: "34202" })),
    ...Array.from({ length: 10 }, () => ({ city: "BRADENTON", zip: "34202" })),
    ...Array.from({ length: 100 }, () => ({ city: "BRADENTON", zip: "34209" })),
    { city: "LAKEWOOD RANCH", zip: "34209" },
    ...Array.from({ length: 50 }, () => ({ city: "SARASOTA", zip: "34243" })),
    { city: "", zip: "34243" },
    { city: "SARASOTA", zip: "3424" },
  ];
  const table = cityZipTable(rows);
  it("folds case, spaces and a trailing state", () => {
    assert.equal(normalizeCity(" lakewood  ranch, FL "), "LAKEWOOD RANCH");
    assert.equal(normalizeCity("Sarasota, Florida"), "SARASOTA");
    assert.equal(normalizeCity("Bradenton."), "BRADENTON");
  });
  it("lists every ZIP a city labels a real share of, and keeps a stray label out", () => {
    assert.deepEqual(cityZips(table, "Lakewood Ranch"), ["34202", "34211"]);
    assert.deepEqual(cityZips(table, "bradenton"), ["34202", "34209", "34211"]);
    assert.deepEqual(cityZips(table, "Sarasota, FL"), ["34243"]);
    assert.equal(cityZips(table, "Venice"), null);
    assert.equal(cityZips(table, ""), null);
  });
  it("counts a small share when it is many rows", () => {
    const big = cityZipTable([...Array.from({ length: 2000 }, () => ({ city: "A", zip: "11111" })), ...Array.from({ length: 30 }, () => ({ city: "B", zip: "11111" }))]);
    assert.deepEqual(cityZips(big, "B"), ["11111"]);
    const few = cityZipTable([...Array.from({ length: 2000 }, () => ({ city: "A", zip: "11111" })), ...Array.from({ length: 3 }, () => ({ city: "B", zip: "11111" }))]);
    assert.equal(cityZips(few, "B"), null);
  });
});

describe("a typed place name finds its Atlas entry and its ZIPs", () => {
  const atlas: PlaceRow[] = [
    { slug: "the-lake-club", name: "The Lake Club", aliases: ["Lake Club"], parentSlug: null, zips: [], level: "area", market: "lakewood-ranch" },
    { slug: "lake-club-west", name: "Lake Club West", aliases: [], parentSlug: "the-lake-club", zips: ["34202"], level: "community", market: "lakewood-ranch" },
    { slug: "siesta-key", name: "Siesta Key", aliases: [], parentSlug: null, zips: ["34242"], level: "area", market: "sarasota" },
    { slug: "siesta-isles", name: "Siesta Isles", aliases: [], parentSlug: "siesta-key", zips: ["34242", "34231"], level: "community", market: "sarasota" },
    { slug: "parrish", name: "Parrish", aliases: [], parentSlug: null, zips: [], level: "area", market: "bradenton" },
    { slug: "lakewood-ranch-enclave", name: "Lakewood Ranch", aliases: [], parentSlug: null, zips: ["34202"], level: "enclave", market: "lakewood-ranch" },
    { slug: "lakewood-ranch-area", name: "Lakewood Ranch", aliases: [], parentSlug: null, zips: [], level: "area", market: "lakewood-ranch" },
    { slug: "loop", name: "Loop A", aliases: [], parentSlug: "loop-b", zips: ["00001"], level: "community", market: "bradenton" },
    { slug: "loop-b", name: "Loop B", aliases: [], parentSlug: "loop", zips: ["00002"], level: "community", market: "bradenton" },
  ];
  it("gathers an area's ZIPs from its descendants", () => {
    assert.deepEqual(placeZips(atlas, "the-lake-club"), ["34202"]);
    assert.deepEqual(placeZips(atlas, "siesta-key"), ["34231", "34242"]);
    assert.deepEqual(placeZips(atlas, "parrish"), []);
    assert.deepEqual(placeZips(atlas, "loop"), ["00001", "00002"], "a cycle in the data ends");
  });
  it("matches the name or an alias whole, case and punctuation aside, and never a fragment", () => {
    assert.deepEqual(matchPlace(atlas, "the lake club"), { slug: "the-lake-club", name: "The Lake Club", market: "lakewood-ranch", zips: ["34202"] });
    assert.equal(matchPlace(atlas, "LAKE CLUB")?.slug, "the-lake-club");
    assert.equal(matchPlace(atlas, "Siesta Key.")?.slug, "siesta-key");
    assert.equal(matchPlace(atlas, "lake"), null);
    assert.equal(matchPlace(atlas, "Lilac Sky Ter"), null);
    assert.equal(matchPlace(atlas, "34211"), null);
  });
  it("skips a place that reaches no ZIP, and prefers the larger of two places with one name that has ZIPs", () => {
    assert.equal(matchPlace(atlas, "Parrish"), null);
    // The area carries no ZIPs of its own and no children: the enclave with the same name answers.
    assert.equal(matchPlace(atlas, "Lakewood Ranch")?.slug, "lakewood-ranch-enclave");
    assert.equal(placeBySlug(atlas, "parrish"), null);
    assert.equal(placeBySlug(atlas, "nowhere"), null);
    assert.deepEqual(placeBySlug(atlas, "siesta-key")?.zips, ["34231", "34242"]);
  });
});

describe("an ambiguous street offers each spelling and ZIP", () => {
  it("lists street-and-ZIP pairs, most sales first", () => {
    const rows = [
      sale({ street: "MAIN", suffix: "ST", zip: "34221" }),
      sale({ street: "MAIN", suffix: "ST", zip: "34221" }),
      sale({ street: "MAIN", suffix: "ST", zip: "34236" }),
      sale({ predir: "N", street: "TAMIAMI", suffix: "TRL", zip: "34236" }),
      sale({ predir: "N", street: "TAMIAMI", suffix: "TRL", zip: "34236" }),
      sale({ predir: "N", street: "TAMIAMI", suffix: "TRL", zip: "34236" }),
      sale({ predir: "S", street: "TAMIAMI", suffix: "TRL", zip: "34239" }),
    ];
    assert.deepEqual(streetOptions(rows), [
      { street: "N TAMIAMI TRL", zip: "34236", count: 3 },
      { street: "MAIN ST", zip: "34221", count: 2 },
      { street: "MAIN ST", zip: "34236", count: 1 },
      { street: "S TAMIAMI TRL", zip: "34239", count: 1 },
    ]);
  });
});

describe("the medians a seller sees", () => {
  const street: Sale[] = [
    // Three resales: $410K, $425K, $295K; two with a size, one roll-changed.
    sale({ propertyUse: "single-family", salePrice: 410_000, livingArea: 1_872, yearBuilt: 2024, saleDate: "2026-07-30" }),
    sale({ propertyUse: "single-family", salePrice: 425_000, livingArea: 2_214, yearBuilt: 2024, saleDate: "2026-07-09" }),
    sale({ propertyUse: "townhome", salePrice: 295_000, livingArea: 1_414, yearBuilt: 2027, saleDate: "2026-05-29" }),
    // Four lots and new builds at $260K to $280K.
    sale({ salePrice: 260_000 }),
    sale({ salePrice: 270_000 }),
    sale({ salePrice: 275_000 }),
    sale({ salePrice: 280_000 }),
  ];
  it("keeps the resale median apart from the lot median, and the overall one for a street with no resales", () => {
    const s = summarize(street);
    assert.equal(s.count, 7);
    assert.equal(s.homes, 3);
    assert.equal(s.lots, 4);
    assert.equal(s.medianResalePrice, 410_000);
    assert.equal(s.medianNewerPrice, 272_500);
    assert.equal(s.medianPrice, 280_000);
    assert.equal(s.medianPricePerSqft, Math.round((410_000 / 1_872 + 425_000 / 2_214) / 2));
    assert.equal(s.sqftSampleSize, 2, "the roll-changed townhome stays out of the $/sqft");
    const lotsOnly = summarize(street.filter((r) => !isResale(r)));
    assert.equal(lotsOnly.medianResalePrice, null);
    assert.equal(lotsOnly.medianNewerPrice, 272_500);
  });
  it("summarises one group the same way", () => {
    const g = groupSummary(street.filter(isResale));
    assert.deepEqual(g, { count: 3, medianPrice: 410_000, medianPricePerSqft: Math.round((410_000 / 1_872 + 425_000 / 2_214) / 2), sqftSampleSize: 2 });
    assert.deepEqual(groupSummary([]), { count: 0, medianPrice: null, medianPricePerSqft: null, sqftSampleSize: 0 });
  });
  it("draws the band around a house's size, rounded to the hundred", () => {
    assert.deepEqual(sizeBand(1_872), { from: 1_600, to: 2_200 });
    assert.deepEqual(sizeBand(2_214), { from: 1_900, to: 2_500 });
    assert.deepEqual(sizeBand(150), { from: 100, to: 500 });
    const band = sizeBand(1_872);
    assert.deepEqual(
      street.filter((r) => inSizeBand(r, band)).map((r) => r.salePrice),
      [410_000],
      "2,214 sq ft is past the band's top; a lot has no size",
    );
  });
});

describe("the timeline's geometry", () => {
  it("spans the window month by month and labels prices short", () => {
    assert.deepEqual(monthsSpanning("2024-10-25", "2025-02-03"), ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02"]);
    assert.equal(priceLabel(250_000), "$250K");
    assert.equal(priceLabel(1_500_000), "$1.5M");
    assert.equal(priceLabel(2_000_000), "$2M");
    assert.equal(priceLabel(950), "$950");
  });
  it("puts about three round gridlines over the prices, never below zero", () => {
    const a = priceAxis([260_000, 275_000, 410_000, 425_000]);
    assert.ok(a.yMin <= 260_000 && a.yMax >= 425_000);
    assert.ok(a.ticks.length >= 2 && a.ticks.length <= 5, String(a.ticks));
    assert.equal(a.ticks[0], a.yMin);
    assert.ok(a.yMin >= 0);
    assert.deepEqual(priceAxis([]), { yMin: 0, yMax: 1, ticks: [0, 1] });
    const one = priceAxis([300_000]);
    assert.ok(one.yMin < 300_000 && one.yMax > 300_000);
  });
  it("places every sale by date and price, newest at the right, resales told from lots, with the median as a rule", () => {
    const points = [
      { saleDate: "2024-10-25", salePrice: 260_000, resale: false },
      { saleDate: "2025-10-25", salePrice: 410_000, resale: true },
      { saleDate: "2026-10-20", salePrice: 300_000, resale: true },
    ];
    const g = timelineGeometry(points, { from: "2024-10-25", to: "2026-10-20" }, { value: 355_000, label: "Median of 2 resales $355,000" }, "wide");
    assert.equal(g.width, 1248);
    assert.equal(g.height, 416);
    assert.equal(g.marks.length, 3);
    assert.equal(g.marks[0]!.x, g.plot.x0);
    assert.equal(g.marks[2]!.x, g.plot.x1);
    assert.ok(g.marks[0]!.x < g.marks[1]!.x && g.marks[1]!.x < g.marks[2]!.x);
    assert.ok(g.marks[1]!.y < g.marks[2]!.y && g.marks[2]!.y < g.marks[0]!.y, "a higher price sits higher");
    assert.deepEqual(g.marks.map((m) => m.resale), [false, true, true]);
    assert.ok(g.median && g.median.y > g.marks[1]!.y && g.median.y < g.marks[2]!.y);
    assert.equal(g.months.length, 25);
    assert.equal(g.months[g.months.length - 1]!.label, "Oct 26", "the newest month is always named");
    assert.equal(g.months.filter((m) => m.label).length, 9, "every third month on the wide drawing");
    assert.ok(g.yTicks.every((t) => t.y >= g.plot.y0 - 1 && t.y <= g.plot.y1 + 1));
    const n = timelineGeometry(points, { from: "2024-10-25", to: "2026-10-20" }, null, "narrow");
    assert.equal(n.width, 342);
    assert.equal(n.median, null);
    assert.equal(n.months.filter((m) => m.label).length, 5, "every sixth month on a phone");
    // A sale outside the window is clamped to its edge, never drawn off the plot.
    const off = timelineGeometry([{ saleDate: "2020-01-01", salePrice: 100, resale: true }], { from: "2024-10-25", to: "2026-10-20" }, null, "wide");
    assert.equal(off.marks[0]!.x, off.plot.x0);
  });
});

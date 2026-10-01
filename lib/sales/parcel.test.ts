import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOME_VALUE_COPY, homeValueStrings } from "../../components/home-value/copy";
import { checkFairHousing } from "../fair-housing";
import { matchParcel, parcelCount, parseHouseNumber, parseTypedUnit, stripTypedUnit } from "./parcel";
import { parseTypedStreet, streetKey } from "./street";
import type { Sale } from "./types";

/** A tiny street, in the shape the ingest writes. No names: the record has no field for one. */
function sale(over: Partial<Sale>): Sale {
  return {
    county: "manatee",
    parcelId: "0000000000",
    number: "9403",
    predir: "",
    street: "9TH",
    suffix: "AVE",
    postdir: "NW",
    unit: "",
    city: "BRADENTON",
    zip: "34209",
    saleDate: "2026-03-02",
    salePrice: 1_105_000,
    qualified: true,
    qualCode: "01",
    instrument: "WD",
    livingArea: 2604,
    lotSqft: 10_000,
    yearBuilt: 1985,
    beds: null,
    baths: null,
    propertyUse: "single-family",
    ...over,
  };
}

const FIXTURE: Sale[] = [
  sale({ parcelId: "A", saleDate: "2026-03-02", salePrice: 1_105_000 }),
  sale({ parcelId: "A", saleDate: "2024-11-15", salePrice: 850_000 }),
  // The same number on 9th Ave W (the other 9th Ave in the ZIP): a condo with units.
  sale({ parcelId: "B1", postdir: "W", unit: "101", propertyUse: "condo", saleDate: "2026-06-25", salePrice: 270_000, livingArea: 1803, yearBuilt: 1979 }),
  sale({ parcelId: "B2", postdir: "W", unit: "204", propertyUse: "condo", saleDate: "2025-01-10", salePrice: 255_000, livingArea: 1803, yearBuilt: 1979 }),
  // Same number and street, other ZIP.
  sale({ parcelId: "C", zip: "34205", saleDate: "2025-08-01", salePrice: 400_000 }),
  // A neighbour, never a match for 9403.
  sale({ parcelId: "D", number: "9315", saleDate: "2026-02-13", salePrice: 1_325_000 }),
  // An unqualified transfer on the parcel stays out.
  sale({ parcelId: "A", saleDate: "2025-06-01", salePrice: 100, qualified: false, qualCode: "11" }),
  // A whole-name street that ends in a suffix word.
  sale({ parcelId: "E", number: "5100", street: "MIDNIGHT PASS", suffix: "RD", postdir: "", zip: "34242", city: "SARASOTA", county: "sarasota", saleDate: "2025-04-04", salePrice: 2_000_000 }),
];

describe("parseHouseNumber", () => {
  it("splits a leading number from the street", () => {
    assert.deepEqual(parseHouseNumber("9403 9th Ave NW"), { number: "9403", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("  6810 9th Ave W #204 "), { number: "6810", street: "9th Ave W #204" });
    assert.deepEqual(parseHouseNumber("123A Main St"), { number: "123", street: "Main St" });
  });
  it("treats an ordinal as a street, not a number", () => {
    assert.deepEqual(parseHouseNumber("9th Ave NW"), { number: "", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("1st Street"), { number: "", street: "1st Street" });
  });
  it("a lone number has no street; no number comes back empty", () => {
    assert.deepEqual(parseHouseNumber("9403"), { number: "9403", street: "" });
    assert.deepEqual(parseHouseNumber("Lilac Sky Dr"), { number: "", street: "Lilac Sky Dr" });
    assert.deepEqual(parseHouseNumber(""), { number: "", street: "" });
  });
  it("cuts a pasted full address at the comma and drops a trailing state or ZIP", () => {
    assert.deepEqual(parseHouseNumber("9403 9th Ave NW, Bradenton, FL 34209"), { number: "9403", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("9403 9th Ave NW FL 34209"), { number: "9403", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("9403 9th Ave NW 34209-1234"), { number: "9403", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("9403 9th Ave NW, Florida"), { number: "9403", street: "9th Ave NW" });
    assert.deepEqual(parseHouseNumber("6810 9th Ave W #204, Bradenton FL"), { number: "6810", street: "9th Ave W #204" });
    // A street that ends in a number is not a ZIP: five digits only.
    assert.deepEqual(parseHouseNumber("100 Highway 301"), { number: "100", street: "Highway 301" });
  });
  it("does not take more than eight digits as a number", () => {
    assert.deepEqual(parseHouseNumber("123456789 Main St"), { number: "", street: "123456789 Main St" });
  });
});

describe("parseTypedUnit", () => {
  it("reads #, unit, apt and suite", () => {
    assert.equal(parseTypedUnit("9th Ave W #204"), "204");
    assert.equal(parseTypedUnit("9th Ave W Unit 204"), "204");
    assert.equal(parseTypedUnit("9th Ave W apt b"), "B");
    assert.equal(parseTypedUnit("9th Ave W"), "");
    assert.equal(stripTypedUnit("9th Ave W #204"), "9th Ave W");
  });
});

describe("street parsing still folds the way the street search expects", () => {
  it("keys", () => {
    assert.equal(streetKey("9403 9th Ave NW"), "9");
    assert.equal(streetKey("Midnight Pass Road"), "midnightpass");
    assert.equal(streetKey("Midnight Pass", { stripSuffix: false }), "midnightpass");
  });
  it("typed parts", () => {
    assert.deepEqual(parseTypedStreet("9403 9th Avenue NW"), { predir: "", suffix: "AVE", postdir: "NW" });
  });
});

describe("matchParcel", () => {
  it("finds the parcel's qualified sales, newest first, and nothing else", () => {
    const rows = matchParcel(FIXTURE, { number: "9403", street: "9th Ave NW", zip: "34209" });
    assert.deepEqual(
      rows.map((r) => [r.parcelId, r.saleDate, r.salePrice]),
      [
        ["A", "2026-03-02", 1_105_000],
        ["A", "2024-11-15", 850_000],
      ],
    );
    assert.equal(parcelCount(rows), 1);
  });
  it("needs the exact number", () => {
    assert.equal(matchParcel(FIXTURE, { number: "9404", street: "9th Ave NW", zip: "34209" }).length, 0);
    assert.equal(matchParcel(FIXTURE, { number: "940", street: "9th Ave NW", zip: "34209" }).length, 0);
  });
  it("needs the ZIP, and the right one", () => {
    assert.equal(matchParcel(FIXTURE, { number: "9403", street: "9th Ave NW", zip: "" }).length, 0);
    assert.equal(matchParcel(FIXTURE, { number: "9403", street: "9th Ave NW", zip: "34205" }).length, 1);
    assert.equal(matchParcel(FIXTURE, { number: "9403", street: "9th Ave NW", zip: "34205" })[0].parcelId, "C");
  });
  it("a typed directional picks between streets that share a name; without one every match comes back", () => {
    const w = matchParcel(FIXTURE, { number: "9403", street: "9th Avenue W", zip: "34209" });
    assert.deepEqual(w.map((r) => r.parcelId), ["B1", "B2"]);
    assert.equal(parcelCount(w), 2);
    const any = matchParcel(FIXTURE, { number: "9403", street: "9th Ave", zip: "34209" });
    assert.equal(any.length, 4);
    assert.equal(parcelCount(any), 3);
    assert.equal(any[0].saleDate, "2026-06-25");
  });
  it("a typed unit picks the unit", () => {
    const u = matchParcel(FIXTURE, { number: "9403", street: "9th Ave W #204", zip: "34209" });
    assert.deepEqual(u.map((r) => r.parcelId), ["B2"]);
    assert.deepEqual(matchParcel(FIXTURE, { number: "9403", street: "9th Ave W Unit 101", zip: "34209" }).map((r) => r.parcelId), ["B1"]);
  });
  it("a typed unit that is not on the roll matches nothing, not every unit", () => {
    assert.deepEqual(matchParcel(FIXTURE, { number: "9403", street: "9th Ave W #305", zip: "34209" }), []);
  });
  it("a typed unit still finds the number when the roll carries no unit there at all", () => {
    // The house at 9403 9th Ave NW has no unit on the roll; "#1" is the seller's, not the county's.
    assert.deepEqual(matchParcel(FIXTURE, { number: "9403", street: "9th Ave NW #1", zip: "34209" }).map((r) => r.parcelId), ["A", "A"]);
  });
  it("matches a whole-name street with or without its suffix", () => {
    assert.equal(matchParcel(FIXTURE, { number: "5100", street: "Midnight Pass", zip: "34242" }).length, 1);
    assert.equal(matchParcel(FIXTURE, { number: "5100", street: "Midnight Pass Rd", zip: "34242" }).length, 1);
    assert.equal(matchParcel(FIXTURE, { number: "5100", street: "Midnight Pass Rd", zip: "34209" }).length, 0);
  });
  it("rejects bad numbers and short streets", () => {
    assert.equal(matchParcel(FIXTURE, { number: "", street: "9th Ave NW", zip: "34209" }).length, 0);
    assert.equal(matchParcel(FIXTURE, { number: "123456789", street: "9th Ave NW", zip: "34209" }).length, 0);
    assert.equal(matchParcel(FIXTURE, { number: "9403", street: "9", zip: "34209" }).length, 0);
  });
});

describe("home value copy", () => {
  it("every string passes the Fair Housing check", () => {
    const strings = homeValueStrings();
    assert.ok(strings.length > 20);
    for (const s of strings) {
      const r = checkFairHousing(s);
      assert.ok(r.passed, `${s}\n${JSON.stringify(r)}`);
    }
  });
  it("carries no figure, estimate or licence number of its own", () => {
    for (const s of homeValueStrings()) {
      assert.doesNotMatch(s, /\$\s?\d/, s);
      assert.doesNotMatch(s, /\d{1,3}(,\d{3})+/, s);
      assert.doesNotMatch(s, /\b(SL|BK)\s?\d{5,}\b/i, s);
      assert.doesNotMatch(s, /\bestimat(e|ed|es)\b/i, s);
    }
  });
  it("names both appraisers in the source line", () => {
    assert.match(HOME_VALUE_COPY.sourceDefault, /Manatee County Property Appraiser/);
    assert.match(HOME_VALUE_COPY.sourceDefault, /Sarasota County Property Appraiser/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PlaceRow } from "./area";
import { assignPlace, joinPlaces, normPlaceName, placeNameIndex, placeSales, plainSubdivision, subdivisionNames } from "./places";
import { milesBetween, monthsBefore, similarSales } from "./similar";
import type { Sale } from "./types";

const place = (slug: string, name: string, over: Partial<PlaceRow> = {}): PlaceRow => ({ slug, name, aliases: [], parentSlug: null, zips: ["34211"], level: "community", market: "lakewood-ranch", ...over });

let n = 0;
const sale = (over: Partial<Sale> = {}): Sale => ({
  county: "manatee",
  parcelId: `P${++n}`,
  number: String(100 + n),
  predir: "",
  street: "LILAC SKY",
  suffix: "TER",
  postdir: "",
  unit: "",
  city: "BRADENTON",
  zip: "34211",
  saleDate: "2026-08-01",
  salePrice: 500_000,
  qualified: true,
  qualCode: "01",
  instrument: "WD",
  livingArea: 2000,
  lotSqft: 6000,
  yearBuilt: 2018,
  beds: null,
  baths: null,
  propertyUse: "single-family",
  subdivision: "",
  nbhd: "",
  ...over,
});

const PLACES = [
  place("the-lake-club", "The Lake Club", { aliases: ["Lake Club"] }),
  place("arbor-lakes", "Arbor Lakes", { zips: ["34238"] }),
  place("arbor-lakes-on-palmer-ranch", "Arbor Lakes on Palmer Ranch", { zips: ["34238"] }),
  place("country-meadows", "Country Meadows", { zips: ["34203"] }),
  place("country-meadows-sarasota", "Country Meadows", { zips: ["34233"] }),
  place("twin-meadows", "Country Meadows", { zips: ["34203"] }),
  place("lakewood-ranch", "Lakewood Ranch", { level: "area", zips: ["34202", "34211"] }),
  place("aurora", "Aurora", { level: "area" }),
  place("lake-club-enclave", "Lake Club Golf Estates", { parentSlug: "the-lake-club" }),
];

describe("joining county subdivisions to Atlas places", () => {
  it("folds case, punctuation and a leading 'the'", () => {
    assert.equal(normPlaceName("The Lake Club"), "lake club");
    assert.equal(normPlaceName("LAKE CLUB PH I"), "lake club ph i");
    assert.equal(normPlaceName("Saint Andrew’s & Co."), "saint andrews and co");
  });

  it("takes the longest name, guards on ZIP and leaves ties and areas alone", () => {
    const idx = placeNameIndex(PLACES, new Set(["lakewood ranch", "bradenton"]));
    assert.equal(assignPlace("LAKE CLUB PH I", ["34211"], idx), "the-lake-club");
    assert.equal(assignPlace("LAKE CLUB GOLF ESTATES", ["34211"], idx), "lake-club-enclave");
    assert.equal(assignPlace("ARBOR LAKES ON PALMER RANCH SEC 2", ["34238"], idx), "arbor-lakes-on-palmer-ranch");
    assert.equal(assignPlace("ARBOR LAKES", ["34238"], idx), "arbor-lakes");
    // The right name in the wrong ZIP is not the place.
    assert.equal(assignPlace("ARBOR LAKES", ["34211"], idx), null);
    // Two places by one name in one ZIP: nobody gets it.
    assert.equal(assignPlace("COUNTRY MEADOWS", ["34203"], idx), null);
    assert.equal(assignPlace("COUNTRY MEADOWS", ["34233"], idx), "country-meadows-sarasota");
    // A postal city is read by its ZIPs, never by a plat name; other areas take their plats.
    assert.equal(assignPlace("LAKEWOOD RANCH COUNTRY CLUB VILLAGE", ["34202"], idx), null);
    assert.equal(assignPlace("AURORA", ["34211"], idx), "aurora");
    // A word has to match whole: "LAKE CLUBHOUSE" is not The Lake Club.
    assert.equal(assignPlace("LAKE CLUBHOUSE ESTATES", ["34211"], idx), null);
  });

  it("assigns by subdivision, then by appraiser neighborhood, and rolls enclaves up into their parent once", () => {
    const rows = [
      sale({ subdivision: "LAKE CLUB PH I", saleDate: "2026-01-02" }),
      sale({ subdivision: "LAKE CLUB GOLF ESTATES", saleDate: "2026-03-02" }),
      sale({ subdivision: "SOMEWHERE ELSE", nbhd: "LAKE CLUB", saleDate: "2026-02-02" }),
      sale({ subdivision: "SOMEWHERE ELSE" }),
    ];
    const join = joinPlaces(rows, PLACES);
    assert.equal(join.bySlug.get("the-lake-club")?.length, 2);
    assert.equal(join.bySlug.get("lake-club-enclave")?.length, 1);
    const all = placeSales(join, "the-lake-club");
    assert.deepEqual(
      all.map((r) => r.saleDate),
      ["2026-03-02", "2026-02-02", "2026-01-02"],
    );
    assert.equal(placeSales(join, "lake-club-enclave").length, 1);
    assert.equal(placeSales(join, "nowhere").length, 0);
  });

  it("names a subdivision plainly, without its phase", () => {
    assert.equal(plainSubdivision("AZARIO ESPLANADE PH VI SUBPH A & B"), "Azario Esplanade");
    assert.equal(plainSubdivision("THE WATCH AT WATERLEFE PH II"), "The Watch at Waterlefe");
    assert.equal(plainSubdivision("BAYSHORE GARDENS SEC NO 14"), "Bayshore Gardens");
    assert.equal(plainSubdivision("AURORA"), "Aurora");
    assert.equal(plainSubdivision("ANCIENT OAKS UNIT ONE"), "Ancient Oaks");
    assert.deepEqual(subdivisionNames([{ subdivision: "AURORA" }, { subdivision: "AZARIO ESPLANADE PH II" }, { subdivision: "AZARIO ESPLANADE PH IX" }, { subdivision: "" }]), [
      { name: "Azario Esplanade", count: 2 },
      { name: "Aurora", count: 1 },
    ]);
  });
});

describe("similar sales near a house", () => {
  const house = sale({ parcelId: "HOUSE", lat: 27.45, lng: -82.4, livingArea: 2000, subdivision: "AURORA", saleDate: "2025-05-01" });

  it("measures miles and counts months back", () => {
    assert.ok(Math.abs(milesBetween({ lat: 27.45, lng: -82.4 }, { lat: 27.4645, lng: -82.4 }) - 1.0) < 0.01);
    assert.equal(monthsBefore("2026-10-20", 12), "2025-10-20");
  });

  it("reads distance first, widening only until three are found", () => {
    const near = [0.002, 0.004, 0.006].map((d, i) => sale({ lat: 27.45 + d, lng: -82.4, saleDate: `2026-0${i + 1}-15` }));
    const far = sale({ lat: 27.48, lng: -82.4, saleDate: "2026-09-01" });
    const res = similarSales(house, [house, ...near, far], "2026-10-20");
    assert.deepEqual(res?.basis, { kind: "distance", miles: 0.5 });
    assert.equal(res?.rows.length, 3);
    assert.ok(res!.rows.every((r) => r.parcelId !== "HOUSE"));
    assert.ok(res!.rows[0]!.miles! < res!.rows[1]!.miles!);
    assert.equal(res?.summary.count, 3);
  });

  it("keeps only the same kind of home, within 20% of its size, in the last twelve months, with the roll's facts as paid for", () => {
    const ok = sale({ lat: 27.451, lng: -82.4, livingArea: 2300 });
    const rows = [
      ok,
      sale({ lat: 27.451, lng: -82.4, livingArea: 2500 }), // too big
      sale({ lat: 27.451, lng: -82.4, propertyUse: "condo" }),
      sale({ lat: 27.451, lng: -82.4, saleDate: "2025-09-01" }), // too old
      sale({ lat: 27.451, lng: -82.4, qualCode: "03" }), // roll changed
      sale({ lat: 27.451, lng: -82.4, county: "sarasota" }),
    ];
    const res = similarSales(house, rows, "2026-10-20");
    // Only one in range by distance, so it falls back to the subdivision, then the ZIP.
    assert.deepEqual(res?.basis, { kind: "zip", zip: "34211" });
    assert.deepEqual(
      res?.rows.map((r) => r.parcelId),
      [ok.parcelId],
    );
  });

  it("falls back to the subdivision without coordinates, and says nothing for a lot or an unrecorded size", () => {
    const flat = { ...house, lat: undefined, lng: undefined };
    const rows = [1, 2, 3].map(() => sale({ subdivision: "AURORA" }));
    assert.deepEqual(similarSales(flat, [...rows, sale({ subdivision: "STAR FARMS" })], "2026-10-20")?.basis, { kind: "subdivision", name: "AURORA" });
    assert.equal(similarSales({ ...house, livingArea: null }, rows, "2026-10-20"), null);
    assert.equal(similarSales({ ...house, propertyUse: "vacant" }, rows, "2026-10-20"), null);
    assert.equal(similarSales(house, [], "2026-10-20"), null);
  });
});

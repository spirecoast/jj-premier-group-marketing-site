import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { EMPTY_FORM, isEmptyForm, parseSheetForm, sheetFormQuery, sheetPath, startSheetPath, toNum, type SheetForm } from "./net-proceeds-url";

const FULL: SheetForm = {
  ...EMPTY_FORM,
  price: "650,000",
  county: "manatee",
  closingDate: "2026-12-15",
  title: "seller",
  mortgage: "$312,400",
  second: "",
  listingPct: "2.5",
  buyerPct: "2.5",
  annualTax: "7,840",
  hasAssociation: true,
  dues: "1,200",
  duesPeriod: "quarter",
  estoppel: "299",
  settlement: "595",
  recording: "18.5",
  recordingTouched: true,
  repairs: "",
  staging: "1,500",
  other: "",
  taxPaid: true,
  foreignSeller: true,
};

describe("the sheet as a link", () => {
  test("a full form round-trips through the query, numbers without their commas", () => {
    const q = sheetFormQuery(FULL);
    assert.equal(
      q,
      "price=650000&county=manatee&close=2026-12-15&title=seller&mortgage=312400&list=2.5&buyer=2.5&tax=7840&paid=1&hoa=1&dues=1200&per=quarter&estoppel=299&settle=595&rec=18.5&staging=1500&firpta=1",
    );
    const back = parseSheetForm(new URLSearchParams(q));
    assert.deepEqual(back, { ...FULL, price: "650000", mortgage: "312400", annualTax: "7840", dues: "1200", staging: "1500" });
  });
  test("an empty form is an empty query and the bare path", () => {
    assert.equal(sheetFormQuery(EMPTY_FORM), "");
    assert.equal(sheetPath(EMPTY_FORM), "/sell/net-proceeds");
    assert.ok(isEmptyForm(EMPTY_FORM));
    assert.ok(!isEmptyForm({ ...EMPTY_FORM, county: "sarasota" }));
    assert.equal(sheetPath({ ...EMPTY_FORM, price: "650000" }), "/sell/net-proceeds?price=650000");
  });
  test("a query with none of the keys is nothing to this tool", () => {
    assert.equal(parseSheetForm(new URLSearchParams("utm_source=newsletter")), null);
    assert.equal(parseSheetForm(new URLSearchParams("")), null);
  });
  test("a mangled link opens a usable sheet: junk is dropped, the choices fall back", () => {
    const f = parseSheetForm(new URLSearchParams("price=abc&county=dade&close=2026-02-30&title=nobody&per=weekly&list=x&mortgage=1e400"));
    assert.ok(f);
    assert.equal(f.price, "");
    assert.equal(f.county, "");
    assert.equal(f.closingDate, "");
    assert.equal(f.title, "custom");
    assert.equal(f.duesPeriod, "year");
    assert.equal(f.listingPct, "");
    assert.equal(f.mortgage, "");
  });
  test("the association lines only travel with the association box, and the estoppel keeps its default otherwise", () => {
    const f = parseSheetForm(new URLSearchParams("price=500000&dues=900&estoppel=418"));
    assert.ok(f);
    assert.equal(f.hasAssociation, false);
    assert.equal(f.estoppel, EMPTY_FORM.estoppel);
    assert.equal(f.dues, "900");
    assert.equal(sheetFormQuery({ ...EMPTY_FORM, price: "500000", dues: "900", estoppel: "418" }), "price=500000");
    assert.equal(sheetFormQuery({ ...EMPTY_FORM, price: "500000", hasAssociation: true }), "price=500000&hoa=1&estoppel=299");
  });
  test("a recording figure only travels once it was typed over the default", () => {
    assert.equal(sheetFormQuery({ ...EMPTY_FORM, price: "1", recording: "18.5" }), "price=1");
    assert.equal(sheetFormQuery({ ...EMPTY_FORM, price: "1", recording: "18.5", recordingTouched: true }), "price=1&rec=18.5");
    const f = parseSheetForm(new URLSearchParams("rec=27"));
    assert.equal(f?.recording, "27");
    assert.equal(f?.recordingTouched, true);
  });
  test("zero and a blank are the same as not entered", () => {
    assert.equal(sheetFormQuery({ ...EMPTY_FORM, price: "0", mortgage: "  " }), "");
  });
  test("a hand-off carries the sale's price and county", () => {
    assert.equal(startSheetPath(649_900.4, "manatee"), "/sell/net-proceeds?price=649900&county=manatee");
    assert.equal(startSheetPath(500_000, null), "/sell/net-proceeds?price=500000");
    assert.equal(startSheetPath(Number.NaN, "sarasota"), "/sell/net-proceeds?county=sarasota");
  });
  test("numbers as people type them", () => {
    assert.equal(toNum("$650,000.50"), 650_000.5);
    assert.equal(toNum(" 2.5 "), 2.5);
    assert.equal(toNum(""), undefined);
    assert.equal(toNum("abc"), undefined);
  });
});

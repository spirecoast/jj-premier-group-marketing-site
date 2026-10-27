import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeValueHref, searchIntent, tideStreetHref, titleStreet } from "./intent";

describe("a street or an address typed into search", () => {
  it("reads a street with a suffix, with or without a directional, a house number, a ZIP or a pasted city", () => {
    assert.deepEqual(searchIntent("Lilac Sky Dr"), { kind: "street", street: "Lilac Sky Dr", number: null, zip: null });
    assert.deepEqual(searchIntent("lilac sky terrace"), { kind: "street", street: "lilac sky terrace", number: null, zip: null });
    assert.deepEqual(searchIntent("14447 lilac sky ter 34211"), { kind: "street", street: "lilac sky ter", number: "14447", zip: "34211" });
    assert.deepEqual(searchIntent("9403 9th Ave NW, Bradenton, FL 34209"), { kind: "street", street: "9th Ave NW", number: "9403", zip: "34209" });
    assert.deepEqual(searchIntent("Gulf of Mexico Dr"), { kind: "street", street: "Gulf of Mexico Dr", number: null, zip: null });
    assert.deepEqual(searchIntent("N Tamiami Trl"), { kind: "street", street: "N Tamiami Trl", number: null, zip: null });
    assert.deepEqual(searchIntent("Main St 34221"), { kind: "street", street: "Main St", number: null, zip: "34221" });
  });
  it("titles a street for the card", () => {
    assert.equal(titleStreet("lilac sky ter"), "Lilac Sky Ter");
    assert.equal(titleStreet("9th ave nw"), "9th Ave NW");
    assert.equal(titleStreet("N TAMIAMI TRL"), "N Tamiami Trl");
  });
  it("reads a ZIP alone", () => {
    assert.deepEqual(searchIntent("34211"), { kind: "zip", zip: "34211" });
    assert.deepEqual(searchIntent("34211-1234"), { kind: "zip", zip: "34211" });
  });
  it("leaves a question, a topic, a place or a name alone", () => {
    for (const q of ["flood insurance", "Siesta Key", "The Lake Club", "CDD fees", "how do I sell from out of state?", "Lilac Sky", "Joelyn Nauman", "evacuation zone", "Lakewood Ranch", "main street station", "a b c d e f g St", ""]) {
      assert.equal(searchIntent(q), null, q);
    }
  });
  it("links to Tide Street with the street prefilled, and to Home Value for an address", () => {
    const street = searchIntent("Lilac Sky Dr")!;
    assert.equal(tideStreetHref(street), "/sell/sold?street=Lilac+Sky+Dr");
    const address = searchIntent("14447 lilac sky ter 34211")!;
    assert.equal(tideStreetHref(address), "/sell/sold?street=lilac+sky+ter&zip=34211");
    assert.equal(homeValueHref(address as Extract<typeof address, { kind: "street" }>), "/sell/home-value?address=14447+lilac+sky+ter&zip=34211");
    assert.equal(homeValueHref(street as Extract<typeof street, { kind: "street" }>), null);
    assert.equal(tideStreetHref({ kind: "zip", zip: "34211" }), "/sell/sold?zip=34211");
  });
});

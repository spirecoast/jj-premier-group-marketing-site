import assert from "node:assert/strict";
import { test } from "node:test";
import { listingCountLine, listingSearchHref, parseListingSearch } from "./listings-url";

test("the listings search reads the two keys the home page sends and ignores the rest", () => {
  assert.deepEqual(parseListingSearch(new URLSearchParams("market=sarasota&max=1000000")), { market: "sarasota", max: 1_000_000 });
  assert.deepEqual(parseListingSearch(new URLSearchParams("market=sarasota")), { market: "sarasota" });
  assert.deepEqual(parseListingSearch(new URLSearchParams("max=750000")), { max: 750_000 });
  // Anything that isn't a market or a price step says nothing.
  assert.equal(parseListingSearch(new URLSearchParams("market=tampa&max=12")), null);
  assert.equal(parseListingSearch(new URLSearchParams("")), null);
  assert.equal(parseListingSearch(new URLSearchParams("utm_source=youtube")), null);
});

test("a search prints back to the same address, and an empty one to /listings", () => {
  assert.equal(listingSearchHref({ market: "bradenton", max: 500_000 }), "/listings?market=bradenton&max=500000");
  assert.equal(listingSearchHref({}), "/listings");
  const round = parseListingSearch(new URLSearchParams(listingSearchHref({ market: "lakewood-ranch", max: 2_000_000 }).split("?")[1]));
  assert.deepEqual(round, { market: "lakewood-ranch", max: 2_000_000 });
});

test("the count line says what was asked", () => {
  assert.equal(listingCountLine(3, { market: "sarasota", max: 1_000_000 }), "3 homes in Sarasota up to $1M");
  assert.equal(listingCountLine(1, {}), "1 home");
  assert.equal(listingCountLine(0, { max: 500_000 }), "0 homes up to $500K");
});

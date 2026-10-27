import assert from "node:assert/strict";
import { test } from "node:test";
import { contactPrefill, listingsOpening, listingsPlaceholder, listingsPrefill } from "./lead-prefill";

const sp = (q: string) => new URLSearchParams(q);

test("contact: a place becomes the opening line, a message wins over it, a known market is kept", () => {
  assert.deepEqual(contactPrefill(sp("")), { message: undefined, market: undefined });
  assert.deepEqual(contactPrefill(sp("place=Waterside&market=lakewood-ranch")), { message: "Asking about Waterside.", market: "lakewood-ranch" });
  assert.deepEqual(contactPrefill(sp("place=Waterside&message=%20About%20the%20HOA%20")), { message: "About the HOA", market: undefined });
  assert.equal(contactPrefill(sp("market=tampa")).market, undefined);
  assert.equal(contactPrefill(sp(`message=${"x".repeat(1200)}`)).message?.length, 1000);
});

test("listings: the home page search becomes the note's opening", () => {
  const none = listingsPrefill(sp(""));
  assert.equal(none.message, undefined);
  assert.equal(none.placeholder, listingsPlaceholder(listingsOpening(undefined, undefined)));
  const both = listingsPrefill(sp("market=sarasota&max=1000000"));
  assert.equal(both.market, "sarasota");
  assert.match(both.message ?? "", /^Looking in Sarasota, up to \$1M\. $/);
  assert.equal(listingsPrefill(sp("max=-5")).message, undefined);
});

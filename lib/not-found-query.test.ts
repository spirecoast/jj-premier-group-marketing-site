import assert from "node:assert/strict";
import { test } from "node:test";
import { queryFromPath } from "./not-found-query";

test("the 404 page searches for the last segment that names a thing, as words", () => {
  assert.equal(queryFromPath("/neighborhoods/lake-club"), "lake club");
  assert.equal(queryFromPath("/calendar/the-nutcracker-2025/"), "the nutcracker 2025");
  assert.equal(queryFromPath("/guides/flood_zones.html"), "flood zones");
  assert.equal(queryFromPath("/venues/van%20wezel?utm_source=x#top"), "van wezel");
  // A section's own name is no query, and a bare number says nothing.
  assert.equal(queryFromPath("/neighborhoods/"), "");
  assert.equal(queryFromPath("/listings/12345"), "");
  assert.equal(queryFromPath("/"), "");
  assert.equal(queryFromPath("/index.html"), "");
  assert.equal(queryFromPath("/sell/waterside"), "waterside");
});

test("a very long segment is cut, and a broken escape is kept as typed", () => {
  assert.equal(queryFromPath(`/${"a".repeat(200)}`).length, 80);
  assert.equal(queryFromPath("/neighborhoods/%E0%A4%A"), "%E0%A4%A");
});

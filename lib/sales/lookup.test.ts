import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupFeedsAsk, lookupOutcome } from "./lookup";

test("a result settles and feeds the ask form", () => {
  assert.equal(lookupOutcome(200, { ok: true }), "done");
  assert.equal(lookupFeedsAsk(200, { ok: true }), true);
});

test("a 400 the page explains settles and feeds the ask form", () => {
  assert.equal(lookupOutcome(400, { ok: false, error: "zip-required" }), "done");
  assert.equal(lookupFeedsAsk(400, { ok: false, error: "street" }), true);
});

test("no records loaded (503) settles, but there's no address to ask about", () => {
  assert.equal(lookupOutcome(503, { ok: false, error: "no-data" }), "done");
  assert.equal(lookupFeedsAsk(503, { ok: false, error: "no-data" }), false);
});

test("anything else is an error", () => {
  assert.equal(lookupOutcome(500, { ok: false, error: "street" }), "error");
  assert.equal(lookupOutcome(502, "<html>Bad gateway</html>"), "error");
  assert.equal(lookupOutcome(200, null), "error");
  assert.equal(lookupFeedsAsk(500, { ok: false }), false);
});

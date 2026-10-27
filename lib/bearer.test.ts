import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bearerMatches } from "./bearer";

describe("bearerMatches", () => {
  it("accepts any of the configured secrets", () => {
    assert.equal(bearerMatches("Bearer s3cret", ["s3cret"]), true);
    assert.equal(bearerMatches("bearer s3cret", [undefined, "other", "s3cret"]), true);
  });
  it("refuses a wrong, partial or missing token", () => {
    assert.equal(bearerMatches("Bearer s3cre", ["s3cret"]), false);
    assert.equal(bearerMatches("Bearer s3cret2", ["s3cret"]), false);
    assert.equal(bearerMatches("s3cret", ["s3cret"]), false);
    assert.equal(bearerMatches("Bearer ", ["s3cret"]), false);
    assert.equal(bearerMatches(null, ["s3cret"]), false);
  });
  it("never matches when no secret is set", () => {
    assert.equal(bearerMatches("Bearer ", [undefined, ""]), false);
    assert.equal(bearerMatches("Bearer undefined", [undefined]), false);
    assert.equal(bearerMatches("Bearer x", []), false);
  });
});

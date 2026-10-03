import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coversFrame } from "./photo-fit";

describe("coversFrame", () => {
  it("crops a picture whose shape is near the box's", () => {
    assert.equal(coversFrame(3 / 2, 3 / 2), true);
    assert.equal(coversFrame(16 / 9, 3 / 2), true); // a wide still in a card
    assert.equal(coversFrame(4 / 3, 3 / 2), true);
    assert.equal(coversFrame(16 / 9, 21 / 9), true); // a wide still in the hero
    assert.equal(coversFrame(2.6, 21 / 9), true);
  });
  it("shows a picture whole when its shape is far from the box's", () => {
    assert.equal(coversFrame(2 / 3, 3 / 2), false); // a poster in a card
    assert.equal(coversFrame(1, 3 / 2), false); // a square in a card
    assert.equal(coversFrame(3, 3 / 2), false); // a season banner in a card
    assert.equal(coversFrame(1, 21 / 9), false); // a square in the hero
    assert.equal(coversFrame(2 / 3, 21 / 9), false); // a poster in the hero
    assert.equal(coversFrame(4, 21 / 9), false); // a very wide banner in the hero
  });
  it("crops when a dimension is unknown", () => {
    assert.equal(coversFrame(0, 3 / 2), true);
    assert.equal(coversFrame(NaN, 3 / 2), true);
  });
});

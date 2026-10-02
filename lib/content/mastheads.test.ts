import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { IMAGE_DIMS } from "./image-dims";
import { MASTHEADS, mastheadPhoto, mastheadSlot } from "./mastheads";

/** The masthead runs the viewport's width: a photograph narrower than this goes soft on a desktop. */
const MIN_WIDTH = 2000;

describe("the masthead slots", () => {
  test("every photo slot uses a registered source at least 2000px wide", () => {
    for (const [route, slot] of Object.entries(MASTHEADS)) {
      if (slot.kind !== "photo") continue;
      const dims = IMAGE_DIMS[`/images/${slot.photo}.jpg`];
      assert.ok(dims, `${route}: ${slot.photo} is not in lib/content/image-dims.ts`);
      assert.ok(dims.width >= MIN_WIDTH, `${route}: ${slot.photo} is ${dims.width}px wide, under ${MIN_WIDTH}`);
    }
  });
  test("a photo slot resolves to its image with the alt and the focal point", () => {
    const slot = mastheadSlot("/sell/net-proceeds");
    assert.equal(slot.kind, "photo");
    if (slot.kind !== "photo") return;
    const image = mastheadPhoto(slot);
    assert.equal(image.src, `/images/${slot.photo}.jpg`);
    assert.equal(image.alt, slot.alt);
    assert.equal(image.position, slot.position);
    assert.ok(image.width >= MIN_WIDTH);
  });
  test("Tide's three routes share one art slot", () => {
    const blog = mastheadSlot("/blog");
    assert.equal(blog.kind, "art");
    assert.equal(mastheadSlot("/tide"), blog);
    assert.equal(mastheadSlot("/tide/[issue]"), blog);
  });
  test("no two sibling sell pages open with the same photograph", () => {
    const sell = (["/sell/sold", "/sell/home-value", "/sell/net-proceeds"] as const).map((r) => MASTHEADS[r]).filter((s) => s.kind === "photo");
    assert.equal(new Set(sell.map((s) => s.photo)).size, sell.length);
  });
  test("alt text describes places and things, never people, and never uses 'lands'", () => {
    for (const [route, slot] of Object.entries(MASTHEADS)) {
      const r = checkFairHousing(slot.alt);
      assert.equal(r.passed, true, `${route}: ${JSON.stringify(r)}`);
      assert.doesNotMatch(slot.alt, /\blands\b/i, route);
      assert.doesNotMatch(slot.alt, /\b(famil(y|ies)|kids?|children|retire|seniors?|safe|crime|schools?)\b/i, route);
    }
  });
});

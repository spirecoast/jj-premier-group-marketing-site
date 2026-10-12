import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clampDescription, pageMetadata } from "./seo";

describe("search snippet lengths", () => {
  test("a description that fits is left alone", () => {
    assert.equal(clampDescription("Short and whole."), "Short and whole.");
  });

  test("a long description ends at its last whole sentence that fits", () => {
    const text = `${"One sentence that runs on for a while. ".repeat(3)}A last one that would not fit in the space left over at all.`;
    const out = clampDescription(text);
    assert.ok(out.length <= 158);
    assert.ok(out.endsWith("while."));
  });

  test("with no sentence break, it ends at a whole word with an ellipsis", () => {
    const out = clampDescription("word ".repeat(60).trim());
    assert.ok(out.length <= 159);
    assert.ok(out.endsWith("word…"));
  });

  test("a long title drops the team's name instead of being cut off", () => {
    const short = pageMetadata({ title: "Guides", description: "x", path: "/guides" });
    assert.equal(short.title, "Guides");
    const long = pageMetadata({ title: "A very long event title · At a venue with a long name", description: "x", path: "/calendar/x" });
    assert.deepEqual(long.title, { absolute: "A very long event title · At a venue with a long name" });
  });
});

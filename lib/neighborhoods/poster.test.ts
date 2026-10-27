import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POSTER_H, POSTER_W, posterMarks } from "./poster";

describe("the place poster", () => {
  it("centres a lone point", () => {
    const [m] = posterMarks([{ name: "A", lng: -82.5, lat: 27.4, kind: "self" }]);
    assert.equal(m!.x, POSTER_W / 2);
    assert.equal(m!.y, 190);
  });
  it("keeps every mark inside the safe area whatever the spread", () => {
    const pts = [
      { name: "Area", lng: -82.6, lat: 27.3, kind: "self" as const },
      { name: "N", lng: -82.4, lat: 27.5, kind: "child" as const },
      { name: "S", lng: -82.55, lat: 27.2, kind: "child" as const },
      { name: "Far", lng: -82.9, lat: 27.65, kind: "child" as const },
    ];
    for (const m of posterMarks(pts)) {
      assert.ok(m.x >= 160 && m.x <= 440, `x ${m.x}`);
      assert.ok(m.y >= 64 && m.y <= 316 && m.y <= POSTER_H, `y ${m.y}`);
    }
  });
  it("puts north up and east right", () => {
    const [a, b] = posterMarks([
      { name: "SW", lng: -82.6, lat: 27.3, kind: "self" },
      { name: "NE", lng: -82.4, lat: 27.5, kind: "child" },
    ]);
    assert.ok(b!.x > a!.x);
    assert.ok(b!.y < a!.y);
  });
  it("does not collapse points on one line", () => {
    const [a, b] = posterMarks([
      { name: "W", lng: -82.6, lat: 27.4, kind: "self" },
      { name: "E", lng: -82.4, lat: 27.4, kind: "child" },
    ]);
    assert.equal(a!.x, 160);
    assert.equal(b!.x, 440);
    assert.equal(a!.y, b!.y);
  });
});

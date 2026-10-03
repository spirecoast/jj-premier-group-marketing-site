import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMapUrl, decideMapError, describeMapError, isProviderFailure, mapErrorKey, onceByKey, redactUrl } from "./map-fallback";

const MT_TILEJSON = "https://api.maptiler.com/tiles/v3/tiles.json?key=secret";
const MT_TILE = "https://api.maptiler.com/tiles/v3/12/1120/1720.pbf?key=secret";
const MT_GLYPHS = "https://api.maptiler.com/fonts/Noto%20Sans%20Regular/0-255.pbf?key=secret";
const OFM_TILEJSON = "https://tiles.openfreemap.org/planet";
const OFM_TILE = "https://tiles.openfreemap.org/planet/20250101_001001_pt/12/1120/1720.pbf";
const OFM_GLYPHS = "https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf";

describe("classifying map requests", () => {
  it("tells the providers and the request kinds apart", () => {
    assert.deepEqual(classifyMapUrl(MT_TILEJSON), { provider: "maptiler", kind: "tilejson" });
    assert.deepEqual(classifyMapUrl(MT_TILE), { provider: "maptiler", kind: "tile" });
    assert.deepEqual(classifyMapUrl(MT_GLYPHS), { provider: "maptiler", kind: "glyphs" });
    assert.deepEqual(classifyMapUrl(OFM_TILEJSON), { provider: "openfreemap", kind: "tilejson" });
    assert.deepEqual(classifyMapUrl(OFM_TILE), { provider: "openfreemap", kind: "tile" });
    assert.deepEqual(classifyMapUrl(OFM_GLYPHS), { provider: "openfreemap", kind: "glyphs" });
  });

  it("leaves other hosts and junk alone", () => {
    assert.deepEqual(classifyMapUrl("https://example.com/tiles.json"), { provider: null, kind: "other" });
    assert.deepEqual(classifyMapUrl("not a url"), { provider: null, kind: "other" });
    assert.deepEqual(classifyMapUrl(undefined), { provider: null, kind: "other" });
  });
});

describe("deciding whether to fall back", () => {
  it("falls back from MapTiler on a refusal, on any request", () => {
    for (const status of [401, 403, 429]) {
      for (const url of [MT_TILEJSON, MT_TILE, MT_GLYPHS]) assert.equal(decideMapError({ status, url }, "maptiler"), "fallback", `${status} ${url}`);
    }
  });

  it("falls back from MapTiler when the TileJSON or glyphs can't be reached", () => {
    assert.equal(decideMapError({ status: 0, url: MT_TILEJSON }, "maptiler"), "fallback");
    assert.equal(decideMapError({ status: 0, url: MT_GLYPHS }, "maptiler"), "fallback");
    assert.equal(decideMapError({ status: 503, url: MT_TILEJSON }, "maptiler"), "fallback");
  });

  it("rides out a single dropped or missing tile", () => {
    assert.equal(decideMapError({ status: 0, url: MT_TILE }, "maptiler"), "ignore");
    assert.equal(decideMapError({ status: 404, url: MT_TILE }, "maptiler"), "ignore");
    assert.equal(decideMapError({ status: 500, url: MT_TILE }, "maptiler"), "ignore");
  });

  it("ignores errors without a status, and from other hosts", () => {
    assert.equal(decideMapError({ url: MT_TILEJSON, message: "boom" }, "maptiler"), "ignore");
    assert.equal(decideMapError({ message: "Style is not done loading" }, "maptiler"), "ignore");
    assert.equal(decideMapError({ status: 403, url: "https://example.com/a.pbf" }, "maptiler"), "ignore");
  });

  it("ignores stragglers from MapTiler once the map is on OpenFreeMap", () => {
    assert.equal(decideMapError({ status: 403, url: MT_TILE }, "openfreemap"), "ignore");
    assert.equal(decideMapError({ status: 403, url: MT_TILEJSON }, "openfreemap"), "ignore");
  });

  it("gives up only when OpenFreeMap can't serve its TileJSON", () => {
    assert.equal(decideMapError({ status: 0, url: OFM_TILEJSON }, "openfreemap"), "give-up");
    assert.equal(decideMapError({ status: 403, url: OFM_TILEJSON }, "openfreemap"), "give-up");
    assert.equal(decideMapError({ status: 0, url: OFM_GLYPHS }, "openfreemap"), "ignore");
    assert.equal(decideMapError({ status: 429, url: OFM_TILE }, "openfreemap"), "ignore");
  });

  it("treats only refusals and core-request failures as the provider failing", () => {
    assert.equal(isProviderFailure({ status: 403, url: MT_TILE }), true);
    assert.equal(isProviderFailure({ status: 0, url: MT_TILE }), false);
    assert.equal(isProviderFailure({ status: 404, url: MT_TILEJSON }), false);
  });
});

describe("logging map errors", () => {
  it("never logs the key", () => {
    assert.equal(redactUrl(MT_TILEJSON), "https://api.maptiler.com/tiles/v3/tiles.json?key=…");
    assert.equal(redactUrl("https://x.test/a?b=1&key=s3cret&c=2"), "https://x.test/a?b=1&key=…&c=2");
    assert.doesNotMatch(describeMapError({ status: 403, url: MT_TILE }), /secret/);
  });

  it("keys every tile of one failure the same, and different failures apart", () => {
    const a = mapErrorKey({ status: 403, url: MT_TILE });
    const b = mapErrorKey({ status: 403, url: MT_TILE.replace("1120", "1121") });
    assert.equal(a, b);
    assert.notEqual(a, mapErrorKey({ status: 429, url: MT_TILE }));
    assert.notEqual(a, mapErrorKey({ status: 403, url: MT_TILEJSON }));
    assert.equal(mapErrorKey({ message: "Tile 12/3/4 failed" }), mapErrorKey({ message: "Tile 13/5/6 failed" }));
  });

  it("writes each distinct key once", () => {
    const lines: string[] = [];
    const log = onceByKey((l) => lines.push(l));
    log("a", "first");
    log("a", "again");
    log("b", "second");
    assert.deepEqual(lines, ["first", "second"]);
  });
});

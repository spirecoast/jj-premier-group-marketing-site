import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMapStyle, providerEndpoints } from "./map-style";

const tilesUrl = (s: ReturnType<typeof buildMapStyle>) => (s.sources.openmaptiles as { url: string }).url;
const credit = (s: ReturnType<typeof buildMapStyle>) => (s.sources.openmaptiles as { attribution: string }).attribution;

describe("the Atlas base style", () => {
  it("draws from MapTiler when asked and there's a key", () => {
    const s = buildMapStyle("maptiler", "abc123");
    assert.equal(tilesUrl(s), "https://api.maptiler.com/tiles/v3/tiles.json?key=abc123");
    assert.equal(s.glyphs, "https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=abc123");
    assert.match(credit(s), /MapTiler/);
    assert.match(credit(s), /OpenStreetMap/);
  });

  it("can be forced onto OpenFreeMap even with a key", () => {
    const s = buildMapStyle("openfreemap", "abc123");
    assert.equal(tilesUrl(s), "https://tiles.openfreemap.org/planet");
    assert.equal(s.glyphs, "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf");
    assert.match(credit(s), /OpenFreeMap/);
    assert.doesNotMatch(credit(s), /MapTiler/);
    assert.doesNotMatch(JSON.stringify(s), /abc123/);
  });

  it("uses OpenFreeMap when MapTiler is asked for without a key", () => {
    assert.equal(providerEndpoints("maptiler", undefined).provider, "openfreemap");
    assert.equal(providerEndpoints("maptiler", "").provider, "openfreemap");
    assert.equal(tilesUrl(buildMapStyle("maptiler", undefined)), "https://tiles.openfreemap.org/planet");
  });

  it("keeps the same layers on both providers", () => {
    const a = buildMapStyle("maptiler", "k");
    const b = buildMapStyle("openfreemap");
    assert.deepEqual(a.layers, b.layers);
    assert.ok(a.layers.length > 10);
  });

  it("escapes the key in URLs", () => {
    assert.equal(providerEndpoints("maptiler", "a&b").tiles, "https://api.maptiler.com/tiles/v3/tiles.json?key=a%26b");
  });
});

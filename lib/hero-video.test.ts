import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PHONE_VIDEO_QUERY, savingData, videoWanted } from "./hero-video";
import { site } from "./site";

describe("savingData", () => {
  it("is on for Save-Data and for 2G connections", () => {
    assert.equal(savingData({ saveData: true, effectiveType: "4g" }), true);
    assert.equal(savingData({ effectiveType: "2g" }), true);
    assert.equal(savingData({ effectiveType: "slow-2g" }), true);
  });
  it("is off for faster connections and where the browser says nothing", () => {
    assert.equal(savingData({ saveData: false, effectiveType: "3g" }), false);
    assert.equal(savingData({ effectiveType: "4g" }), false);
    assert.equal(savingData({}), false);
    assert.equal(savingData(undefined), false);
    assert.equal(savingData(null), false);
  });
});

describe("videoWanted", () => {
  const base = { paused: false, reducedMotion: false, savingData: false, autoplayRefused: false, pressedPlay: false };
  it("starts by itself when nothing holds it back", () => {
    assert.equal(videoWanted(base), true);
  });
  it("waits for Play under reduced motion, data saving or a refused autoplay", () => {
    assert.equal(videoWanted({ ...base, reducedMotion: true }), false);
    assert.equal(videoWanted({ ...base, savingData: true }), false);
    assert.equal(videoWanted({ ...base, autoplayRefused: true }), false);
    assert.equal(videoWanted({ ...base, reducedMotion: true, pressedPlay: true }), true);
    assert.equal(videoWanted({ ...base, savingData: true, pressedPlay: true }), true);
    assert.equal(videoWanted({ ...base, autoplayRefused: true, pressedPlay: true }), true);
  });
  it("stays still once paused, whatever else is true", () => {
    assert.equal(videoWanted({ ...base, paused: true }), false);
    assert.equal(videoWanted({ ...base, paused: true, pressedPlay: true }), false);
  });
});

describe("PHONE_VIDEO_QUERY", () => {
  it("covers a narrow screen and a phone held sideways", () => {
    assert.match(PHONE_VIDEO_QUERY, /\(max-width: 39\.99rem\)/);
    assert.match(PHONE_VIDEO_QUERY, /\(max-height: 31\.25rem\)/);
  });
});

describe("site.homeHero", () => {
  it("is one of the two heroes the home page knows", () => {
    assert.ok(site.homeHero === "video" || site.homeHero === "photo");
  });
});

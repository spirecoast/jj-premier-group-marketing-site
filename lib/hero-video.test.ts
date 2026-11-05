import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heroCompareAllowed, PHONE_VIDEO_QUERY, requestedClip, savingData } from "./hero-video";

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

describe("heroCompareAllowed", () => {
  it("offers the clip switch on previews and local builds, never on production", () => {
    assert.equal(heroCompareAllowed({ VERCEL_ENV: "preview" }), true);
    assert.equal(heroCompareAllowed({ VERCEL_ENV: "development" }), true);
    assert.equal(heroCompareAllowed({}), true);
    assert.equal(heroCompareAllowed({ VERCEL_ENV: "production" }), false);
    assert.equal(heroCompareAllowed({ NEXT_PUBLIC_VERCEL_ENV: "production" }), false);
  });
});

describe("requestedClip", () => {
  const names = ["lake"];
  it("returns the clip the address names, when it's on offer", () => {
    assert.equal(requestedClip("?hero=lake", names), "lake");
    assert.equal(requestedClip("?utm_source=x&hero=lake", names), "lake");
  });
  it("ignores anything else", () => {
    assert.equal(requestedClip("", names), null);
    assert.equal(requestedClip("?hero=canal", names), null);
    assert.equal(requestedClip("?hero=LAKE", names), null);
    assert.equal(requestedClip("?hero=constructor", names), null);
    assert.equal(requestedClip("?hero=lake", []), null);
  });
});

describe("PHONE_VIDEO_QUERY", () => {
  it("covers a narrow screen and a phone held sideways", () => {
    assert.match(PHONE_VIDEO_QUERY, /\(max-width: 39\.99rem\)/);
    assert.match(PHONE_VIDEO_QUERY, /\(max-height: 31\.25rem\)/);
  });
});

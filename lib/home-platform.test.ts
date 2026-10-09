import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CrmLead } from "./crm";
import { doNotTrackOn, homePlatformNote, homePlatformPixelId, pixelWouldCapture } from "./home-platform";

describe("homePlatformPixelId", () => {
  it("loads the team's pixel in production only", () => {
    assert.equal(homePlatformPixelId({ VERCEL_ENV: "production" }), "bsw9jbac2nu2");
    assert.equal(homePlatformPixelId({ VERCEL_ENV: "preview" }), null);
    assert.equal(homePlatformPixelId({}), null);
  });
  it("takes an override, can be turned off, and can be forced on for a deliberate test", () => {
    assert.equal(homePlatformPixelId({ VERCEL_ENV: "production", NEXT_PUBLIC_HOME_PLATFORM_PIXEL_ID: "abc123def" }), "abc123def");
    assert.equal(homePlatformPixelId({ VERCEL_ENV: "production", NEXT_PUBLIC_HOME_PLATFORM_PIXEL_ID: "off" }), null);
    assert.equal(homePlatformPixelId({ HOME_PLATFORM_PIXEL_EVERYWHERE: "true" }), "bsw9jbac2nu2");
  });
  it("refuses an id that could break out of the attribute", () => {
    assert.equal(homePlatformPixelId({ VERCEL_ENV: "production", NEXT_PUBLIC_HOME_PLATFORM_PIXEL_ID: '"><script>' }), null);
  });
});

describe("pixelWouldCapture", () => {
  const on = { tag: true, gpc: undefined, dnt: null, webCrypto: true, cookie: "a=1; cxlp_anonymous_id=4f2c-91; b=2" };
  it("is true when the pixel is on the page, started, and nothing stops it", () => {
    assert.equal(pixelWouldCapture(on), true);
  });
  it("is false under Global Privacy Control, Do Not Track, without Web Crypto, without its tag or before it starts", () => {
    assert.equal(pixelWouldCapture({ ...on, gpc: true }), false);
    assert.equal(pixelWouldCapture({ ...on, dnt: "1" }), false);
    assert.equal(pixelWouldCapture({ ...on, webCrypto: false }), false);
    assert.equal(pixelWouldCapture({ ...on, tag: false }), false);
    assert.equal(pixelWouldCapture({ ...on, cookie: "a=1" }), false);
    assert.equal(pixelWouldCapture({ ...on, cookie: "my_cxlp_anonymous_id=x" }), false);
  });
  it("reads Do Not Track the way the pixel does", () => {
    for (const v of [true, 1, "1", "yes", "1 "]) assert.equal(doNotTrackOn(v), true, String(v));
    for (const v of [false, 0, "0", "no", "unspecified", null, undefined]) assert.equal(doNotTrackOn(v), false, String(v));
  });
});

describe("homePlatformNote", () => {
  const lead = { firstName: "Pat", lastName: "Example", referral: null, test: false, source: { homePlatformPixel: true } };
  const referral = { firstName: "Sam", lastName: "Moving" } as NonNullable<CrmLead["referral"]>;
  const live = { pixelOnSite: true, crmDelivered: false };

  it("says Home Platform should have the contact when the Pixel caught it, and asks for nothing", () => {
    const note = homePlatformNote(lead, live);
    assert.equal(note.addByHand, false);
    assert.match(note.line, /should already have this contact/);
    assert.match(note.line, /keeps only the name, email and phone/);
  });
  it("asks for the lead by hand when the Pixel didn't run", () => {
    const note = homePlatformNote({ ...lead, source: { homePlatformPixel: false } }, live);
    assert.equal(note.addByHand, true);
    assert.match(note.line, /^Not in Home Platform/);
  });
  it("names the person who's moving on a referral, whom the Pixel never sends", () => {
    const caught = homePlatformNote({ ...lead, referral }, live);
    assert.equal(caught.addByHand, true);
    assert.match(caught.line, /should have Pat Example .* but not Sam Moving/);
    const missed = homePlatformNote({ ...lead, referral, source: { homePlatformPixel: false } }, live);
    assert.equal(missed.addByHand, true);
    assert.match(missed.line, /Add Sam Moving, who's moving, and Pat Example, who referred them/);
  });
  it("doesn't trust the flag on a deployment without the Pixel", () => {
    const note = homePlatformNote(lead, { pixelOnSite: false, crmDelivered: false });
    assert.equal(note.addByHand, true);
    assert.match(note.line, /isn't on this deployment/);
  });
  it("leaves the rest to the webhook when it took the lead, and never asks about a test lead", () => {
    assert.deepEqual(homePlatformNote({ ...lead, source: { homePlatformPixel: false } }, { pixelOnSite: true, crmDelivered: true }), { line: "", addByHand: false });
    assert.equal(homePlatformNote(lead, { pixelOnSite: true, crmDelivered: true }).addByHand, false);
    assert.equal(homePlatformNote({ ...lead, test: true, source: { homePlatformPixel: false } }, live).addByHand, false);
  });
});

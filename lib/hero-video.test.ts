import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heroVideoFile, LANDSCAPE_QUERY, PHONE_VIDEO_QUERY, PORTRAIT_QUERY, savingData, videoWanted } from "./hero-video";
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

/**
 * Just enough of a media query evaluator for the hero's own queries: comma
 * lists, "and", a leading "not all and", rem widths and heights, and
 * orientation (portrait when the height is at least the width, as in CSS).
 */
function matches(query: string, screen: { width: number; height: number }): boolean {
  return query.split(",").some((part) => {
    let q = part.trim();
    const negate = q.startsWith("not ");
    if (negate) q = q.slice(4);
    const all = q.split(" and ").every((feature) => {
      if (feature === "all") return true;
      const size = /^\((max|min)-(width|height): ([\d.]+)rem\)$/.exec(feature);
      if (size) {
        const px = Number(size[3]) * 16;
        const v = size[2] === "width" ? screen.width : screen.height;
        return size[1] === "max" ? v <= px : v >= px;
      }
      const orientation = /^\(orientation: (portrait|landscape)\)$/.exec(feature);
      if (orientation) return (screen.height >= screen.width) === (orientation[1] === "portrait");
      throw new Error(`Unknown media feature: ${feature}`);
    });
    return negate ? !all : all;
  });
}

const clip = { desktop: "/video/1080.mp4", phone: "/video/720.mp4", portrait: "/video/portrait.mp4" };
const fileFor = (width: number, height: number) =>
  heroVideoFile(clip, { portrait: matches(PORTRAIT_QUERY, { width, height }), phone: matches(PHONE_VIDEO_QUERY, { width, height }) });

describe("heroVideoFile", () => {
  it("plays the portrait cut on a narrow screen held upright", () => {
    assert.equal(fileFor(360, 780), clip.portrait);
    assert.equal(fileFor(390, 844), clip.portrait);
    assert.equal(fileFor(430, 932), clip.portrait);
    assert.equal(fileFor(639, 900), clip.portrait);
    assert.equal(fileFor(320, 480), clip.portrait); // narrow and short, but upright
  });
  it("plays the 720 file on other small screens: narrow but wider than tall, or short", () => {
    assert.equal(fileFor(600, 400), clip.phone);
    assert.equal(fileFor(844, 390), clip.phone); // a phone held sideways
    assert.equal(fileFor(932, 430), clip.phone);
    assert.equal(fileFor(1280, 500), clip.phone);
  });
  it("plays the 1080 file everywhere else", () => {
    assert.equal(fileFor(640, 900), clip.desktop);
    assert.equal(fileFor(768, 1024), clip.desktop);
    assert.equal(fileFor(1024, 768), clip.desktop);
    assert.equal(fileFor(1440, 900), clip.desktop);
    assert.equal(fileFor(1920, 1080), clip.desktop);
  });
});

describe("the stills' queries", () => {
  const screens = [
    [360, 780], [390, 844], [430, 932], [639, 900], [640, 900], [600, 400], [844, 390], [768, 1024], [1024, 768], [1440, 900], [500, 500],
  ] as const;
  it("pick the portrait still exactly where the portrait cut plays", () => {
    for (const [width, height] of screens) {
      assert.equal(matches(PORTRAIT_QUERY, { width, height }), fileFor(width, height) === clip.portrait, `${width}x${height}`);
    }
  });
  it("never both and never neither, so one still is preloaded on every screen", () => {
    for (const [width, height] of screens) {
      assert.notEqual(matches(PORTRAIT_QUERY, { width, height }), matches(LANDSCAPE_QUERY, { width, height }), `${width}x${height}`);
    }
  });
  it("say what the stylesheet's sm breakpoint and the short-screen step say", () => {
    assert.match(PORTRAIT_QUERY, /\(max-width: 39\.99rem\)/);
    assert.match(PHONE_VIDEO_QUERY, /\(max-width: 39\.99rem\)/);
    assert.match(PHONE_VIDEO_QUERY, /\(max-height: 31\.25rem\)/);
  });
});

describe("site.homeHero", () => {
  it("is one of the two heroes the home page knows", () => {
    assert.ok(site.homeHero === "video" || site.homeHero === "photo");
  });
});

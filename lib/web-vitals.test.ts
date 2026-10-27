import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deviceClass, plausiblePayload, routeTemplate, vitalBucket, vitalEvent } from "./web-vitals";

describe("vitalBucket", () => {
  it("buckets LCP in half seconds around the 2.5s budget", () => {
    assert.equal(vitalBucket("LCP", 640), "0-1.0s");
    assert.equal(vitalBucket("LCP", 1000), "0-1.0s");
    assert.equal(vitalBucket("LCP", 2400), "2.0-2.5s");
    assert.equal(vitalBucket("LCP", 2501), "2.5-3.0s");
    assert.equal(vitalBucket("LCP", 3900), "3.0-4.0s");
    assert.equal(vitalBucket("LCP", 9000), "4.0s+");
  });
  it("buckets INP around Google's 200ms", () => {
    assert.equal(vitalBucket("INP", 48), "0-100ms");
    assert.equal(vitalBucket("INP", 200), "100-200ms");
    assert.equal(vitalBucket("INP", 350), "300-500ms");
    assert.equal(vitalBucket("INP", 800), "500ms+");
  });
  it("buckets CLS around the 0.05 budget", () => {
    assert.equal(vitalBucket("CLS", 0), "0-0.02");
    assert.equal(vitalBucket("CLS", 0.04), "0.02-0.05");
    assert.equal(vitalBucket("CLS", 0.08), "0.05-0.10");
    assert.equal(vitalBucket("CLS", 0.3), "0.25+");
  });
});

describe("deviceClass", () => {
  it("splits at 768 and 1200", () => {
    assert.equal(deviceClass(390), "phone");
    assert.equal(deviceClass(768), "tablet");
    assert.equal(deviceClass(1440), "desktop");
  });
});

describe("routeTemplate", () => {
  it("puts the param names back in place of their values", () => {
    assert.equal(routeTemplate("/neighborhoods/lakewood-ranch", { slug: "lakewood-ranch" }), "/neighborhoods/[slug]");
    assert.equal(routeTemplate("/thanks/contact", { form: "contact" }), "/thanks/[form]");
    assert.equal(routeTemplate("/", {}), "/");
    assert.equal(routeTemplate("/sell/net-proceeds", {}), "/sell/net-proceeds");
  });
  it("collapses a catch-all", () => {
    assert.equal(routeTemplate("/studio/desk/a", { tool: ["desk", "a"] }), "/studio/[...tool]");
  });
  it("matches encoded segments", () => {
    assert.equal(routeTemplate("/tide/street/main%20st", { street: "main st" }), "/tide/street/[street]");
  });
});

describe("vitalEvent", () => {
  const page = { template: "/contact", width: 390, pixel: true };
  it("reports LCP, INP and CLS with the page's props", () => {
    assert.deepEqual(vitalEvent({ name: "INP", value: 212.4, rating: "needs-improvement", id: "v5-1" }, page), {
      metric: "INP",
      rating: "needs-improvement",
      value: "200-300ms",
      template: "/contact",
      device: "phone",
      pixel: "on",
    });
    assert.equal(vitalEvent({ name: "CLS", value: 0.031, rating: "good", id: "x" }, { ...page, pixel: false })?.value, "0.02-0.05");
  });
  it("leaves out the other metrics and client-side navigations", () => {
    assert.equal(vitalEvent({ name: "FCP", value: 900, id: "a" }, page), null);
    assert.equal(vitalEvent({ name: "TTFB", value: 90, id: "b" }, page), null);
    assert.equal(vitalEvent({ name: "LCP", value: 900, id: "c", navigationType: "soft-navigation" }, page), null);
    assert.equal(vitalEvent({ name: "LCP", value: Number.NaN, id: "d" }, page), null);
  });
});

describe("plausiblePayload", () => {
  it("is the body Plausible's script sends", () => {
    const body = JSON.parse(plausiblePayload({ metric: "LCP", rating: "good", value: "0-1.0s", template: "/", device: "desktop", pixel: "off" }, { url: "https://jjpremiergroup.com/", domain: "jjpremiergroup.com", referrer: null }));
    assert.deepEqual(body, { n: "Web Vitals", u: "https://jjpremiergroup.com/", d: "jjpremiergroup.com", r: null, p: { metric: "LCP", rating: "good", value: "0-1.0s", template: "/", device: "desktop", pixel: "off" } });
  });
});

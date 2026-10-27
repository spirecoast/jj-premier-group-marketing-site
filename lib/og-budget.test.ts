import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { OG_BUDGET, brandOgImage, constellationOgImage } from "./og";

/** The busiest photographs the cards use, and the dense constellation. */
describe("share cards", () => {
  test("a photo card is a 1200×630 JPEG under the WhatsApp budget", async () => {
    for (const photo of ["/images/library/gulf-beach-aerial.jpg", "/images/library/lakes-aerial-sunset.jpg", "/images/library/kitchen-navy-island.jpg"]) {
      const res = await brandOgImage({ eyebrow: "Lakewood Ranch · Sarasota · Bradenton", title: "Your next home is waiting.", meta: "A mother and daughter team", photo });
      const buf = Buffer.from(await res.arrayBuffer());
      assert.equal(res.headers.get("content-type"), "image/jpeg");
      assert.deepEqual([...buf.subarray(0, 3)], [0xff, 0xd8, 0xff], "a JPEG");
      assert.ok(buf.byteLength < OG_BUDGET, `${photo}: ${buf.byteLength} bytes`);
    }
  });

  test("a constellation card is under the budget too", async () => {
    const points: [number, number, number][] = [];
    for (let i = 0; i < 2000; i += 1) points.push([-82.79 + ((i * 7919) % 550) / 1000, 27.16 + ((i * 104729) % 520) / 1000, (i % 3) / 2]);
    const res = await constellationOgImage({ eyebrow: "Atlas", title: "Every place in Lakewood Ranch, Sarasota and Bradenton.", points, focus: [-82.45, 27.4] });
    const buf = Buffer.from(await res.arrayBuffer());
    assert.ok(buf.byteLength < OG_BUDGET, `${buf.byteLength} bytes`);
  });
});

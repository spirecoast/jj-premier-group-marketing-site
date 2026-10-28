import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { easeBrand, formatLike, splitNumber } from "./number";

describe("living numbers", () => {
  it("takes a formatted figure apart and puts it back the same way", () => {
    for (const text of ["$512,000", "1,234", "7%", "−3%", "$1,250,500", "12.5%", "about 40 homes", "0"]) {
      const p = splitNumber(text);
      assert.ok(p, text);
      assert.equal(formatLike(p, p.value), text);
    }
  });

  it("keeps the shape while counting", () => {
    const p = splitNumber("$512,000")!;
    assert.equal(formatLike(p, 0), "$0");
    assert.equal(formatLike(p, 1234.4), "$1,234");
    const pct = splitNumber("12.5%")!;
    assert.equal(formatLike(pct, 3), "3.0%");
    const plain = splitNumber("1234")!;
    assert.equal(plain.grouped, false);
    assert.equal(formatLike(plain, 999999), "999999");
  });

  it("leaves text with no number alone", () => {
    assert.equal(splitNumber("–"), null);
    assert.equal(splitNumber("n/a"), null);
    assert.equal(splitNumber(""), null);
  });

  it("counts on the brand curve: starts fast, settles slowly, ends exactly", () => {
    assert.equal(easeBrand(0), 0);
    assert.equal(easeBrand(1), 1);
    const quarter = easeBrand(0.25);
    const half = easeBrand(0.5);
    assert.ok(quarter > 0.5, `ease-out: ${quarter}`);
    assert.ok(half > quarter && half < 1);
    let prev = 0;
    for (let i = 1; i <= 20; i += 1) {
      const v = easeBrand(i / 20);
      assert.ok(v >= prev, "monotonic");
      prev = v;
    }
  });
});

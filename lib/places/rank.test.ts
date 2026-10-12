import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clockLabel, miles, openPeriod, rank, score, type Period, type RawPlace } from "./rank";
import geo from "./venue-geo.json";

const P = (o: [number, number, number], c?: [number, number, number]): Period => ({
  open: { day: o[0], hour: o[1], minute: o[2] },
  ...(c ? { close: { day: c[0], hour: c[1], minute: c[2] } } : {}),
});

const place = (id: string, rating: number, count: number, extra: Partial<RawPlace> = {}): RawPlace => ({ id, name: id, rating, count, status: "OPERATIONAL", ...extra });

describe("places: score", () => {
  test("a high rating on a few reviews ranks below a slightly lower one on many", () => {
    assert.ok(score(4.9, 12) < score(4.7, 900));
  });
  test("with no reviews the score is the prior", () => {
    assert.equal(score(5, 0), 4);
  });
});

describe("places: distance", () => {
  test("the Van Wezel to the Sarasota Opera House is about half a mile", () => {
    const g = geo as Record<string, number[]> as Record<string, [number, number]>;
    const d = miles(g["van-wezel"]!, g["sarasota-opera-house"]!);
    assert.ok(d > 0.4 && d < 0.8, String(d));
  });
});

describe("places: opening hours", () => {
  const evenings = [P([5, 17, 0], [5, 23, 0]), P([6, 17, 0], [0, 1, 0])];
  test("open inside a period", () => {
    assert.ok(openPeriod(evenings, 5, 18 * 60));
  });
  test("closed before it opens", () => {
    assert.equal(openPeriod(evenings, 5, 16 * 60 + 59), null);
  });
  test("closed at the closing minute", () => {
    assert.equal(openPeriod(evenings, 5, 23 * 60), null);
  });
  test("a Saturday period that runs past midnight into Sunday", () => {
    assert.ok(openPeriod(evenings, 6, 23 * 60 + 30));
    assert.ok(openPeriod(evenings, 0, 30));
    assert.equal(openPeriod(evenings, 0, 60), null);
  });
  test("a period with no close is open around the clock", () => {
    assert.ok(openPeriod([P([0, 0, 0])], 3, 4 * 60));
  });
  test("clock labels", () => {
    assert.equal(clockLabel(23, 0), "11 PM");
    assert.equal(clockLabel(22, 30), "10:30 PM");
    assert.equal(clockLabel(0, 0), "Midnight");
    assert.equal(clockLabel(11, 0), "11 AM");
  });
});

describe("places: rank", () => {
  test("drops closed businesses, low ratings and thin review counts", () => {
    const out = rank([
      place("good", 4.6, 300),
      place("closed", 4.8, 500, { status: "CLOSED_PERMANENTLY" }),
      place("low", 4.0, 2000),
      place("thin", 5, 8),
    ]);
    assert.deepEqual(
      out.map((p) => p.id),
      ["good"],
    );
  });
  test("orders by score, not by raw rating", () => {
    const out = rank([place("few", 4.9, 30), place("many", 4.6, 1500)]);
    assert.deepEqual(
      out.map((p) => p.id),
      ["many", "few"],
    );
  });
  test("keeps only places open at the hour asked about, and says until when", () => {
    const out = rank(
      [
        place("late", 4.5, 400, { periods: [P([5, 16, 0], [5, 22, 0])] }),
        place("lunch", 4.7, 400, { periods: [P([5, 11, 0], [5, 15, 0])] }),
        place("no-hours", 4.4, 400),
      ],
      { openAt: { day: 5, minutes: 18 * 60 } },
    );
    assert.deepEqual(
      out.map((p) => [p.id, p.hours]),
      [
        ["late", "Open until 10 PM"],
        ["no-hours", undefined],
      ],
    );
  });
  test("measures distance from the venue and shows at most five", () => {
    const from: [number, number] = [27.34454, -82.54692];
    const raw = Array.from({ length: 8 }, (_, i) => place(`p${i}`, 4.5, 200 + i, { lat: 27.34454 + 0.01 * i, lng: -82.54692 }));
    const out = rank(raw, { from });
    assert.equal(out.length, 5);
    assert.ok(out.every((p) => typeof p.miles === "number"));
  });
  test("price levels become dollar signs, and duplicates are dropped", () => {
    const out = rank([place("a", 4.5, 200, { priceLevel: "PRICE_LEVEL_EXPENSIVE" }), place("a", 4.5, 200)]);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.price, "$$$");
  });
});

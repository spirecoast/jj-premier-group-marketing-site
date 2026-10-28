import assert from "node:assert/strict";
import { describe, it } from "node:test";
// The ingest's own scripts are plain Node modules (typed by inference through allowJs); these tests hold them to their rules.
import { forwardTransverseMercator, inverseTransverseMercator, parcelPoints, round5 } from "../../scripts/sales/geo.mjs";
import { cleanPlaceName, neighborhoodCode, subdivisionCode } from "../../scripts/sales/names.mjs";
import { LIMITS, checkCounty, deltaTable, newSales, parseZipMarket } from "../../scripts/sales/verify-lib.mjs";

type Row = { county: string; parcelId: string; saleDate: string; zip: string; livingArea: number | null; lat?: number; subdivision?: string };

const row = (i: number, over: Partial<Row> = {}): Row => ({ county: "manatee", parcelId: `P${i}`, saleDate: "2026-09-01", zip: "34211", livingArea: 1800, lat: 27.4, subdivision: "AURORA", ...over });
const rows = (n: number, over: Partial<Row> = {}) => Array.from({ length: n }, (_, i) => row(i, over));
const manifest = (over: Record<string, unknown> = {}) => ({ to: "2026-09-24", byUse: { "single-family": 90, condo: 10 }, toUnchangedRuns: 0, ...over });

describe("the sales refresh gate", () => {
  it("passes a normal week", () => {
    const res = checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest({ to: "2026-10-01" }), rows: rows(104) }, generatedAt: "2026-10-04T09:00:00Z" });
    assert.deepEqual(res, { errors: [], warnings: [] });
  });

  it("fails a truncated file (more than a 10% drop)", () => {
    const res = checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest(), rows: rows(89) }, generatedAt: "2026-09-27T09:00:00Z" });
    assert.equal(res.errors.length, 1);
    assert.match(res.errors[0], /rows fell from 100 to 89/);
    // Exactly at the limit is fine.
    assert.equal(checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest(), rows: rows(90) }, generatedAt: "2026-09-27T09:00:00Z" }).errors.length, 0);
  });

  it("fails a newest sale that moved backwards, and a property type that vanished", () => {
    const res = checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest({ to: "2026-09-20", byUse: { "single-family": 100 } }), rows: rows(100) }, generatedAt: "2026-09-27T09:00:00Z" });
    assert.equal(res.errors.length, 2);
    assert.match(res.errors.join(" "), /moved backwards, from 2026-09-24 to 2026-09-20/);
    assert.match(res.errors.join(" "), /no rows left for condo/);
  });

  it("fails when the living-area share falls more than five points (a renamed column reads as empty)", () => {
    const after = [...rows(90), ...rows(10, { livingArea: null })];
    const res = checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest(), rows: after }, generatedAt: "2026-09-27T09:00:00Z" });
    assert.match(res.errors[0] ?? "", /living area fell from 100.0% to 90.0%/);
    assert.ok(LIMITS.livingAreaDrop === 0.05);
  });

  it("fails more than 1% of rows outside the county's ZIPs", () => {
    const after = [...rows(97), ...rows(3, { zip: "00000" })];
    const res = checkCounty("manatee", { before: null, after: { manifest: manifest(), rows: after }, generatedAt: "2026-09-27T09:00:00Z" });
    assert.match(res.errors[0] ?? "", /3 rows \(3.0%\) have a ZIP outside/);
    assert.equal(checkCounty("manatee", { before: null, after: { manifest: manifest(), rows: [...rows(99), row(99, { zip: "00000" })] }, generatedAt: "2026-09-27T09:00:00Z" }).errors.length, 0);
  });

  it("warns on a stall, and when coordinates or subdivision names thin out", () => {
    const stalled = checkCounty("manatee", { before: null, after: { manifest: manifest({ toUnchangedRuns: 3 }), rows: rows(10) }, generatedAt: "2026-10-25T09:00:00Z" });
    assert.match(stalled.warnings[0] ?? "", /2026-09-24 for 3 refreshes in a row/);
    const old = checkCounty("manatee", { before: null, after: { manifest: manifest(), rows: rows(10) }, generatedAt: "2026-10-27T09:00:00Z" });
    assert.match(old.warnings[0] ?? "", /33 days before this run/);
    const thin = checkCounty("manatee", { before: { manifest: manifest(), rows: rows(100) }, after: { manifest: manifest(), rows: [...rows(50), ...rows(50, { lat: undefined, subdivision: "" })] }, generatedAt: "2026-09-27T09:00:00Z" });
    assert.equal(thin.errors.length, 0);
    assert.equal(thin.warnings.length, 2);
  });

  it("lists only the sales that weren't there last week, newest first", () => {
    const before = [row(1), row(2)];
    const after = [row(1), row(2), row(3, { saleDate: "2026-09-10" }), row(1, { saleDate: "2026-09-20" })];
    const added = newSales(before, after);
    assert.deepEqual(added.map((r: Row) => `${r.parcelId}@${r.saleDate}`), ["P1@2026-09-20", "P3@2026-09-10"]);
  });

  it("writes the PR table with rows ±, the newest sale and new sales by market", () => {
    const table = deltaTable(
      [{ county: "manatee", before: { manifest: manifest(), rows: rows(10) }, after: { manifest: manifest({ to: "2026-10-01" }), rows: rows(12) }, added: [row(10), row(11, { zip: "34219" })] }],
      { "34211": "lakewood-ranch", "34219": "bradenton" },
    );
    assert.match(table, /\| manatee \| 12 \(\+2\) \| 2026-10-01 \(\+7 days\) \| 2 · lakewood-ranch 1, bradenton 1 \|/);
  });

  it("reads the ZIP → market table out of the TypeScript source", () => {
    assert.deepEqual(parseZipMarket(`export const ZIP_MARKET = {\n  "34201": "bradenton", // x\n  "34202": "lakewood-ranch",\n};`), { "34201": "bradenton", "34202": "lakewood-ranch" });
  });
});

describe("county place names", () => {
  it("drops the plat-book reference and the placeholders, keeps the name as the county spells it", () => {
    assert.equal(cleanPlaceName("THE WATCH AT WATERLEFE PH II CB30/149"), "THE WATCH AT WATERLEFE PH II");
    assert.equal(cleanPlaceName("pomello park  PB6/61"), "POMELLO PARK");
    assert.equal(cleanPlaceName("NOT IN SUBDIVISION 0/0"), "");
    assert.equal(cleanPlaceName("NOT PART OF A SUBDIVISION"), "");
    assert.equal(cleanPlaceName("Blank NBHD - Do not use"), "");
    assert.equal(cleanPlaceName("Mira Lago at Palmer Ranch Ph 1"), "MIRA LAGO AT PALMER RANCH PH 1");
  });

  it("reads Sarasota's codes the way its tables key them", () => {
    assert.equal(subdivisionCode("154"), "0154");
    assert.equal(subdivisionCode("7002"), "7002");
    assert.equal(neighborhoodCode("4204.6"), "4204.60");
    assert.equal(neighborhoodCode(" 4405.16 "), "4405.16");
  });
});

/** A one-record shapefile pair: a square parcel 100 ft on a side, its id in PARCELNO. */
function squareParcel(id: string, x: number, y: number) {
  const points = [
    [x, y],
    [x, y + 100],
    [x + 100, y + 100],
    [x + 100, y],
    [x, y],
  ];
  const content = 44 + 4 + points.length * 16;
  const shp = Buffer.alloc(100 + 8 + content);
  shp.writeInt32BE(9994, 0);
  shp.writeInt32BE(shp.length / 2, 24);
  shp.writeInt32LE(1000, 28);
  shp.writeInt32LE(5, 32);
  shp.writeInt32BE(1, 100);
  shp.writeInt32BE(content / 2, 104);
  const c = 108;
  shp.writeInt32LE(5, c);
  [x, y, x + 100, y + 100].forEach((v, i) => shp.writeDoubleLE(v, c + 4 + i * 8));
  shp.writeInt32LE(1, c + 36);
  shp.writeInt32LE(points.length, c + 40);
  shp.writeInt32LE(0, c + 44);
  points.forEach(([px, py], i) => {
    shp.writeDoubleLE(px!, c + 48 + i * 16);
    shp.writeDoubleLE(py!, c + 48 + i * 16 + 8);
  });
  const fieldLen = 12;
  const headerLen = 32 + 32 + 1;
  const dbf = Buffer.alloc(headerLen + 1 + fieldLen + 1);
  dbf.writeUInt8(3, 0);
  dbf.writeUInt32LE(1, 4);
  dbf.writeUInt16LE(headerLen, 8);
  dbf.writeUInt16LE(1 + fieldLen, 10);
  dbf.write("PARCELNO", 32, "latin1");
  dbf.write("C", 32 + 11, "latin1");
  dbf.writeUInt8(fieldLen, 32 + 16);
  dbf.writeUInt8(0x0d, 64);
  dbf.write(" ", headerLen, "latin1");
  dbf.write(id.padEnd(fieldLen), headerLen + 1, "latin1");
  return { shp, dbf };
}

describe("parcel coordinates", () => {
  it("projects Florida West State Plane feet back to latitude and longitude", () => {
    // Lakewood Ranch Main Street, and the Anna Maria City Pier: round trips agree to the five decimals kept.
    for (const [lat, lng] of [
      [27.40079, -82.43108],
      [27.53412, -82.73292],
    ] as const) {
      const { x, y } = forwardTransverseMercator(lat, lng);
      const back = inverseTransverseMercator(x, y);
      assert.equal(round5(back.lat), lat);
      assert.equal(round5(back.lng), lng);
    }
    // The zone's origin is its false easting on the central meridian at 24°20' N.
    const origin = inverseTransverseMercator(656166.66666666651, 0);
    assert.ok(Math.abs(origin.lat - 24.333333) < 1e-6 && Math.abs(origin.lng + 82) < 1e-6);
  });

  it("puts a parcel at its polygon's centroid and keeps only the wanted ids", () => {
    const { x, y } = forwardTransverseMercator(27.4, -82.4);
    const { shp, dbf } = squareParcel("0580103559", x - 50, y - 50);
    const found = parcelPoints(shp, dbf, "PARCELNO", new Set(["580103559"]));
    assert.deepEqual(found.get("580103559"), { lat: 27.4, lng: -82.4 });
    assert.equal(parcelPoints(shp, dbf, "PARCELNO", new Set(["123"])).size, 0);
  });
});

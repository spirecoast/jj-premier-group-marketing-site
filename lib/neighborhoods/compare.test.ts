import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkedLabel, compareRows, sourceFor } from "./compare";
import type { NeighborhoodRecord } from "./types";

const record = (slug: string, over: Partial<NeighborhoodRecord> = {}): NeighborhoodRecord => ({
  _id: `neighborhood-${slug}`,
  slug,
  name: slug,
  aliases: [],
  level: "community",
  parentSlug: null,
  market: "lakewood-ranch",
  bradentonArea: false,
  jurisdiction: null,
  county: "Manatee",
  zips: [],
  lat: null,
  lng: null,
  type: null,
  developer: null,
  activeBuilders: [],
  yearsBuilt: null,
  homeTypes: [],
  homeCount: null,
  gated: null,
  ageRestricted: null,
  hoa: null,
  cdd: null,
  amenities: [],
  waterAccess: null,
  zonedSchools: null,
  evacuationZone: null,
  status: null,
  officialUrl: null,
  description: null,
  research: "full",
  sources: [],
  notes: null,
  ...over,
});

const a = record("a", {
  type: "village",
  gated: true,
  hoa: { name: "A Owners", website: "https://a.example" },
  evacuationZone: "C",
  sources: [
    { url: "https://county.example/gis", supports: "jurisdiction, county, evacuationZone (level C)", checked: "2026-09-22", sourceDate: null },
    { url: "https://a.example/hoa", supports: "hoa, gated, amenities", checked: "2026-09-23", sourceDate: null },
    { url: "https://old.example", supports: "gated", checked: "2026-01-01", sourceDate: null },
  ],
});
const b = record("b", { waterAccess: "lake", sources: [{ url: "https://b.example", supports: "waterAccess", checked: "2026-09-10", sourceDate: null }] });

describe("the compare page's rows", () => {
  test("the source for a field is the most recently checked one that supports it", () => {
    assert.equal(sourceFor(a, "gated")?.url, "https://a.example/hoa");
    assert.equal(sourceFor(a, "evacuationZone")?.url, "https://county.example/gis");
    assert.equal(sourceFor(a, "waterAccess"), undefined);
    // "county" doesn't match a source that only supports "countyRegistry" or the like.
    assert.equal(sourceFor(record("x", { sources: [{ url: "https://x", supports: "countyRegistry", checked: "2026-01-01", sourceDate: null }] }), "county"), undefined);
  });

  test("a row is kept when any place holds the fact; the four Match facts always show, with not-known cells empty", () => {
    const rows = compareRows([a, b]);
    const ids = rows.map((r) => r.id);
    assert.ok(ids.includes("type") && ids.includes("gated") && ids.includes("hoa") && ids.includes("cdd") && ids.includes("water") && ids.includes("evac"));
    assert.ok(!ids.includes("zips") && !ids.includes("builders"), "no place has a ZIP or a builder");
    const gated = rows.find((r) => r.id === "gated")!;
    assert.deepEqual(gated.cells[0], { value: "Yes", source: { host: "a.example", url: "https://a.example/hoa", checked: "2026-09-23" } });
    assert.deepEqual(gated.cells[1], {});
    const hoa = rows.find((r) => r.id === "hoa")!;
    assert.equal(hoa.cells[0]!.href, "https://a.example");
    const water = rows.find((r) => r.id === "water")!;
    assert.equal(water.cells[1]!.value, "Lake");
    const evac = rows.find((r) => r.id === "evac")!;
    assert.equal(evac.cells[0]!.value, "Zone C");
  });

  test("checked dates read as a short date", () => {
    assert.equal(checkedLabel("2026-09-23"), "Sep 23, 2026");
    assert.equal(checkedLabel(""), "");
  });
});

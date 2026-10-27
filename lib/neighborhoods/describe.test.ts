import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DESCRIPTION_MIN, clampDescription } from "../seo";
import { NEIGHBORHOODS } from "../content/seed/neighborhoods";
import { GUIDES } from "../guides";
import { ATLAS_LINE, placeDescription } from "./describe";
import type { NeighborhoodRecord } from "./types";

const base = { jurisdiction: null, county: null, gated: null, hoa: null, cdd: null, evacuationZone: null, zips: [] } as const;

describe("a place page's search description", () => {
  test("a long description is left alone", () => {
    const long = "x".repeat(120) + ".";
    assert.equal(placeDescription(long, { ...base, gated: true }), long);
  });

  test("a short one gets the facts the record holds, in the page's order", () => {
    const out = placeDescription("The gated village on the lakes, east of Lorraine Road.", {
      ...base,
      jurisdiction: "Unincorporated Manatee County",
      gated: true,
      hoa: { name: "Lake Club HOA", website: null },
      cdd: { name: "CDD 6", source: "x" },
      evacuationZone: "none",
    });
    assert.equal(out, "The gated village on the lakes, east of Lorraine Road. In unincorporated Manatee County. Gated, with an HOA and a CDD on record.");
  });

  test("it never says what the record doesn't hold, and skips a place the words already name", () => {
    const out = placeDescription("Amber Creek is a townhome village in the Manatee County part of Lakewood Ranch.", { ...base, county: "Manatee", zips: ["34211"] });
    assert.equal(out, `Amber Creek is a townhome village in the Manatee County part of Lakewood Ranch. ZIP 34211. ${ATLAS_LINE}`);
    assert.doesNotMatch(out, /HOA|CDD|gated|zone/i);
    assert.equal(placeDescription("West of the Trail", undefined), `West of the Trail. ${ATLAS_LINE}`);
  });
});

describe("every page in the sitemap fills its search result", () => {
  const records = JSON.parse(readFileSync(path.join(process.cwd(), "neighborhood-data/data/neighborhoods.json"), "utf8")) as NeighborhoodRecord[];
  test("each researched place, and each place with editorial words", () => {
    const short = records
      .filter((r) => r.research === "full")
      .map((r) => {
        const ed = NEIGHBORHOODS.find((n) => n.slug === r.slug);
        return [r.slug, clampDescription(placeDescription(ed?.tagline ?? r.description ?? "", r))] as const;
      })
      .filter(([, d]) => d.length < DESCRIPTION_MIN);
    assert.deepEqual(short, []);
    for (const n of NEIGHBORHOODS) {
      const d = clampDescription(placeDescription(n.tagline, records.find((r) => r.slug === n.slug)));
      assert.ok(d.length >= DESCRIPTION_MIN, `${n.slug}: ${d}`);
    }
  });

  test("each guide", () => {
    for (const g of GUIDES) {
      const d = clampDescription(g.promise.length >= DESCRIPTION_MIN ? g.promise : `${g.promise} By ${g.author.name}, sources ${g.checked}.`);
      assert.ok(d.length >= DESCRIPTION_MIN, `${g.slug}: ${d}`);
    }
  });
});

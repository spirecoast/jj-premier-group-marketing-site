import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkFairHousing } from "./fair-housing";
import { GUIDES } from "./guides";
import type { ZoneCardsFigure } from "./guides/types";
import { aiTells } from "./voice";
import { FLOOD_RISK_LABEL, ZONE_GUIDES, evacAbout, evacWordFor, evacZoneMeaning, floodCodesIn, floodZoneMeaning, namesEvacuation, withZoneRisk, zoneTextParts, type EvacZone } from "./zones";

const FLOOD_CODES = ["VE", "V", "V12", "AE", "A", "A7", "AH", "AO", "AR", "A99", "X", "B", "C", "D"];
const EVAC: EvacZone[] = ["A", "B", "C", "D", "E", "none"];

describe("flood zones", () => {
  test("the high-risk zones are FEMA's 1% annual chance area, where lenders usually require flood insurance", () => {
    for (const code of ["VE", "V", "AE", "A", "AH", "AO", "AR", "A99"]) {
      const m = floodZoneMeaning(code)!;
      assert.ok(m, code);
      assert.ok(m.risk === "highest" || m.risk === "high", code);
      assert.match(m.line, /^Part of FEMA’s 1% annual chance flood area/, code);
      assert.match(m.line, /lenders usually require flood insurance/i, code);
    }
    assert.equal(floodZoneMeaning("AE")!.line, "Part of FEMA’s 1% annual chance flood area, where lenders usually require flood insurance.");
    assert.equal(floodZoneMeaning("VE")!.risk, "highest");
    assert.match(floodZoneMeaning("VE")!.line, /3 feet or more/);
  });

  test("X is lower risk, shaded X moderate, and neither carries the U.S. requirement", () => {
    assert.equal(floodZoneMeaning("X")!.risk, "lower");
    assert.equal(floodZoneMeaning("X", { shaded: false })!.risk, "lower");
    assert.equal(floodZoneMeaning("X", { shaded: true })!.risk, "moderate");
    assert.match(floodZoneMeaning("X", { shaded: true })!.line, /0\.2% \(1 in 500\)/);
    for (const m of [floodZoneMeaning("X")!, floodZoneMeaning("X", { shaded: true })!, floodZoneMeaning("X", { shaded: false })!]) {
      assert.match(m.line, /U\.S\. rules don’t require flood insurance here, but a lender can\./);
    }
  });

  test("D hasn't been studied, and anything that isn't a zone has no meaning", () => {
    assert.equal(floodZoneMeaning("D")!.risk, "unknown");
    assert.equal(floodZoneMeaning("OPEN WATER"), null);
    assert.equal(floodZoneMeaning("AREA NOT INCLUDED"), null);
    assert.equal(floodZoneMeaning(" ae ")!.code, "AE");
    assert.equal(floodZoneMeaning("AR/AE")!.risk, "high");
  });

  test("the risk names are the flood guide's zone cards' names", () => {
    const g = GUIDES.find((x) => x.slug === "flood-zones-and-elevation-certificates-on-the-suncoast")!;
    const fig = g.sections.flatMap((s) => s.blocks).find((b) => b.kind === "figure" && b.figure.type === "zone-cards");
    assert.ok(fig && fig.kind === "figure");
    const cards = (fig.figure as ZoneCardsFigure).cards;
    assert.deepEqual(
      cards.map((c) => c.code),
      ["VE", "AE", "X"],
    );
    for (const c of cards) assert.equal(floodZoneMeaning(c.code)!.label, c.name, c.code);
  });

  test("every zone names its FEMA sources", () => {
    for (const code of FLOOD_CODES) {
      const m = floodZoneMeaning(code)!;
      assert.ok(m.sources.length > 0, code);
      for (const s of m.sources) assert.match(s.href, /^https:\/\/www\.fema\.gov\//, code);
    }
  });
});

describe("evacuation zones", () => {
  test("A is first and the most exposed to storm surge; E is last", () => {
    assert.match(evacZoneMeaning("A").line, /first called to leave.*most exposed to storm surge/);
    assert.match(evacZoneMeaning("E").line, /last of the five.*least exposed/);
    assert.equal(evacZoneMeaning("C", "level").line, "Next in line after levels A and B.");
    assert.equal(evacZoneMeaning("none").short, "Outside every zone on the county’s storm surge map.");
    assert.equal(evacZoneMeaning("C").short, "Next in line after zones A and B. Zone A is the most exposed to storm surge.");
    assert.equal(evacZoneMeaning("B", "level").tag, "next after level A");
    for (const z of EVAC) assert.ok(evacZoneMeaning(z).sources.some((s) => /mymanatee\.org/.test(s.href)));
  });

  test("the letters are about storm surge, not the flood zone, in each county's word", () => {
    assert.match(evacAbout(), /^Evacuation zones run from A to E\. Zone A is called to leave first/);
    assert.match(evacAbout("level"), /^Evacuation levels run from A to E\. Level A/);
    assert.match(evacAbout(), /about storm surge, not the same as the flood zone/);
    assert.equal(evacWordFor("Manatee"), "level");
    assert.equal(evacWordFor("Sarasota"), "zone");
    assert.equal(evacWordFor(null), "zone");
  });

  test("the hurricane guide says the same thing", () => {
    const g = GUIDES.find((x) => x.slug === "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton")!;
    const s = g.sections.find((x) => x.id === "evacuation-zone-vs-flood-zone")!;
    const text = s.blocks.map((b) => (b.kind === "paragraph" ? b.segs.join("") : "")).join(" ");
    assert.match(text, /Zone A is the most exposed and is called first/);
    assert.match(text, /not the same as flood zones/);
    assert.ok(ZONE_GUIDES.evacuation.endsWith(`#${s.id}`));
  });
});

describe("zones named in a sentence", () => {
  test("finds the codes standing on their own, once each", () => {
    assert.deepEqual(floodCodesIn("Mostly AE and VE; check elevation certificates"), ["AE", "VE"]);
    assert.deepEqual(floodCodesIn("Zone AE along the Manatee River, zone X south of 6th Avenue."), ["AE", "X"]);
    assert.deepEqual(floodCodesIn("AE and VE island-wide; AE again"), ["AE", "VE"]);
    assert.deepEqual(floodCodesIn("A flood zone. An X-ray. Evacuation zone A. Box X12. MAE"), []);
  });

  test("sets the risk after the first mention of each code", () => {
    assert.equal(
      withZoneRisk("Most of the island is in zone AE or VE, so flood insurance is required with a mortgage."),
      "Most of the island is in zone AE (high risk) or VE (highest risk), so flood insurance is required with a mortgage.",
    );
    assert.equal(withZoneRisk("Mostly zone X; AE along the bayfront, and AE again."), "Mostly zone X (lower risk); AE (high risk) along the bayfront, and AE again.");
    assert.equal(withZoneRisk("Zone AE (high risk) already says it."), "Zone AE (high risk) already says it.");
    assert.equal(withZoneRisk("No zone here."), "No zone here.");
    assert.deepEqual(zoneTextParts("X"), [{ text: "X" }, { code: "X", label: "lower risk" }]);
  });

  test("knows a sentence about evacuation zones or levels", () => {
    assert.ok(namesEvacuation("Manatee County classifies evacuation levels A through E"));
    assert.ok(namesEvacuation("the evacuation zone we checked"));
    assert.ok(!namesEvacuation("the flood zone"));
  });
});

test("every line is plain, passes Fair Housing and reads as a person wrote it", () => {
  const lines = [
    ...FLOOD_CODES.flatMap((c) => [floodZoneMeaning(c)!.line, floodZoneMeaning(c)!.label]),
    floodZoneMeaning("X", { shaded: true })!.line,
    floodZoneMeaning("X", { shaded: false })!.line,
    ...EVAC.flatMap((z) => [evacZoneMeaning(z).line, evacZoneMeaning(z).short, evacZoneMeaning(z).tag, evacZoneMeaning(z, "level").line, evacZoneMeaning(z, "level").short]),
    evacAbout(),
    evacAbout("level"),
    ...Object.values(FLOOD_RISK_LABEL),
  ];
  for (const l of lines) {
    assert.deepEqual(aiTells(l), [], l);
    assert.ok(checkFairHousing(l).passed, l);
    assert.ok(!/—/.test(l), `no em dash: ${l}`);
    for (const sentence of l.split(/(?<=\.)\s+/)) assert.ok(sentence.split(/\s+/).length <= 24, `a short sentence: ${sentence}`);
  }
});

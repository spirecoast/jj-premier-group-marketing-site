import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { GUIDES } from "../guides";
import { checkHref } from "../search/intent";
import { checkLocated, locate, type Deps } from "./check";
import { checkStrings } from "./copy";
import { evacGuidePiece, floodGuidePiece } from "./guide";
import { PARCEL_FIELDS, countiesForZip, evacFrom, floodFrom, panelFrom, parcelWhere, parseAddress, pickParcel, ringCentroid, sqlText, toParcel, type Parcel, type ParsedAddress } from "./parse";

const parsed = (a: string, z = "") => {
  const p = parseAddress(a, z);
  if ("error" in p) throw new Error(p.error);
  return p;
};

describe("the typed address", () => {
  test("number, street parts, unit and ZIP", () => {
    const p = parsed("6810 9th Ave W #204, Bradenton, FL 34209");
    assert.deepEqual([p.number, p.predir, p.name, p.suffix, p.postdir, p.unit, p.zip], ["6810", "", "9TH", "AVE", "W", "204", "34209"]);
    assert.equal(p.display, "6810 9th Ave W #204, 34209");
  });
  test("the ZIP field wins over a pasted one", () => {
    assert.equal(parsed("1660 Ringling Blvd 34236", "34237").zip, "34237");
  });
  test("a directional before the name, and a name that is two words", () => {
    const p = parsed("1 N Tamiami Trail", "34236");
    assert.deepEqual([p.predir, p.name, p.suffix], ["N", "TAMIAMI", "TRL"]);
    assert.equal(parsed("12735 Lily Quartz Loop", "34219").name, "LILY QUARTZ");
  });
  test("what's missing, said once", () => {
    assert.deepEqual(parseAddress("Ringling Blvd", "34236"), { error: "number" });
    assert.deepEqual(parseAddress("1660", "34236"), { error: "street" });
    assert.deepEqual(parseAddress("1660 Ringling Blvd", ""), { error: "zip" });
  });
  test("nothing but an address reaches a where clause", () => {
    assert.equal(sqlText("O'Brien St; DROP"), "O''Brien St DROP");
    const w = parcelWhere("sarasota", { number: "1", name: "O'BRIEN", zip: "34236" });
    assert.equal(w, "locn='1' AND locs='O''BRIEN' AND loczip='34236'");
    assert.match(parcelWhere("manatee", { number: "1", name: "LILY", zip: "34219" }, true), /POSTAL_STREET LIKE 'LILY%'/);
  });
  test("an owner's name or mailing address is never asked for", () => {
    for (const f of [...PARCEL_FIELDS.manatee, ...PARCEL_FIELDS.sarasota]) assert.doesNotMatch(f, /owner|^own_|^name|^city$|^state$|^zip$|mail/i, f);
  });
  test("a ZIP asks its own county first; one in neither asks both", () => {
    assert.deepEqual(countiesForZip("34236"), ["sarasota"]);
    assert.deepEqual(countiesForZip("34219"), ["manatee"]);
    assert.deepEqual(countiesForZip("34243"), ["manatee", "sarasota"]);
    assert.deepEqual(countiesForZip("33101"), ["manatee", "sarasota"]);
  });
  test("search offers the check for an address with a ZIP", () => {
    assert.equal(checkHref({ kind: "street", street: "Ringling Blvd", number: "1660", zip: "34236" }), "/check?address=1660+Ringling+Blvd&zip=34236");
    assert.equal(checkHref({ kind: "street", street: "Ringling Blvd", number: "1660", zip: null }), null);
  });
});

describe("what the layers say", () => {
  test("Manatee's N/A and Sarasota's missing feature both read as outside every zone", () => {
    assert.deepEqual(evacFrom("manatee", [{ attributes: { EVAC_ZONE: "N/A" } }]), ["none"]);
    assert.deepEqual(evacFrom("sarasota", []), ["none"]);
    assert.deepEqual(evacFrom("manatee", [{ attributes: { EVAC_ZONE: "D" } }, { attributes: { EVAC_ZONE: "C" } }]), ["C", "D"]);
  });
  test("flood zones: the special flood hazard area first, FEMA's -9999 is no elevation", () => {
    const z = floodFrom([
      { attributes: { FLD_ZONE: "X", ZONE_SUBTY: "AREA OF MINIMAL FLOOD HAZARD", SFHA_TF: "F", STATIC_BFE: -9999 } },
      { attributes: { FLD_ZONE: "AE", ZONE_SUBTY: "COASTAL FLOODPLAIN", SFHA_TF: "T", STATIC_BFE: 8, V_DATUM: "NAVD88" } },
    ]);
    assert.deepEqual(z.map((x) => [x.zone, x.sfha, x.bfe]), [["AE", true, 8], ["X", false, null]]);
  });
  test("the panel from the county's own map wins at a county line", () => {
    const p = panelFrom([{ attributes: { FIRM_PAN: "12057C0670J", DFIRM_ID: "12057C", EFF_DATE: 1633564800000 } }, { attributes: { FIRM_PAN: "12081C0045F", DFIRM_ID: "12081C", EFF_DATE: 1628553600000 } }], "manatee");
    assert.deepEqual(p, { id: "12081C0045F", effective: "2021-08-10" });
  });
  test("a parcel ring's middle", () => {
    const c = ringCentroid([[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]])!;
    assert.deepEqual([c.lng, c.lat], [1, 1]);
  });
});

const manateeFeature = (over: Record<string, unknown> = {}) => ({
  attributes: { PARCEL_ID: "394692209", PROP_HN: "12735", POSTAL_STREET: "LILY QUARTZ", POSTAL_SUFF: "LOOP", PROP_DIR: null, UNIT: null, PROP_CITYNAME: "PARRISH", PROP_ZIP: "34219", LUC_DESCRIPTION: "Single Family Residential (0100)", SFLA: "1850", YRBLT_RES: "2024", ACRES: ".1104", LAT: 27.627, LON: -82.437, ...over },
  geometry: { rings: [[[-82.4372, 27.6269], [-82.4371, 27.6269], [-82.4371, 27.6271], [-82.4372, 27.6271], [-82.4372, 27.6269]]] as [number, number][][] },
});

describe("parcels", () => {
  test("a Manatee parcel: the roll's facts and the appraiser's page, nothing about who", () => {
    const p = toParcel("manatee", manateeFeature())!;
    assert.equal(p.street, "LILY QUARTZ LOOP");
    assert.equal(p.livingArea, 1850);
    assert.equal(p.yearBuilt, 2024);
    assert.equal(p.lotSqft, 4809);
    assert.equal(p.use, "Single family residential");
    assert.equal(p.link, "https://www.manateepao.gov/parcel/?parid=394692209");
  });
  test("a Sarasota parcel: the centroid, and a year built of 0 is none", () => {
    const p = toParcel("sarasota", { attributes: { account: "0197090050", locn: "828", locs: "BLUE SHELL", loct: "LOOP", loczip: "34240", loccity: "SARASOTA", stcd: "0000", living: null, yrbl: 0, lsqft: 9910, hyperlink: "https://www.sc-pa.com/propertysearch/parcel/0197090050" }, centroid: { x: -82.387, y: 27.367 } })!;
    assert.equal(p.yearBuilt, null);
    assert.equal(p.use, "Vacant residential");
    assert.equal(p.lat, 27.367);
  });
  test("a typed suffix picks among streets that share a name; a typed unit picks the unit", () => {
    const base = toParcel("manatee", manateeFeature())!;
    const p = (o: Partial<Parcel>): Parcel => ({ ...base, ...o });
    assert.equal(pickParcel([p({ suffix: "LOOP", street: "LILY QUARTZ LOOP" }), p({ suffix: "CT", street: "LILY QUARTZ CT", id: "2" })], { suffix: "CT", postdir: "", predir: "", unit: "" })?.parcel.id, "2");
    assert.equal(pickParcel([p({ suffix: "LOOP", street: "LILY QUARTZ LOOP" }), p({ suffix: "CT", street: "LILY QUARTZ CT" })], { suffix: "", postdir: "", predir: "", unit: "" }), null);
    const units = [p({ unit: "101", id: "a" }), p({ unit: "204", id: "b" })];
    assert.deepEqual(pickParcel(units, { suffix: "", postdir: "", predir: "", unit: "204" }), { parcel: units[1], units: 1 });
    assert.equal(pickParcel(units, { suffix: "", postdir: "", predir: "", unit: "" })?.units, 2);
  });
});

/** Fixture layers: answers by URL fragment, and a log of what was asked. */
function fixture(routes: [RegExp, unknown | Error][]): Deps & { asked: string[] } {
  const asked: string[] = [];
  const answer = async (url: string, form?: string) => {
    asked.push(url + (form ? ` ${form}` : ""));
    const hit = routes.find(([re]) => re.test(url + (form ?? "")));
    if (!hit) return { features: [] };
    if (hit[1] instanceof Error) throw hit[1];
    return hit[1];
  };
  return { asked, get: (u) => answer(u), post: (u, f) => answer(u, f), countiesForZip };
}

describe("a check, end to end on fixtures", () => {
  const a: ParsedAddress = parsed("12735 Lily Quartz Loop", "34219");

  test("parcel found: the zone at its middle, the others it touches, the panel, the roll", async () => {
    const deps = fixture([
      [/GIS_PARCELS.*POSTAL_STREET%3D%27LILY\+QUARTZ%27/, { features: [manateeFeature()] }],
      [/Evacuation.*esriGeometryPolygon/, { features: [{ attributes: { EVAC_ZONE: "N/A" } }] }],
      [/MapServer\/28\/query.*esriGeometryPolygon/, { features: [{ attributes: { FLD_ZONE: "X", SFHA_TF: "F", STATIC_BFE: -9999 } }, { attributes: { FLD_ZONE: "A", SFHA_TF: "T", STATIC_BFE: -9999 } }] }],
      [/MapServer\/28\/query\?/, { features: [{ attributes: { FLD_ZONE: "X", SFHA_TF: "F", STATIC_BFE: -9999 } }] }],
      [/MapServer\/3\/query/, { features: [{ attributes: { FIRM_PAN: "12081C0045F", DFIRM_ID: "12081C", EFF_DATE: 1628553600000 } }] }],
    ]);
    const l = await locate(a, deps);
    assert.equal(l.kind, "parcel");
    assert.ok(!deps.asked.some((u) => u.includes("Parcels/FeatureServer")), "a Manatee ZIP never asks Sarasota");
    if (l.kind !== "parcel") return;
    const r = await checkLocated(l, a, deps, "2026-10-28");
    assert.deepEqual(r.evacuation, { status: "ok", value: { zone: "none", others: [] } });
    assert.equal(r.flood.status === "ok" && r.flood.value?.zone.zone, "X");
    assert.deepEqual(r.flood.status === "ok" && r.flood.value?.others.map((z) => z.zone), ["A"]);
    assert.equal(r.flood.status === "ok" && r.flood.value?.panel?.id, "12081C0045F");
    assert.equal(r.roll?.yearBuilt, 2024);
    assert.equal(r.address, "12735 LILY QUARTZ LOOP");
    assert.match(r.sources.flood.page, /^https:\/\/msc\.fema\.gov\/portal\/search\?AddressQuery=/);
  });

  test("one source down: that fact says so, the rest still show", async () => {
    const deps = fixture([
      [/GIS_PARCELS/, { features: [manateeFeature()] }],
      [/hazards\.fema\.gov/, new Error("FEMA answered 503")],
      [/Evacuation/, { features: [{ attributes: { EVAC_ZONE: "B" } }] }],
    ]);
    const l = await locate(a, deps);
    if (l.kind !== "parcel") throw new Error("expected a parcel");
    const r = await checkLocated(l, a, deps, "2026-10-28");
    assert.equal(r.flood.status, "error");
    assert.deepEqual(r.evacuation, { status: "ok", value: { zone: "B", others: [] } });
  });

  test("not on the roll: the Census geocoder places it, and says it's approximate", async () => {
    const deps = fixture([[/geocoding\.geo\.census\.gov/, { result: { addressMatches: [{ matchedAddress: "12735 LILY QUARTZ LOOP, PARRISH, FL, 34219", coordinates: { x: -82.437, y: 27.627 }, geographies: { Counties: [{ GEOID: "12081" }] } }] } }]]);
    const l = await locate(a, deps);
    assert.equal(l.kind, "geocoder");
    assert.ok(deps.asked.some((u) => u.includes("address=12735+LILY+QUARTZ+LOOP%2C+FL+34219")));
  });

  test("outside the two counties, and nowhere at all", async () => {
    const outside = fixture([[/geocoding/, { result: { addressMatches: [{ matchedAddress: "1 MAIN ST, TAMPA, FL, 33602", coordinates: { x: 0, y: 0 }, geographies: { Counties: [{ GEOID: "12057" }] } }] } }]]);
    assert.equal((await locate(a, outside)).kind, "outside");
    assert.equal((await locate(a, fixture([[/geocoding/, { result: { addressMatches: [] } }]]))).kind, "none");
  });

  test("every source down is an error, not a 'not found'", async () => {
    await assert.rejects(locate(a, fixture([[/./, new Error("offline")]])));
  });
});

describe("the guides beside a result", () => {
  test("the flood guide's own card for AE, and its note for A", () => {
    const ae = floodGuidePiece(GUIDES, { zone: "AE", subtype: null, sfha: true, bfe: 8, datum: "NAVD88" })!;
    assert.equal(ae.card?.code, "AE");
    assert.equal(ae.note, null);
    assert.match(ae.url, /^\/guides\/flood-zones-and-elevation-certificates-on-the-suncoast#/);
    const a = floodGuidePiece(GUIDES, { zone: "A", subtype: null, sfha: true, bfe: null, datum: null })!;
    assert.ok(a.note);
  });
  test("the hurricane guide's line on the two maps", () => {
    const e = evacGuidePiece(GUIDES)!;
    assert.match(e.url, /#evacuation-zone-vs-flood-zone$/);
    assert.ok(e.lead.length > 20);
  });
  test("the page's words pass the Fair Housing check", () => {
    for (const s of checkStrings()) assert.equal(checkFairHousing(s.text).passed, true, s.where);
  });
});

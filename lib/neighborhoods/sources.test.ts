import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { archivedCopy, checkedOn, describeSupports, publisherOf, sourceLine } from "./sources";

describe("describing what a source supports", () => {
  it("turns field keys into short labels and drops the research notes", () => {
    assert.equal(describeSupports("existence,parent (Country Club North roster),hoa,cdd"), "Exists and name, Where it sits, Association, Community development district");
    assert.equal(describeSupports("zips,jurisdiction,zonedSchools.checkedAddress"), "ZIP and address point, Jurisdiction, Address point for schools");
    assert.equal(describeSupports("lat,lng"), "Map location");
    assert.equal(describeSupports("county,aliases (DEVELOPMENT_NAME 'Palmer's Creek at Lakewood Ranch Country Club')"), "ZIP and address point, Exists and name");
  });
  it("keeps one label per field however many keys map to it", () => {
    assert.equal(describeSupports("existence,name,lat,lng,hoa.website"), "Exists and name, Map location, Association");
    assert.equal(describeSupports("status (Now Selling; 'Only 9 single family home opportunities remain'),activeBuilders,homeTypes,amenities"), "Selling status, Builders, Home types, Amenities");
  });
  it("survives a bracket that never closes and reads nothing into GIS attribute names", () => {
    assert.equal(describeSupports("jurisdiction (location lies outside the City of Sarasota municipal-boundary extent -82.5911..-82.4785 / 27.2929..27.3895"), "Jurisdiction");
    assert.equal(describeSupports("district listing - NOT VERIFIED (state site returns 403 to automated fetch; NEEDS BROWSER)"), "Community development district");
    assert.equal(describeSupports("INC."), "Record details");
    assert.equal(describeSupports(""), "Record details");
  });
  it("never surfaces the age field", () => {
    assert.equal(describeSupports("ageRestricted"), "Record details");
    assert.equal(describeSupports("amenities; ageRestricted checked - no age text found"), "Amenities");
  });
});

describe("naming the publisher", () => {
  it("knows the county and city map services by their organization", () => {
    assert.equal(publisherOf("https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/ADDRESS_POINTS/FeatureServer/2"), "Manatee County GIS");
    assert.equal(publisherOf("https://www.mymanatee.org/giscomm/rest/services/communityneighborhood/neighborhoods/MapServer/0"), "Manatee County GIS");
    assert.equal(publisherOf("https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level"), "Manatee County");
    assert.equal(publisherOf("https://ags3.scgov.net/server/rest/services/Hosted/AddressPoint/FeatureServer/0"), "Sarasota County GIS");
    assert.equal(publisherOf("https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0"), "Sarasota County GIS");
    assert.equal(publisherOf("https://services3.arcgis.com/AWDwYUpli8WqpWxQ/arcgis/rest/services/Neighborhoods/FeatureServer/0"), "City of Sarasota GIS");
    assert.equal(publisherOf("https://services6.arcgis.com/wl0q8tN2gn8MMx1p/arcgis/rest/services/complexes_CoB_pt/FeatureServer/0"), "City of Bradenton GIS");
  });
  it("names builders and falls back to the host", () => {
    assert.equal(publisherOf("https://www.kbhome.com/new-homes-sarasota-bradenton/sawgrass-lakes-ii"), "KB Home");
    assert.equal(publisherOf("https://www.lakewoodranch.com/wp-content/uploads/x.pdf"), "Lakewood Ranch");
    assert.equal(publisherOf("https://countryclubeasthoa.sites.townsq.io/x"), "countryclubeasthoa.sites.townsq.io");
    assert.equal(publisherOf("not a url"), "not a url");
  });
  it("reads through a Wayback copy to the original publisher", () => {
    assert.equal(publisherOf("http://web.archive.org/web/20260606110332/https://www.kbhome.com/new-homes-sarasota-bradenton/sawgrass-lakes-ii"), "KB Home");
  });
});

describe("archived copies and dates", () => {
  it("recognizes a Wayback link and its snapshot date", () => {
    assert.deepEqual(archivedCopy("http://web.archive.org/web/20260405190600/https://www.mihomes.com/new-homes/x"), { original: "https://www.mihomes.com/new-homes/x", snapshot: "2026-04-05" });
    assert.equal(archivedCopy("https://www.mihomes.com/new-homes/x"), null);
  });
  it("formats the checked date the way the site writes dates", () => {
    assert.equal(checkedOn("2026-09-23"), "Sep 23, 2026");
    assert.equal(checkedOn("not-a-date"), "not-a-date");
  });
  it("prints one line per source", () => {
    const line = sourceLine({ url: "http://web.archive.org/web/20260606110332/https://www.kbhome.com/x", supports: "existence,name,status", checked: "2026-09-22", sourceDate: null });
    assert.equal(line.publisher, "KB Home");
    assert.equal(line.supports, "Exists and name, Selling status");
    assert.equal(line.checked, "Sep 22, 2026");
    assert.equal(line.archived?.snapshot, "2026-06-06");
  });
});

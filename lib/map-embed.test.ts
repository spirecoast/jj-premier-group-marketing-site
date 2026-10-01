import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_MAP_QUERY, mapEmbedUrl, mapLinkUrl, mapQuery } from "./map-embed";

const settings = { brokerageName: "Coldwell Banker Realty", officeAddress: { street: "", city: "Lakewood Ranch", state: "FL", zip: "" } };

describe("the map on /contact", () => {
  it("searches for the office address once it is filled in", () => {
    const q = mapQuery({ ...settings, officeAddress: { street: "1 Main St, Suite 2", city: "Lakewood Ranch", state: "FL", zip: "34202" } }, "ignored");
    assert.equal(q, "Coldwell Banker Realty, 1 Main St, Suite 2, Lakewood Ranch, FL 34202");
  });

  it("falls back to NEXT_PUBLIC_MAP_QUERY, then to the brokerage in Lakewood Ranch", () => {
    assert.equal(mapQuery(settings, "Coldwell Banker Realty, Sarasota, FL"), "Coldwell Banker Realty, Sarasota, FL");
    assert.equal(mapQuery(settings, "  "), DEFAULT_MAP_QUERY);
    assert.equal(mapQuery(settings, undefined), DEFAULT_MAP_QUERY);
  });

  it("builds the keyless embed and the plain link", () => {
    assert.equal(mapEmbedUrl("A, B"), "https://www.google.com/maps?q=A%2C%20B&output=embed");
    assert.equal(mapLinkUrl("A, B"), "https://www.google.com/maps/search/?api=1&query=A%2C%20B");
  });
});

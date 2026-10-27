import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TITLE_PX, clampDescription, composeTitle, pageMetadata, titleWidth } from "./seo";
import { curly } from "./typography";

describe("search snippet lengths", () => {
  test("a description that fits is left alone", () => {
    assert.equal(clampDescription("Short and whole."), "Short and whole.");
  });

  test("a long description ends at its last whole sentence that fits", () => {
    const text = `${"One sentence that runs on for a while. ".repeat(3)}A last one that would not fit in the space left over at all.`;
    const out = clampDescription(text);
    assert.ok(out.length <= 158);
    assert.ok(out.endsWith("while."));
  });

  test("with no sentence break, it ends at a whole word with an ellipsis", () => {
    const out = clampDescription("word ".repeat(60).trim());
    assert.ok(out.length <= 159);
    assert.ok(out.endsWith("word…"));
  });

  test("a long title keeps the team's name and gives up its qualifier, or stands alone", () => {
    const short = pageMetadata({ title: "Guides", description: "x", path: "/guides" });
    assert.equal(short.title, "Guides");
    const qualified = pageMetadata({ title: "A very long event title", titleQualifiers: ["At a venue with a rather long name"], description: "x", path: "/calendar/x" });
    assert.equal(qualified.title, "A very long event title");
    const long = pageMetadata({ title: "A very long event title written by hand · At a venue with a long name", description: "x", path: "/calendar/x" });
    assert.deepEqual(long.title, { absolute: "A very long event title written by hand · At a venue with a long name" });
  });
});

describe("one title template", () => {
  test("the team's name follows a title that fits with it", () => {
    assert.equal(composeTitle("Flood zones and flood insurance, explained"), "Flood zones and flood insurance, explained");
    assert.equal(pageMetadata({ title: "Encore Planner: your nights out, day by day", description: "x", path: "/calendar/plan" }).title, "Encore Planner: your nights out, day by day");
  });

  test("qualifiers give way before the team's name does", () => {
    assert.equal(composeTitle("Arboreal", ["Sarasota", "Condominium community"]), "Arboreal · Sarasota · Condominium community");
    assert.equal(composeTitle("Riverview Pointe Estates Waterfront", ["Lakewood Ranch › Greenbrook", "Gated community"]), "Riverview Pointe Estates Waterfront");
    const venue = composeTitle("A Midsummer Night’s Dream, in the round", ["Florida Studio Theatre Gompertz"]);
    assert.equal(venue, "A Midsummer Night’s Dream, in the round");
  });

  test("a title too long to share the line stands alone, keeping the qualifiers that fit", () => {
    const long = "Hurricane season, evacuation zones and the 2024 storms, explained";
    assert.deepEqual(composeTitle(long), { absolute: long });
    assert.ok(titleWidth(`${long} · JJ Premier Group`) > TITLE_PX);
  });

  test("an absolute title is kept as written, with curly quotes", () => {
    assert.deepEqual(composeTitle("JJ Premier Group · Joelyn's page", [], true), { absolute: "JJ Premier Group · Joelyn’s page" });
  });

  test("titles and descriptions come out with curly quotes, and the share title keeps every qualifier", () => {
    const m = pageMetadata({ title: "Tide Sale Calculator: what you'd keep", titleQualifiers: ["Sarasota", undefined], description: "What you'd keep, in \"plain\" numbers.", path: "/x" });
    assert.equal(m.title, "Tide Sale Calculator: what you’d keep"); // the qualifier gives way to the team’s name
    assert.equal(m.description, "What you’d keep, in “plain” numbers.");
    assert.equal((m.openGraph as { title: string }).title, "Tide Sale Calculator: what you’d keep · Sarasota");
  });
});

describe("curly quotes", () => {
  test("apostrophes, elisions and quotations", () => {
    assert.equal(curly("don't stop"), "don’t stop");
    assert.equal(curly("the '90s and 'til then"), "the ’90s and ’til then");
    assert.equal(curly("the Smiths' house"), "the Smiths’ house");
    assert.equal(curly("a 'quoted' word"), "a ‘quoted’ word");
    assert.equal(curly('He said "Sold" (twice)'), "He said “Sold” (twice)");
    assert.equal(curly("Already ’curly’"), "Already ’curly’");
  });
});

describe("a clamped description", () => {
  test("doesn't end a sentence at an abbreviation", () => {
    const text = "A National Register-listed historic streetscape on St. Armands Key made up of the central park of St. Armands Circle and the shops around it. More words follow here.";
    assert.equal(clampDescription(text), "A National Register-listed historic streetscape on St. Armands Key made up of the central park of St. Armands Circle and the shops around it.");
  });
});

describe("the team in structured data", () => {
  test("each agent has a page address, the team, and sameAs only from real profiles", async () => {
    const { personJsonLd, organizationJsonLd } = await import("./seo");
    const { TEAM } = await import("./content/seed/team");
    const { SITE_SETTINGS } = await import("./content/seed/settings");
    const joelyn = personJsonLd(TEAM[0]!, SITE_SETTINGS) as Record<string, unknown>;
    assert.match(String(joelyn.url), /\/about#joelyn-nauman$/);
    assert.deepEqual(joelyn.sameAs, ["https://www.coldwellbankerhomes.com/fl/lakewood-ranch/agent/joelyn-nauman/aid_271042/"]);
    const jessica = personJsonLd(TEAM[1]!, SITE_SETTINGS) as Record<string, unknown>;
    assert.equal(jessica.sameAs, undefined);
    const org = organizationJsonLd(SITE_SETTINGS, TEAM) as { areaServed: { "@type": string }[]; knowsAbout: string[] };
    assert.deepEqual(org.areaServed.map((a) => a["@type"]), ["City", "City", "City", "AdministrativeArea", "AdministrativeArea"]);
    assert.ok(org.knowsAbout.length > 0);
  });
});

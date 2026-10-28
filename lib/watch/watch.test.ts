import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { LEAD_GOAL } from "../leads/constants";
import { validateLead, LEAD_MESSAGES } from "../leads/rules";
import { parseLead, watchTargetFrom } from "../leads/schema";
import { watchSigningId, watchUnsubscribeLinks, subscriptionSigningId } from "../newsletter/headers";
import { listsForLead } from "../newsletter/lists";
import { signToken, verifyToken } from "../newsletter/token";
import { watchStrings } from "./copy";
import { digestEmail, saleLine, watchConfirmationEmail, type DigestSection } from "./emails";
import { onStreet, placeTarget, streetLabel, streetTarget, tideStreetPath } from "./target";

const FOOTER = {
  siteUrl: "https://jjpremiergroup.com",
  domain: "jjpremiergroup.com",
  teamName: "JJ Premier Group",
  brokerageName: "Coldwell Banker Realty",
  officeAddress: { street: "8200 Lakewood Ranch Blvd", city: "Lakewood Ranch", state: "FL", zip: "34202" },
  phoneDisplay: "(941) 555-0100",
};

describe("what a Street Watch watches", () => {
  it("keeps the street as the county spells it, with its ZIP", () => {
    assert.deepEqual(streetTarget("lilac sky  ter", "34211"), { kind: "street", street: "LILAC SKY TER", zip: "34211", key: "street:LILAC SKY TER|34211", label: "Lilac Sky Ter · 34211" });
    assert.equal(streetTarget("Lilac Sky Ter", "3421"), null);
    assert.equal(streetTarget("x", "34211"), null);
    assert.equal(streetLabel("69TH ST NW"), "69th St NW");
    assert.equal(streetLabel("N TAMIAMI TRL"), "N Tamiami Trl");
  });

  it("takes a place by its slug, never a city set or junk", () => {
    assert.deepEqual(placeTarget("the-lake-club", "The Lake Club"), { kind: "place", slug: "the-lake-club", name: "The Lake Club", key: "place:the-lake-club", label: "The Lake Club" });
    assert.equal(placeTarget("city:34211-34202", "Bradenton"), null);
    assert.equal(placeTarget("the-lake-club", ""), null);
    assert.equal(placeTarget("../etc", "x"), null);
  });

  it("matches a sale on the street and ZIP, and links Tide Street to it", () => {
    const t = streetTarget("Lilac Sky Ter", "34211")!;
    if (t.kind !== "street") throw new Error("street");
    assert.equal(onStreet(t, { predir: "", street: "LILAC SKY", suffix: "TER", postdir: "", zip: "34211" }), true);
    assert.equal(onStreet(t, { predir: "", street: "LILAC SKY", suffix: "TER", postdir: "", zip: "34202" }), false);
    assert.equal(onStreet(t, { predir: "", street: "LILAC SKY", suffix: "DR", postdir: "", zip: "34211" }), false);
    assert.equal(tideStreetPath(t), "/sell/sold?street=Lilac+Sky+Ter&zip=34211");
    assert.equal(tideStreetPath(placeTarget("aurora", "Aurora")!), "/sell/sold?place=aurora");
  });
});

describe("the Watch form", () => {
  it("is email only, counts as a subscribe, and never signs anyone up for Tide", () => {
    assert.equal(validateLead("watch", { email: "" }).email, LEAD_MESSAGES.emailRequired);
    assert.deepEqual(validateLead("watch", { email: "pat@example.com" }), {});
    assert.equal(LEAD_GOAL.watch, "Subscribe");
    assert.deepEqual(listsForLead("watch", true), []);
  });

  it("needs a street and ZIP, or a place, and refuses a tampered target", () => {
    const ok = parseLead({ form: "watch", email: "Pat@Example.com", watchStreet: "LILAC SKY TER", watchZip: "34211" });
    assert.ok(ok.ok);
    if (ok.ok) assert.deepEqual(watchTargetFrom(ok.data)?.key, "street:LILAC SKY TER|34211");
    const place = parseLead({ form: "watch", email: "pat@example.com", watchPlace: "the-lake-club", watchName: "The Lake Club" });
    assert.ok(place.ok);
    const none = parseLead({ form: "watch", email: "pat@example.com" });
    assert.equal(none.ok, false);
    if (!none.ok) assert.deepEqual(none.hidden, ["watchStreet"]);
    const bad = parseLead({ form: "watch", email: "pat@example.com", watchPlace: "<script>", watchName: "x" });
    assert.equal(bad.ok, false);
  });
});

describe("Street Watch links", () => {
  it("signs a watch apart from a subscription, and confirms with its own purpose", () => {
    assert.notEqual(watchSigningId("abc"), subscriptionSigningId("abc"));
    const links = watchUnsubscribeLinks("https://jjpremiergroup.com/", "w-1", "sig");
    assert.equal(links.one, "https://jjpremiergroup.com/unsubscribe?w=w-1&sig=sig&list=watch");
    assert.equal(links.oneClick, "https://jjpremiergroup.com/api/newsletter/unsubscribe?w=w-1&sig=sig&list=watches");
    const secret = "x".repeat(40);
    const token = signToken({ p: "watch", w: "11111111-1111-1111-1111-111111111111" }, secret, 60);
    assert.equal(verifyToken(token, secret, "watch").ok, true);
    assert.deepEqual(verifyToken(token, secret, "confirm"), { ok: false, reason: "purpose" });
  });
});

describe("Street Watch emails", () => {
  const section = (over: Partial<DigestSection> = {}): DigestSection => ({
    label: "Lilac Sky Ter · 34211",
    kind: "street",
    sales: [
      { address: "14447 Lilac Sky Ter", saleDate: "2026-08-28", salePrice: 275000, pricePerSqft: null, newBuild: true },
      { address: "14451 Lilac Sky Ter", saleDate: "2026-08-20", salePrice: 412000, pricePerSqft: 214, newBuild: false },
    ],
    more: 0,
    median: { value: 405000, count: 14 },
    zipBasis: null,
    openUrl: "https://jjpremiergroup.com/sell/sold?street=Lilac+Sky+Ter&zip=34211",
    stopUrl: "https://jjpremiergroup.com/unsubscribe?w=w-1&sig=s&list=watch",
    ...over,
  });

  it("writes one sale on one line", () => {
    assert.equal(saleLine(section().sales[1]!), "14451 Lilac Sky Ter · sold Aug 20, 2026 · $412,000 · $214 per sq ft");
    assert.equal(saleLine(section().sales[0]!), "14447 Lilac Sky Ter · sold Aug 28, 2026 · $275,000 · new build or lot");
  });

  it("builds the confirmation with its button, its expiry and why the reader has it", () => {
    const e = watchConfirmationEmail({ label: "Lilac Sky Ter · 34211", confirmUrl: "https://jjpremiergroup.com/watch/confirm?t=abc", footer: FOOTER, ttlDays: 7 });
    assert.equal(e.subject, "Please confirm: Street Watch for Lilac Sky Ter · 34211");
    assert.match(e.html, /watch\/confirm\?t=abc/);
    assert.match(e.text.replace(/\s+/g, " "), /The button works for 7 days/);
    assert.match(e.text, /8200 Lakewood Ranch Blvd/);
    assert.equal(checkFairHousing(`${e.subject}\n${e.html}\n${e.text}`).passed, true);
  });

  it("builds the digest: each section, the medians, the through-dates, every stop link, and passes the Fair Housing check", () => {
    const e = digestEmail({
      sections: [section(), section({ label: "The Lake Club", kind: "place", more: 3, median: null, zipBasis: ["34202"], stopUrl: "https://jjpremiergroup.com/unsubscribe?w=w-2&sig=s&list=watch" })],
      through: [{ county: "Manatee", to: "2026-09-24" }],
      footer: FOOTER,
      links: { watches: "https://jjpremiergroup.com/unsubscribe?w=w-1&sig=s&list=watches", all: "https://jjpremiergroup.com/unsubscribe?w=w-1&sig=s&list=all" },
      campaign: "watch-2026-10-25",
    });
    assert.equal(e.subject, "New on the record: Lilac Sky Ter · 34211 and 1 more");
    assert.match(e.preheader, /^7 sales the county recorded/);
    const flat = e.text.replace(/\s+/g, " ");
    assert.match(flat, /Median resale on this street over the last 12 months: \$405,000 \(14 sales\)\./);
    assert.match(flat, /And 3 more on Tide Street\./);
    assert.match(flat, /Sales in the 34202 ZIP area/);
    assert.match(flat, /Manatee records through September 24, 2026\./);
    assert.match(e.html, /list=watches/);
    assert.match(e.html, /list=all/);
    assert.match(e.html, /w=w-2&amp;sig=s&amp;list=watch/);
    assert.match(e.html, /utm_source=street-watch/);
    assert.equal(checkFairHousing(`${e.subject}\n${e.html}\n${e.text}`).passed, true);
  });

  it("keeps every sentence it uses free of Fair Housing flags", () => {
    for (const s of watchStrings()) assert.equal(checkFairHousing(s.text).passed, true, s.where);
  });
});

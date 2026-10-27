import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildEncore, encoreEvents, encoreVenues, JSON_SNAPSHOT, lookupEncoreEvent, unlistedEncoreVenue } from "../content/encore";
import type { Event } from "../content/types";
import { eventJsonLd, eventListJsonLd } from "../seo";
import { eventSlug, isClippedSlug, publicSlugs, slugify } from "./slug";
import { cardEndsAt, eventSpan, isCurrent } from "./fresh";
import { unlistedVenue } from "./venue-rules";
import { pruneCutoffs } from "./prune";
import { datasetToStore } from "./store/convert";
import { sinceSnapshot } from "./store/store";
import type { EncoreSnapshot } from "./store/types";

describe("event slugs", () => {
  test("a long title is cut at a word, never mid-word, and never ends on a little word", () => {
    const s = slugify("Seventeenth-Century Dutch Paintings from the Museum of Fine Arts, Boston");
    assert.equal(s, "seventeenth-century-dutch-paintings-from-the-museum-of-fine-arts");
    assert.ok(s.length <= 64);
    assert.equal(slugify("Behind the Curtain: Exploring the Van Wezel from the Art to the Stage"), "behind-the-curtain-exploring-the-van-wezel-from-the-art");
    assert.equal(slugify("Dracula"), "dracula");
  });

  test("a new production's slug always ends in its month", () => {
    assert.equal(eventSlug("Harmony Gallery: Voices of Color - Alicia Brown, Greg Cruz and Ronnique Hawkins", "2026-09-22"), "harmony-gallery-voices-of-color-alicia-brown-greg-cruz-2026-09");
    assert.equal(eventSlug("The Nutcracker (Dec 22, 2026)", "2026-12-22"), "the-nutcracker-2026-12");
  });

  test("clipped slugs are the ones without a month at the end", () => {
    assert.equal(isClippedSlug("seventeenth-century-dutch-paintings-from-the-museum-of-fine-arts-bosto"), true);
    assert.equal(isClippedSlug("conversations-by-the-beach-modern-works-festival-staged-reading-2026-0"), true);
    assert.equal(isClippedSlug("prospects-for-middle-east-peace-and-security-in-2027-amb-dennis-ross-2"), true);
    assert.equal(isClippedSlug("the-nutcracker-2026-12-2"), false);
    assert.equal(isClippedSlug("dracula-2026-10"), false);
  });

  test("every clipped slug in the dataset gets one clean, unique slug; the rest keep theirs", () => {
    const map = publicSlugs(JSON_SNAPSHOT.events);
    assert.ok(map.size >= 51, `only ${map.size} clipped slugs`);
    const stored = new Set(JSON_SNAPSHOT.events.map((e) => e.slug));
    const clean = [...map.values()];
    assert.equal(new Set(clean).size, clean.length, "two clipped slugs share a clean one");
    for (const [from, to] of map) {
      assert.ok(isClippedSlug(from));
      assert.ok(!isClippedSlug(to), to);
      assert.ok(!stored.has(to), `${to} is already another event's slug`);
    }
    // Two talks of the same name in one month: the second keeps its -2.
    assert.equal(map.get("donald-trump-in-war-and-peace-the-47th-president-in-historical-perspec"), "donald-trump-in-war-and-peace-the-47th-president-in-historical-2027-01");
    assert.equal(map.get("donald-trump-in-war-and-peace-the-47th-president-in-historical-perspec-2"), "donald-trump-in-war-and-peace-the-47th-president-in-historical-2027-01-2");
  });

  test("the site serves the clean slug, and the clipped one answers a redirect to it", () => {
    const slugs = new Set(buildEncore(JSON_SNAPSHOT).events.map((e) => e.slug));
    for (const s of slugs) assert.ok(!isClippedSlug(s), s);
    const old = "seventeenth-century-dutch-paintings-from-the-museum-of-fine-arts-bosto";
    const moved = lookupEncoreEvent(old, new Date("2026-10-27T12:00:00Z"));
    assert.deepEqual(moved, { kind: "moved", slug: "seventeenth-century-dutch-paintings-from-the-museum-of-fine-arts-2025-04" });
  });
});

describe("venues without a page", () => {
  test("placeholders and a private home are recognised; real venues are not", () => {
    const v = (key: string, name: string | null, extra: Partial<{ type: string; address: string; notes: string }> = {}) => ({ key, name, type: extra.type ?? null, address: extra.address ?? null, notes: extra.notes ?? null });
    assert.equal(unlistedVenue(v("tbd-sarasota", "Venue TBD (Sarasota)")), "tbd");
    assert.equal(unlistedVenue(v("various-sarasota", "Various venues, Sarasota")), "tbd");
    assert.equal(unlistedVenue(v("venue-tbd", null)), "tbd");
    assert.equal(unlistedVenue(v("fischer-weisenborne-residence", "Fischer/Weisenborne Residence")), "private");
    assert.equal(unlistedVenue(v("smith-home", "Home of Pat Smith")), "private");
    for (const venue of encoreVenues()) assert.equal(venue.unlisted, undefined, venue.slug);
  });

  test("no venue page, filter or sitemap entry for them, and no street on their events", () => {
    const slugs = new Set(encoreVenues().map((v) => v.slug));
    for (const k of ["tbd-sarasota", "various-sarasota", "fischer-weisenborne-residence", "venue-tbd"]) assert.ok(!slugs.has(k), k);
    assert.equal(unlistedEncoreVenue("fischer-weisenborne-residence")?.market, "sarasota");
    const home = buildEncore(JSON_SNAPSHOT).events.filter((e) => e.venue.slug === "fischer-weisenborne-residence");
    assert.equal(home.length, 3);
    for (const e of home) {
      assert.equal(e.venue.unlisted, "private");
      assert.equal(e.venue.name, "A private home");
      assert.equal(e.venue.address.street, "");
      assert.equal(e.venue.address.city, "Sarasota");
      assert.ok(!JSON.stringify(e).includes("Cabbage Palm"), "the street address leaks");
      assert.ok(!JSON.stringify(e).includes("Weisenborne"), "the family name leaks");
    }
    const tbd = buildEncore(JSON_SNAPSHOT).events.find((e) => e.slug === "2x2-piano-percussion-2027-03");
    assert.equal(tbd?.venue.name, "Venue to be announced");
  });
});

describe("an event after its last date", () => {
  const snap = (): EncoreSnapshot => ({
    ...datasetToStore({
      venues: [{ key: "van-wezel", name: "Van Wezel Performing Arts Hall", type: "hall", address: "777 N Tamiami Trl, Sarasota, FL 34236", city: "Sarasota", market: "sarasota", website: null, eventsUrl: null, residentCompanies: [], notes: null }],
      events: [
        {
          slug: "spooktacular-2026-10",
          title: "Spooktacular",
          presenter: null,
          market: "sarasota",
          category: "music",
          siteCategory: "music",
          subcategory: "concert",
          venueKey: "van-wezel",
          venueName: "Van Wezel",
          room: null,
          city: "Sarasota",
          startDate: "2026-10-25",
          endDate: null,
          startTime: "19:30",
          nextDate: "2026-10-25",
          nextTime: "19:30",
          performances: [{ date: "2026-10-25", time: "19:30" }],
          recurrence: null,
          price: "$25",
          ticketUrl: null,
          sources: ["https://www.vanwezel.org/events/spooktacular"],
          description: "A Halloween concert.",
          status: "scheduled",
          notes: null,
        },
      ],
    }),
    generatedAt: "2026-10-01T00:00:00Z",
    origin: "db",
    images: [],
  });

  test("the night of the show it's live; the morning after, its address is still there, closed", () => {
    const s = snap();
    assert.equal(lookupEncoreEvent("spooktacular-2026-10", new Date("2026-10-25T20:00:00Z"), s)?.kind, "live");
    const after = lookupEncoreEvent("spooktacular-2026-10", new Date("2026-10-26T13:00:00Z"), s);
    assert.equal(after?.kind, "closed");
    assert.equal(after && "event" in after ? after.event.startsAt : "", "2026-10-25T23:30:00.000Z");
    assert.equal(lookupEncoreEvent("never-listed-2026-10", new Date("2026-10-26T13:00:00Z"), s), undefined);
  });
});

describe("cards that have ended", () => {
  const ev = (o: Partial<Event>) => ({ startsAt: "2026-10-25T23:30:00.000Z", ...o }) as Event;

  test("a show ends at its end time, an all-day date at the end of its day, a run on its last day", () => {
    assert.equal(cardEndsAt(ev({ endsAt: "2026-10-26T01:30:00.000Z" })), "2026-10-26T01:30:00.000Z");
    assert.equal(cardEndsAt(ev({ startsAt: "2026-10-25T16:00:00.000Z", allDay: true })), "2026-10-26T04:00:00.000Z");
    assert.equal(cardEndsAt(ev({ startsAt: "2026-10-27T16:00:00.000Z", allDay: true, runsThrough: "2026-11-30" })), "2026-12-01T04:00:00.000Z");
    assert.equal(isCurrent("2026-10-26T01:30:00.000Z", Date.parse("2026-10-26T13:00:00Z")), false);
    assert.equal(isCurrent("2026-12-01T04:00:00.000Z", Date.parse("2026-10-26T13:00:00Z")), true);
  });

  test("a heading's span covers the cards it sits over", () => {
    assert.equal(eventSpan(["2026-11-06T23:00:00Z", "2026-11-13T23:00:00Z"]), ", Nov 6 to 13");
    assert.equal(eventSpan([]), "");
  });
});

describe("Event markup", () => {
  const NOW = new Date("2026-10-27T12:00:00Z");
  const base: Event = {
    _id: "e",
    title: "The Farmers Market at Lakewood Ranch",
    slug: "the-farmers-market-at-lakewood-ranch-2026-09",
    summary: "Sundays on Main Street.",
    startsAt: "2026-11-01T13:00:00.000Z",
    endsAt: "2026-11-01T17:00:00.000Z",
    venue: { name: "Main Street", slug: "main-street-lwr", market: "lakewood-ranch", address: { street: "Main St", city: "Lakewood Ranch", state: "FL", zip: "34202" } },
    category: "market",
    featured: false,
    priceNote: "$20",
    performances: ["2026-09-27", "2026-10-04", "2026-10-25", "2026-11-01", "2026-11-08"].map((d) => ({ startsAt: `${d}T13:00:00.000Z`, endsAt: `${d}T17:00:00.000Z` })),
  };

  test("only dates still ahead are subEvents, and startDate is the next one", () => {
    const ld = eventJsonLd(base, NOW) as Record<string, unknown> & { subEvent: { startDate: string }[] };
    assert.equal(ld.startDate, "2026-11-01T13:00:00.000Z");
    assert.deepEqual(
      ld.subEvent.map((s) => s.startDate),
      ["2026-11-01T13:00:00.000Z", "2026-11-08T13:00:00.000Z"],
    );
  });

  test("offers point at a ticket page, or are left out; never at the event page itself", () => {
    assert.equal(eventJsonLd(base, NOW).offers, undefined);
    const ticketed = eventJsonLd({ ...base, ticketUrl: "https://tickets.example.org/market" }, NOW).offers as { url: string };
    assert.equal(ticketed.url, "https://tickets.example.org/market");
  });

  test("an exhibition is an ExhibitionEvent over its run; a cancellation says so", () => {
    const show = eventJsonLd({ ...base, category: "gallery", subcategory: "exhibition", performances: [], firstDate: "2026-09-01", runsThrough: "2027-01-10", allDay: true }, NOW);
    assert.equal(show["@type"], "ExhibitionEvent");
    assert.equal(show.startDate, "2026-09-01");
    assert.equal(show.endDate, "2027-01-10");
    assert.equal(eventJsonLd({ ...base, status: "cancelled" }, NOW).eventStatus, "https://schema.org/EventCancelled");
  });

  test("a private home is named by its town only", () => {
    const ld = eventJsonLd({ ...base, venue: { name: "A private home", slug: "x-residence", market: "sarasota", unlisted: "private", address: { street: "", city: "Sarasota", state: "FL", zip: "" } } }, NOW);
    assert.deepEqual((ld.location as { name: string }).name, "Sarasota, FL");
    assert.equal((ld.location as { address: { streetAddress?: string } }).address.streetAddress, undefined);
  });

  test("the calendar's ItemList links each event page in order", () => {
    const list = eventListJsonLd([
      { slug: "a-2026-11", title: "A" },
      { slug: "b-2026-11", title: "B" },
    ]);
    assert.equal(list.numberOfItems, 2);
    assert.equal(list.itemListElement[1]!.position, 2);
    assert.ok(list.itemListElement[0]!.url.endsWith("/calendar/a-2026-11"));
  });
});

describe("what pages load, and what the weekly prune removes", () => {
  test("a page's snapshot keeps dates from the cut-off on, productions with one, and runs that reach it", () => {
    const cut = sinceSnapshot(JSON_SNAPSHOT, "2026-12-01");
    assert.ok(cut.events.length < JSON_SNAPSHOT.events.length);
    for (const e of cut.events) {
      const original = JSON_SNAPSHOT.events.find((x) => x.slug === e.slug)!;
      if (original.performances.length) {
        assert.ok(e.performances.length > 0, e.slug);
        for (const p of e.performances) assert.ok(p.date >= "2026-12-01");
      } else assert.ok((e.endDate ?? e.startDate) >= "2026-12-01", e.slug);
    }
    // Nothing a page shows from that day on is lost.
    const from = new Date("2026-12-01T12:00:00Z");
    assert.deepEqual(
      encoreEvents(from, cut).map((e) => e.slug),
      encoreEvents(from, JSON_SNAPSHOT).map((e) => e.slug),
    );
  });

  test("the prune keeps 13 months of dates and 90 days of readings", () => {
    const { before, checksBefore } = pruneCutoffs(new Date("2027-11-02T12:00:00Z"));
    assert.equal(before, "2026-10-02");
    assert.equal(checksBefore.toISOString(), "2027-08-04T12:00:00.000Z");
  });
});

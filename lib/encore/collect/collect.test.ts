import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { ADAPTERS } from "./adapters";
import { readMpac } from "./adapters/mpac";
import { datesFromText, pageTitle, slugTitle } from "./adapters/pages";
import { readSill } from "./adapters/sill";
import { readTicketSpice } from "./adapters/ticketspice";
import { tnewAvailability } from "./adapters/tnew";
import { readVanWezelCards } from "./adapters/vanwezel";
import { inferYear, isoToLocal, parseAllMonthDays, parseDateRange, parseMonthDay, parseTime } from "./dates";
import { parseHtml } from "./html";
import { fixtureFetcher, politeFetcher, robotsAllows, robotsRules } from "./http";
import { looksLikeArt } from "./images";
import { buildMatcher, titleSimilarity, urlKeys } from "./match";
import { formatPrice, parsePrice } from "./price";
import { fingerprint, reconcile } from "./reconcile";
import { sourceById, sourceForUrl, SOURCES, type SourceSpec } from "./sources";
import type { AdapterContext, CollectedEvent } from "./types";
import { groupEvents, normUrl, stripDateSuffix, upcoming } from "./util";
import type { StoreEvent } from "../store/types";

const FX = join(__dirname, "__fixtures__");
const fx = (name: string) => readFileSync(join(FX, name), "utf8");
const TODAY = "2026-10-03";
const ctx = (files: Record<string, string>, known: AdapterContext["known"] = [], mode: "collect" | "check" = "collect"): AdapterContext => ({
  fetch: fixtureFetcher(files),
  known,
  mode,
  today: TODAY,
  log: () => {},
});
const src = (id: string, config?: Record<string, unknown>): SourceSpec => {
  const s = sourceById(id)!;
  return { ...s, config: { ...s.config, ...config } };
};

describe("dates", () => {
  test("times as venues print them", () => {
    assert.equal(parseTime("7:30 PM"), "19:30");
    assert.equal(parseTime("7 p.m."), "19:00");
    assert.equal(parseTime("10:30am"), "10:30");
    assert.equal(parseTime("12:00 pm"), "12:00");
    assert.equal(parseTime("noon"), "12:00");
    assert.equal(parseTime("19:30"), "19:30");
    assert.equal(parseTime("Doors open"), undefined);
  });
  test("ISO with and without an offset", () => {
    assert.deepEqual(isoToLocal("2026-10-03T19:30:00.0000000-04:00"), { date: "2026-10-03", time: "19:30" });
    assert.deepEqual(isoToLocal("2026-10-03T23:30:00Z"), { date: "2026-10-03", time: "19:30" });
    assert.deepEqual(isoToLocal("2026-12-03T00:30:00Z"), { date: "2026-12-02", time: "19:30" });
    assert.deepEqual(isoToLocal("2026-10-03 11:00:00"), { date: "2026-10-03", time: "11:00" });
    assert.deepEqual(isoToLocal("2026-10-03"), { date: "2026-10-03", time: "" });
  });
  test("a year is inferred forward from today", () => {
    assert.equal(inferYear(1, 4, TODAY), 2027);
    assert.equal(inferYear(10, 8, TODAY), 2026);
    assert.equal(inferYear(9, 1, TODAY), 2026);
    assert.equal(parseMonthDay("Thursday, October 08 at 7:00 PM", TODAY), "2026-10-08");
    assert.equal(parseMonthDay("Jan 5-6", TODAY), "2027-01-05");
  });
  test("ranges", () => {
    assert.deepEqual(parseDateRange("Oct 20 - 25, 2026", TODAY), { start: "2026-10-20", end: "2026-10-25" });
    assert.deepEqual(parseDateRange("Oct 30 – Nov 2, 2026", TODAY), { start: "2026-10-30", end: "2026-11-02" });
    assert.deepEqual(parseDateRange("November 18, 2026 - January 3, 2027", TODAY), { start: "2026-11-18", end: "2027-01-03" });
    assert.deepEqual(parseDateRange("Through Jan 3, 2027", TODAY), { end: "2027-01-03" });
    assert.deepEqual(parseDateRange("Sat. Oct 17, 2026", TODAY), { start: "2026-10-17", end: "2026-10-17" });
    assert.deepEqual(parseAllMonthDays("Dec 30 and Jan 2, 2027", TODAY), ["2026-12-30", "2027-01-02"]);
  });
});

describe("prices and urls", () => {
  test("published prices to a range", () => {
    assert.deepEqual(parsePrice("$20 members / $25 non-members / $13 students"), { min: 13, max: 25 });
    assert.deepEqual(parsePrice("$1,500"), { min: 1500, max: 1500 });
    assert.deepEqual(parsePrice("Free (registration required)"), { min: 0, max: 0, free: true });
    assert.deepEqual(parsePrice("See the venue"), {});
    assert.equal(formatPrice(35, 145), "$35–$145");
    assert.equal(formatPrice(0, 0), "Free");
  });
  test("urls compare without www, slash, tracking", () => {
    assert.equal(normUrl("https://www.vanwezel.org/events/detail/boz-scaggs/?utm_source=x#top"), "vanwezel.org/events/detail/boz-scaggs");
    assert.deepEqual(urlKeys("https://tickets.sarasotaopera.org/8545/8554"), ["tickets.sarasotaopera.org/8545/8554", "tickets.sarasotaopera.org/8545"]);
    assert.ok(urlKeys("https://purchase.boxofficecentral.com/EventAvailability?EventId=883&ref=bookNow").includes("boxofficecentral/883"));
  });
  test("titles lose bracketed dates", () => {
    assert.equal(stripDateSuffix("SCF Theatre Presents This Murder Was Staged (Nov. 13)"), "SCF Theatre Presents This Murder Was Staged");
    assert.equal(stripDateSuffix("Dracula (2026)"), "Dracula (2026)");
  });
  test("image urls that are not event art", () => {
    assert.equal(looksLikeArt("https://x.org/wp-content/uploads/2026/logo-white.png"), false);
    assert.equal(looksLikeArt("https://x.org/icon.svg"), false);
    assert.equal(looksLikeArt("https://x.org/uploads/2026/06/Peace-1920x739.png"), true);
  });
});

describe("robots and the polite fetcher", () => {
  test("robots.txt rules for every crawler", () => {
    const r = robotsRules("User-agent: ClaudeBot\nDisallow: /\n\nUser-agent: GPTBot\nUser-agent: *\nDisallow: /api/\nAllow: /api/ui-extensions/\nDisallow:/*?format=json\n");
    assert.equal(robotsAllows(r, "/events"), true);
    assert.equal(robotsAllows(r, "/events?format=json"), false);
    assert.equal(robotsAllows(r, "/api/x"), false);
    assert.equal(robotsAllows(r, "/api/ui-extensions/a"), true);
  });
  test("requests to one host are spaced, robots.txt is read once, blocked paths are refused", async () => {
    const calls: { url: string; at: number }[] = [];
    let clock = 0;
    const fakeFetch = (async (url: string) => {
      calls.push({ url: String(url), at: clock });
      const body = String(url).endsWith("/robots.txt") ? "User-agent: *\nDisallow: /private" : "ok";
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    const f = politeFetcher({ fetchImpl: fakeFetch, sleep: async (ms) => void (clock += ms), now: () => clock, minGapMs: 1000, maxGapMs: 1000 });
    await f("https://a.org/one");
    await f("https://a.org/two");
    await assert.rejects(f("https://a.org/private/x"), /robots\.txt disallows/);
    await assert.rejects(f("https://ticketing.floridastudiotheatre.org/en/production/1"), /robots\.txt disallows/);
    assert.deepEqual(
      calls.map((c) => c.url),
      ["https://a.org/robots.txt", "https://a.org/one", "https://a.org/two"],
    );
    assert.ok(calls[2]!.at - calls[1]!.at >= 1000 && calls[1]!.at - calls[0]!.at >= 1000);
  });
});

describe("generic adapters", () => {
  test("Tribe REST: recurrences fold into one production, all-day spans become runs", async () => {
    const res = await ADAPTERS.tribe!.collect(src("sarasota-art-museum", { exclude: "" }), ctx({ "https://www.sarasotaartmuseum.org/wp-json/tribe/events/v1/events?per_page=50&start_date=2026-10-03&status=publish": fx("tribe-sam.json") }));
    const tour = res.events.find((e) => e.title === "Highlights Tour");
    assert.ok(tour && tour.performances.length >= 2, "the recurring tour is one event with several dates");
    assert.equal(tour!.sourceUrl, "https://www.sarasotaartmuseum.org/event/highlights-tour/");
    assert.ok(res.events.every((e) => e.complete));
    assert.ok(res.events.some((e) => e.imageUrl?.startsWith("https://")));
    assert.ok(res.contentHash);
  });
  test("iCal: Halo Arts' Tribe export", async () => {
    const res = await ADAPTERS.ical!.collect(src("halo-arts"), ctx({ "https://haloartsproject.com/events/?ical=1": fx("ical-halo.ics") }));
    assert.ok(res.events.length >= 3);
    for (const e of res.events) assert.ok(e.performances.length || (e.startDate && e.endDate), e.title);
  });
  test("JSON-LD: Paragon's festival page gives each day with its hours and free admission", () => {
    const html = fx("jsonld-paragon.html");
    const url = "https://www.paragonfestivals.com/festival/st-armands-fall-festival-of-the-arts-2026/";
    return ADAPTERS.jsonld!.collect(src("paragon", { listings: [], pages: [url], linkPattern: undefined }), ctx({ [url]: html })).then((res) => {
      const e = res.events[0]!;
      assert.match(e.title, /St\. Armands Fall Festival/);
      assert.deepEqual(e.performances.map((p) => p.date), ["2026-10-17", "2026-10-18"]);
      assert.equal(e.performances[0]!.time, "10:00");
      assert.equal(e.priceMax, 0);
    });
  });
  test("JSON-LD: a block that names another page is ignored, the page itself is read", async () => {
    const url = "https://keychorale.org/concerts/mass-for-peace/";
    const res = await ADAPTERS.jsonld!.collect(src("key-chorale", { listings: [], pages: [url] }), ctx({ [url]: fx("jsonld-keychorale.html") }));
    assert.equal(res.events.length, 1);
    assert.match(res.events[0]!.title, /Mass for Peace/);
    assert.equal(res.events[0]!.sourceUrl, url);
  });
  test("JSON-LD: the site's name comes off the event's name", async () => {
    const url = "https://www.jazzclubsarasota.org/events/take-6";
    const res = await ADAPTERS.jsonld!.collect(src("jazz-club", { listings: [], pages: [url] }), ctx({ [url]: fx("jsonld-jazzclub.html") }));
    assert.equal(res.events[0]!.title, "Take 6");
    assert.equal(res.events[0]!.performances[0]!.time, "19:00");
  });
  test("pages without structured data: title and run from the text, marked heuristic", async () => {
    const url = "https://www.ringling.org/event/andrea-carlson-a-constant-sky/";
    const res = await ADAPTERS.pages!.collect(src("ringling", { listings: [], pages: [url] }), ctx({ [url]: fx("page-ringling.html") }));
    const e = res.events[0]!;
    assert.equal(e.title, "Andrea Carlson: A Constant Sky");
    assert.equal(e.endDate, "2026-11-15");
    assert.equal(e.heuristic, true);
    assert.ok(e.imageUrl);
  });
  test("a header logo in the h1 is not the title", () => {
    const doc = parseHtml(fx("page-filmsociety.html"));
    assert.equal(pageTitle(doc), "NT Live: Frankenstein");
    assert.deepEqual(slugTitle("https://www.ensrq.org/seasons/s11/2026-10-05-roomful-of-teeth"), { title: "Roomful Of Teeth", date: "2026-10-05" });
    assert.deepEqual(datesFromText("Silent Sky Opens October 9, 2026 at 7:30 pm", "Silent Sky", TODAY), { performances: [{ date: "2026-10-09", time: "19:30" }] });
  });
});

describe("platform adapters", () => {
  test("TNEW: every production with each performance's availability", async () => {
    const base = "https://buy.sarasotaorchestra.org";
    const res = await ADAPTERS.tnew!.collect(src("sarasota-orchestra"), {
      ...ctx({}),
      fetch: async (url, o) => {
        assert.equal(url, `${base}/api/products/productionseasons`);
        assert.equal(o?.method, "POST");
        return { url, status: 200, ok: true, text: fx("tnew-orchestra.json"), headers: {} };
      },
    });
    assert.ok(res.events.length >= 3);
    const e = res.events[0]!;
    assert.match(e.sourceUrl, /^https:\/\/buy\.sarasotaorchestra\.org\/\d+$/);
    assert.ok(e.performances.every((p) => /^\d{2}:\d{2}$/.test(p.time) && p.availability));
    assert.deepEqual(tnewAvailability({ id: 1, isOnSale: true, hasLimitedSeatingAvailable: true }), { availability: "few-left" });
    assert.deepEqual(tnewAvailability({ id: 1, performanceStatusMessage: "SOLD OUT" }), { availability: "sold-out" });
    assert.deepEqual(tnewAvailability({ id: 1, performanceStatusMessage: "Cancelled" }), { availability: "not-on-sale", status: "cancelled" });
    assert.deepEqual(tnewAvailability({ id: 1, isOnSale: false }), { availability: "not-on-sale" });
  });
  test("OvationTix: showtimes grouped by production, venue and image from the detail", async () => {
    const res = await ADAPTERS.ovationtix!.collect(
      src("sarasota-contemporary-dance"),
      ctx({
        "https://web.ovationtix.com/trs/api/rest/CalendarProductions": fx("ovationtix-calendar.json"),
        "https://web.ovationtix.com/trs/api/rest/Production(1288353)/performance?": fx("ovationtix-production.json"),
      }),
    );
    const sky = res.events.find((e) => e.externalId === "1288353")!;
    assert.ok(sky.performances.length >= 2);
    assert.equal(sky.ticketUrl, "https://ci.ovationtix.com/35361/production/1288353");
    assert.ok(sky.venueName);
    assert.match(sky.imageUrl ?? "", /ClientFile\(\d+\)/);
    assert.ok(res.warnings.length > 0, "other productions' details were missing from the fixture");
  });
  test("TicketSpice: date from the title, sold-out flag from the form", () => {
    const e = readTicketSpice(fx("ticketspice.html"), "https://chamberorchestraofsarasota.ticketspice.com/musical-tapestries", TODAY);
    assert.ok(e);
    assert.equal(e!.performances[0]?.availability ?? "on-sale", "on-sale");
    const sold = readTicketSpice('<html><head><meta property="og:title" content="10/01/2026 The Mammals "></head><script>x="\\"soldOut\\":true"</script></html>', "https://w.ticketspice.com/x", TODAY)!;
    assert.equal(sold.title, "The Mammals");
    assert.equal(sold.performances[0]!.date, "2026-10-01");
    assert.equal(sold.performances[0]!.availability, "sold-out");
  });
});

describe("per-site adapters", () => {
  test("Van Wezel cards: title, date, presenter, image, ticket link", () => {
    const first = readVanWezelCards(fx("vanwezel-events.html"), "https://www.vanwezel.org", TODAY);
    const more = readVanWezelCards(JSON.parse(fx("vanwezel-ajax-9.json")) as string, "https://www.vanwezel.org", TODAY);
    assert.equal(first.length, 9);
    assert.ok(more.length >= 8);
    const boz = first.find((e) => /Boz Scaggs/.test(e.title))!;
    assert.deepEqual(boz.performances.map((p) => p.date), ["2026-10-11"]);
    assert.match(boz.ticketUrl!, /mpv\.tickets\.com/);
    assert.match(boz.imageUrl!, /^https:\/\/www\.vanwezel\.org\/assets\/img\//);
    assert.equal(first.find((e) => /Dance Workshop/.test(e.title))!.presenter, "Azara Ballet");
  });
  test("SILL: each program at each local venue on the right weekday", () => {
    const events = readSill(fx("sill.html"), sourceById("sill")!.config.venues as Record<string, string>, TODAY, "$20 at the door");
    const music = events.filter((e) => e.title.startsWith("Music Mondays"));
    assert.equal(music.length, 12);
    assert.deepEqual(music[0]!.performances, [{ date: "2027-01-04", time: "10:30" }]);
    assert.equal(music[0]!.venueKey, "church-of-the-palms");
    const trump = events.filter((e) => /^Donald Trump in War and Peace/.test(e.title));
    assert.deepEqual(trump.map((e) => [e.venueKey, e.performances[0]]).sort(), [
      ["cornerstone-church-lwr", { date: "2027-01-06", time: "13:00" }],
      ["fumc-sarasota", { date: "2027-01-05", time: "10:30" }],
    ]);
  });
  test("MPAC: show blocks with dates, times and BoxOfficeCentral links", () => {
    const events = readMpac(fx("mpac.html"), "https://www.manateeperformingartscenter.com/", TODAY);
    assert.ok(events.length >= 20);
    const two = events.find((e) => e.performances.length === 2 && e.performances[0]!.date === e.performances[1]!.date)!;
    assert.deepEqual(two.performances.map((p) => p.time), ["14:00", "19:00"]);
    assert.ok(events.every((e) => /boxofficecentral\.com/.test(e.ticketUrl!)));
  });
  test("McCurdy's: every show date with time and the price", async () => {
    const url = "https://www.mccurdyscomedy.com/shows/show.cfm?shoID=534";
    const res = await ADAPTERS.pages!.collect(src("mccurdys", { listings: [], pages: [url] }), ctx({ [url]: fx("page-mccurdys-show.html") }));
    const e = res.events[0]!;
    assert.equal(e.title, "Joe DeVito");
    assert.equal(e.complete, true);
    assert.equal(e.performances[0]!.date, "2026-10-08");
    assert.equal(e.performances[0]!.time, "19:00");
    assert.equal(e.priceMin, 28);
  });
  test("McCurdy's listing links are followed from onclick cards", async () => {
    const res = await ADAPTERS.pages!.collect(src("mccurdys", { maxPages: 0 }), ctx({ "https://www.mccurdyscomedy.com/shows": fx("page-mccurdys-list.html") }));
    assert.match(res.warnings.join(" "), /pages left for the next run/);
  });
  test("WSLR: date and time from the event table, the TicketSpice link", async () => {
    const url = "https://wslr.org/event/don-soledad-trio-presents-art-passion/";
    const res = await ADAPTERS.pages!.collect(src("wslr", { listings: [], pages: [url] }), ctx({ [url]: fx("page-wslr.html") }));
    const e = res.events[0]!;
    assert.deepEqual(e.performances.map((p) => [p.date, p.time]), [["2026-10-10", "20:00"]]);
    assert.match(e.ticketUrl!, /ticketspice\.com/);
    assert.equal(e.priceMin, 15);
  });
});

/* ---- Matching and reconciling -------------------------------------------- */

const ev = (over: Partial<StoreEvent> & { slug: string; title: string }): StoreEvent => ({
  presenter: null,
  market: "sarasota",
  category: "music",
  siteCategory: "music",
  subcategory: null,
  venueKey: "van-wezel",
  venueName: "Van Wezel",
  room: null,
  city: "Sarasota",
  startDate: "2026-10-11",
  endDate: null,
  startTime: "19:30",
  recurrence: null,
  price: "$61–$253",
  ticketUrl: null,
  sources: [],
  description: "x",
  status: "scheduled",
  notes: null,
  performances: [],
  ...over,
});
const perf = (date: string, time = "19:30", more: Partial<StoreEvent["performances"][number]> = {}) => ({ date, time, status: "scheduled" as const, availability: "unknown" as const, ...more });
const col = (over: Partial<CollectedEvent> & { title: string }): CollectedEvent => ({ sourceUrl: "https://x.org/e", performances: [], complete: true, ...over });
const VENUES = [
  { key: "van-wezel", name: "Van Wezel Performing Arts Hall", type: null, address: null, city: null, market: "sarasota", website: null, eventsUrl: null, residentCompanies: [], notes: null },
  { key: "fsu-center", name: "FSU Center for the Performing Arts", type: null, address: null, city: null, market: "sarasota", website: null, eventsUrl: null, residentCompanies: [], notes: null },
];

describe("matching", () => {
  test("title similarity", () => {
    assert.ok(titleSimilarity("Jazz Thursdays", "Jazz Thursday | Five Points Quintet") >= 0.6);
    assert.ok(titleSimilarity("Music Mondays: Andrii and Yurii Padkovskyi", "Music Mondays: Adam Gwon, Composer") < 0.55);
    assert.ok(titleSimilarity("Singin' in the Rain", "Singin’ In The Rain") === 1);
  });
  test("a page link of one event wins; a shared listing link does not", () => {
    const known = [
      { slug: "a", title: "Rumours of Fleetwood Mac", venueKey: "van-wezel", urls: ["https://www.vanwezel.org/events/detail/rumours-of-fleetwood-mac"], dates: ["2026-10-17"] },
      { slug: "b", title: "Opening Night", venueKey: "van-wezel", urls: ["https://x.org/season"], dates: ["2026-11-01"] },
      { slug: "c", title: "Closing Night", venueKey: "van-wezel", urls: ["https://x.org/season"], dates: ["2027-04-01"] },
    ];
    const m = buildMatcher(known, VENUES);
    assert.deepEqual(m.match(col({ title: "Rumours Of Fleetwood Mac", sourceUrl: "https://vanwezel.org/events/detail/rumours-of-fleetwood-mac/", performances: [{ date: "2026-10-17", time: "" }] })), { slug: "a", via: "url", score: 1 });
    assert.equal(m.match(col({ title: "Closing Night", sourceUrl: "https://x.org/season", performances: [{ date: "2027-04-01", time: "20:00" }] }))?.slug, "c");
    assert.equal(m.match(col({ title: "Something Else Entirely", sourceUrl: "https://x.org/season", performances: [{ date: "2027-04-01", time: "20:00" }] })), null);
  });
  test("the venue keeps same-titled events apart", () => {
    const known = [
      { slug: "talk-fumc", title: "Is a U.S.-China War Inevitable?", venueKey: "fumc-sarasota", urls: [], dates: ["2027-01-19"] },
      { slug: "talk-lwr", title: "Is a U.S.-China War Inevitable?", venueKey: "cornerstone-church-lwr", urls: [], dates: ["2027-01-20"] },
    ];
    const m = buildMatcher(known, []);
    assert.equal(m.match(col({ title: "Is a U.S -China War Inevitable? – Dr. Evan Medeiros", venueKey: "cornerstone-church-lwr", performances: [{ date: "2027-01-20", time: "13:00" }] }))?.slug, "talk-lwr");
  });
});

describe("reconcile", () => {
  const vw = { ...sourceById("van-wezel")! };
  const asolo = { ...sourceById("asolo-rep")! };

  test("known event: status and price apply, a reading is kept, the image is noted", () => {
    const events = [ev({ slug: "boz", title: "Boz Scaggs Rhythm Review 2026", ticketUrl: "https://mpv.tickets.com/?eventid=4450", performances: [perf("2026-10-11")] })];
    const plan = reconcile({
      source: vw,
      collected: [col({ title: "Boz Scaggs Rhythm Review 2026", ticketUrl: "https://mpv.tickets.com/?eventid=4450", complete: false, imageUrl: "https://www.vanwezel.org/assets/img/boz.png", performances: [{ date: "2026-10-11", time: "", availability: "sold-out" }] })],
      events,
      venues: VENUES,
      today: TODAY,
      mode: "collect",
    });
    assert.deepEqual(plan.perfs, [{ slug: "boz", date: "2026-10-11", time: "19:30", availability: "sold-out", isNew: false }]);
    assert.equal(plan.patches[0]!.set.status, "sold-out");
    assert.equal(plan.checks.length, 1);
    assert.equal(plan.images[0]!.imageUrl, "https://www.vanwezel.org/assets/img/boz.png");
    assert.equal(plan.queue.length, 0);
  });

  test("a complete source adds new dates and drops a vanished one", () => {
    const events = [ev({ slug: "pronoun", title: "Pronoun", venueKey: "fsu-center", ticketUrl: "https://tickets.asolorep.org/7838/", performances: [perf("2026-11-03"), perf("2026-11-05"), perf("2026-11-07", "13:30"), perf("2026-11-07")] })];
    const plan = reconcile({
      source: asolo,
      collected: [
        col({
          title: "Pronoun",
          sourceUrl: "https://tickets.asolorep.org/7838",
          performances: [
            { date: "2026-11-03", time: "19:30", availability: "on-sale" },
            { date: "2026-11-07", time: "13:30", availability: "few-left" },
            { date: "2026-11-07", time: "19:30", availability: "on-sale" },
            { date: "2026-11-08", time: "13:30", availability: "on-sale" },
          ],
        }),
      ],
      events,
      venues: VENUES,
      today: TODAY,
      mode: "collect",
    });
    assert.equal(plan.stats.perfsAdded, 1);
    assert.equal(plan.stats.perfsRemoved, 1);
    assert.ok(plan.perfs.some((p) => p.date === "2026-11-05" && p.status === "removed"));
    assert.ok(plan.perfs.some((p) => p.isNew && p.date === "2026-11-08" && p.time === "13:30"));
  });

  test("too many dates vanishing at once goes to review instead", () => {
    const events = [ev({ slug: "big", title: "Big Show", venueKey: "fsu-center", ticketUrl: "https://tickets.asolorep.org/7504/", performances: ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"].map((d) => perf(d)) })];
    const plan = reconcile({ source: asolo, collected: [col({ title: "Big Show", sourceUrl: "https://tickets.asolorep.org/7504", performances: [{ date: "2026-11-01", time: "19:30" }] })], events, venues: VENUES, today: TODAY, mode: "collect" });
    assert.equal(plan.stats.perfsRemoved, 0);
    assert.equal(plan.queue[0]!.kind, "change");
  });

  test("prose dates never add a performance", () => {
    const events = [ev({ slug: "x", title: "Silent Sky", venueKey: "fsu-center", sources: ["https://www.theislandplayers.org/silent-sky"], performances: [perf("2026-10-09")] })];
    const plan = reconcile({ source: sourceById("island-players")!, collected: [col({ title: "Silent Sky", sourceUrl: "https://www.theislandplayers.org/silent-sky", heuristic: true, complete: false, performances: [{ date: "2026-12-01", time: "" }] })], events, venues: VENUES, today: TODAY, mode: "collect" });
    assert.equal(plan.perfs.length, 0);
  });

  test("new events wait in the review queue, once, with a proposed slug and venue", () => {
    const c = col({ title: "Golden Groovers: The Music of The Bee Gees", sourceUrl: "https://www.vanwezel.org/events/detail/golden-groovers-26", venueName: "Van Wezel Performing Arts Hall", performances: [{ date: "2026-11-12", time: "" }] });
    const plan = reconcile({ source: vw, collected: [c, { ...c }], events: [], venues: VENUES, today: TODAY, mode: "collect" });
    assert.equal(plan.queue.length, 1);
    assert.equal(plan.queue[0]!.kind, "new-event");
    assert.equal(plan.queue[0]!.proposed.slug, "golden-groovers-the-music-of-the-bee-gees-2026-11");
    assert.equal(plan.queue[0]!.proposed.venueKey, "van-wezel");
    const again = reconcile({ source: vw, collected: [c], events: [], venues: VENUES, today: TODAY, mode: "collect", settled: new Set([fingerprint(vw.id, c)]) });
    assert.equal(again.queue.length, 0, "a rejected item does not come back");
  });

  test("one show on two pages of a source stays one event, keeping both pages' dates", () => {
    const mc = sourceById("mccurdys")!;
    const events = [ev({ slug: "al", title: "Al Ernst", venueKey: "mccurdys-comedy-theatre", sources: ["https://www.mccurdyscomedy.com/shows/show.cfm?shoid=600"], performances: [perf("2026-11-25", "19:00"), perf("2026-11-27", "19:00")] })];
    const plan = reconcile({
      source: mc,
      collected: [
        col({ title: "Al Ernst", sourceUrl: "https://www.mccurdyscomedy.com/shows/show.cfm?shoid=600", performances: [{ date: "2026-11-27", time: "19:00" }] }),
        col({ title: "Al Ernst", sourceUrl: "https://www.mccurdyscomedy.com/shows/show.cfm?shoid=601", performances: [{ date: "2026-11-25", time: "19:00" }] }),
      ],
      events,
      venues: VENUES,
      today: TODAY,
      mode: "collect",
    });
    assert.equal(plan.stats.perfsRemoved, 0);
    assert.equal(plan.queue.length, 0);
  });

  test("check runs change statuses only: no new dates, no queue, no images", () => {
    const events = [ev({ slug: "p", title: "Pronoun", venueKey: "fsu-center", ticketUrl: "https://tickets.asolorep.org/7838/", performances: [perf("2026-10-10")] })];
    const plan = reconcile({ source: asolo, collected: [col({ title: "Pronoun", sourceUrl: "https://tickets.asolorep.org/7838", performances: [{ date: "2026-10-10", time: "19:30", status: "cancelled" }, { date: "2026-12-01", time: "19:30" }] }), col({ title: "Brand New Play", performances: [{ date: "2026-10-20", time: "19:30" }] })], events, venues: VENUES, today: TODAY, mode: "check" });
    assert.deepEqual(plan.perfs.map((p) => [p.date, p.status]), [["2026-10-10", "cancelled"]]);
    assert.equal(plan.patches[0]!.set.status, "cancelled");
    assert.equal(plan.queue.length + plan.images.length, 0);
  });

  test("a run's closing day moves when a structured source says so; prose dates go to review", () => {
    const events = [ev({ slug: "show", title: "Andrea Carlson: A Constant Sky", venueKey: "the-ringling", startDate: "2026-05-30", endDate: "2026-11-01", sources: ["https://www.ringling.org/event/andrea-carlson-a-constant-sky/"] })];
    const c = col({ title: "Andrea Carlson: A Constant Sky", sourceUrl: "https://www.ringling.org/event/andrea-carlson-a-constant-sky/", startDate: "2026-05-30", endDate: "2026-11-15", complete: false });
    const plan = reconcile({ source: sourceById("ringling")!, collected: [c], events, venues: VENUES, today: TODAY, mode: "collect" });
    assert.equal(plan.patches[0]!.set.endDate, "2026-11-15");
    const prose = reconcile({ source: sourceById("ringling")!, collected: [{ ...c, heuristic: true }], events, venues: VENUES, today: TODAY, mode: "collect" });
    assert.equal(prose.patches[0]?.set.endDate, undefined);
    assert.equal(prose.queue[0]!.kind, "change");
  });

  test("one show that day at a new time is a time change, not a new date", () => {
    const events = [ev({ slug: "jt", title: "Jazz Thursdays", venueKey: "sarasota-art-museum", sources: ["https://www.sarasotaartmuseum.org/event/jazz-thursday/"], performances: [perf("2026-10-08", "17:30")] })];
    const plan = reconcile({ source: sourceById("sarasota-art-museum")!, collected: [col({ title: "Jazz Thursday | Five Points Quintet", sourceUrl: "https://www.sarasotaartmuseum.org/event/jazz-thursday/", performances: [{ date: "2026-10-08", time: "17:00" }] })], events, venues: VENUES, today: TODAY, mode: "collect" });
    assert.deepEqual(plan.perfs, [{ slug: "jt", date: "2026-10-08", time: "17:30", newTime: "17:00", isNew: false }]);
    assert.equal(plan.stats.perfsRemoved, 0);
  });

  test("a rental listed under a company's name doesn't take over that company's gala", () => {
    const events = [ev({ slug: "gala", title: "The Sarasota Ballet Gala 2027", venueKey: "sarasota-opera-house", startDate: "2027-05-02", performances: [perf("2027-05-02", "17:00")] })];
    const plan = reconcile({
      source: sourceById("sarasota-opera")!,
      collected: [col({ title: "The Sarasota Ballet", sourceUrl: "https://tickets.sarasotaopera.org/9000", performances: ["2026-11-20", "2026-11-21", "2026-12-20", "2027-05-02"].map((date) => ({ date, time: "19:30" })) })],
      events,
      venues: VENUES,
      today: TODAY,
      mode: "collect",
    });
    assert.equal(plan.stats.matched, 0);
    assert.equal(plan.queue[0]!.kind, "new-event");
  });
});

describe("sources", () => {
  test("ids are unique and every automated source has an adapter", () => {
    assert.equal(new Set(SOURCES.map((s) => s.id)).size, SOURCES.length);
    for (const s of SOURCES) if (s.adapter !== "manual") assert.ok(ADAPTERS[s.adapter], s.id);
  });
  test("a URL belongs to its source by host", () => {
    assert.equal(sourceForUrl("https://tickets.asolorep.org/7838")?.id, "asolo-rep");
    assert.equal(sourceForUrl("https://www.vanwezel.org/events/detail/x")?.id, "van-wezel");
    assert.equal(sourceForUrl("https://www.artsarasota.org/exhibitions")?.adapter, "manual");
  });
  test("grouping and the upcoming filter", () => {
    const g = groupEvents([col({ title: "Tour (Oct 3)", performances: [{ date: "2026-10-03", time: "11:00" }] }), col({ title: "Tour (Oct 10)", performances: [{ date: "2026-10-10", time: "11:00" }] })]);
    assert.equal(g.length, 1);
    assert.equal(g[0]!.performances.length, 2);
    assert.equal(upcoming([col({ title: "Past", performances: [{ date: "2026-09-01", time: "" }] }), col({ title: "Undated" })], TODAY).map((e) => e.title).join(), "Undated");
  });
});

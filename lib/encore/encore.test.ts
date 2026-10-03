import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildEncore, encoreEvents, JSON_SNAPSHOT } from "../content/encore";
import { checkFairHousing } from "../fair-housing";
import { fixtureFetcher } from "./collect/http";
import { runCollector } from "./collect/run";
import { sourceById } from "./collect/sources";
import { PANEL_COPY, STATUS, compactWhen, overall, priceRange, relativeTime, upcomingDates } from "./panel";
import { datasetToStore } from "./store/convert";
import { fileStore } from "./store/file";
import { isDue } from "./store/store";
import type { EncoreSnapshot } from "./store/types";

const NOW = Date.parse("2026-10-03T16:00:00Z");

describe("the bundled dataset as a snapshot", () => {
  test("every event and venue converts; past events drop out by date", () => {
    assert.equal(JSON_SNAPSHOT.events.length, 782);
    const upcoming = encoreEvents(new Date("2026-10-03T12:00:00Z"));
    assert.ok(upcoming.length > 600 && upcoming.length < 760);
    for (const e of upcoming) assert.ok(e.live, e.slug);
  });
});

describe("a database snapshot on the site", () => {
  const base = datasetToStore({
    venues: [{ key: "van-wezel", name: "Van Wezel Performing Arts Hall", type: "hall", address: "777 N Tamiami Trl, Sarasota, FL 34236", city: "Sarasota", market: "sarasota", website: null, eventsUrl: null, residentCompanies: [], notes: null }],
    events: [
      {
        slug: "boz",
        title: "Boz Scaggs",
        presenter: null,
        market: "sarasota",
        category: "music",
        siteCategory: "music",
        subcategory: "concert",
        venueKey: "van-wezel",
        venueName: "Van Wezel",
        room: null,
        city: "Sarasota",
        startDate: "2026-10-11",
        endDate: null,
        startTime: "19:30",
        performances: [
          { date: "2026-10-11", time: "19:30" },
          { date: "2026-10-12", time: "19:30" },
          { date: "2026-10-13", time: "19:30" },
        ],
        recurrence: null,
        price: "$61–$253",
        ticketUrl: "https://mpv.tickets.com/?eventid=4450",
        sources: ["https://mpv.tickets.com/?eventid=4450", "https://www.vanwezel.org/events/detail/boz-scaggs"],
        description: "A night of blue-eyed soul.",
        status: "scheduled",
        notes: null,
      },
    ],
  });
  const snap: EncoreSnapshot = { generatedAt: new Date(NOW).toISOString(), origin: "db", venues: base.venues, events: base.events, images: [] };
  const e0 = snap.events[0]!;
  e0.performances[0]!.availability = "sold-out";
  e0.performances[1]!.status = "cancelled";
  e0.performances[2]!.status = "removed";
  e0.checkedAt = "2026-10-03T11:00:00Z";
  snap.images.push({ eventSlug: "boz", imageSourceUrl: "https://www.vanwezel.org/a.png", pageUrl: "https://www.vanwezel.org/events", credit: "Van Wezel Performing Arts Hall", publicUrl: "https://x.supabase.co/storage/v1/object/public/encore-images/events/boz.webp", width: 1600, height: 900, hidden: false });

  test("statuses, image and credit reach the Event", () => {
    const [e] = buildEncore(snap).events;
    assert.ok(e);
    assert.equal(e.performances?.length, 1, "cancelled and removed dates leave the calendar");
    assert.equal(e.live?.dates.length, 2, "the panel still shows the cancelled date");
    assert.deepEqual(e.live?.dates.map((d) => d.status), ["sold-out", "cancelled"]);
    assert.equal(e.image?.src, snap.images[0]!.publicUrl);
    assert.deepEqual(e.imageCredit, { name: "Van Wezel Performing Arts Hall", url: "https://www.vanwezel.org/events" });
    assert.equal(e.live?.venuePage, "https://www.vanwezel.org/events/detail/boz-scaggs", "the presenter's page, not the ticket seller");
  });
  test("a hidden image falls back to key art", () => {
    const hidden: EncoreSnapshot = { ...snap, images: [{ ...snap.images[0]!, hidden: true }] };
    assert.equal(buildEncore(hidden).events[0]!.image, undefined);
  });
});

describe("the From the venue panel", () => {
  test("copy is plain and Fair Housing clean", () => {
    const strings = [
      ...Object.values(STATUS).flatMap((s) => (s ? [s.label] : [])),
      ...Object.values(PANEL_COPY).map((v) => (typeof v === "function" ? (v as (...a: unknown[]) => string)("2 hours ago", "Van Wezel") : v)),
    ];
    for (const s of strings) {
      assert.equal(checkFairHousing(s).passed, true, s);
      assert.doesNotMatch(s, /\b(lands?|navigate|landscape|vibrant|nestled|dive in|the read|the mark)\b/i, s);
    }
  });
  test("helpers", () => {
    assert.equal(priceRange(35, 145), "$35–$145");
    assert.equal(priceRange(0, 0), "Free");
    assert.equal(priceRange(undefined, undefined), undefined);
    assert.equal(compactWhen({ startsAt: "2026-10-10T23:30:00Z" }), "Sat, Oct 10 · 7:30 PM");
    assert.equal(compactWhen({ startsAt: "2026-10-10T16:00:00Z", allDay: true }), "Sat, Oct 10");
    assert.equal(relativeTime("2026-10-03T13:00:00Z", NOW), "3 hours ago");
    assert.equal(relativeTime("2026-10-02T10:00:00Z", NOW), "yesterday");
    assert.equal(relativeTime("2026-10-03T15:59:30Z", NOW), "just now");
    assert.equal(overall([{ startsAt: "x", status: "sold-out" }, { startsAt: "y", status: "cancelled" }]), "sold-out");
    assert.equal(overall([{ startsAt: "x", status: "on-sale" }, { startsAt: "y", status: "few-left" }]), "few-left");
    assert.equal(overall([], "cancelled"), "cancelled");
    assert.equal(upcomingDates([{ startsAt: "2026-10-03T16:00:00Z", allDay: true, status: "unknown" }, { startsAt: "2026-10-03T14:00:00Z", status: "unknown" }], new Date(NOW).toISOString()).length, 1);
  });
});

describe("the collector end to end (memory store, saved responses)", () => {
  test("seed, collect one TNEW source, then a check; sources become due again after a week", async () => {
    const store = fileStore();
    const tnew = (await import("node:fs")).readFileSync(new URL("./collect/__fixtures__/tnew-orchestra.json", import.meta.url), "utf8");
    const { default: data } = await import("../content/encore/encore-calendar.json", { with: { type: "json" } });
    const { SOURCES } = await import("./collect/sources");
    const counts = await store.seed(data as never, SOURCES, () => "sarasota-orchestra");
    assert.equal(counts.events, 782);
    const fetch = async (url: string) => ({ url, status: 200, ok: true, text: tnew, headers: {} });
    const now = new Date("2026-10-03T12:00:00Z");
    const collect = await runCollector({ store, mode: "collect", deadline: Date.now() + 60_000, fetcher: fetch, only: ["sarasota-orchestra"], now });
    assert.equal(collect.processed.length, 1);
    assert.equal(collect.processed[0]!.ok, true);
    assert.ok((collect.processed[0]!.matched ?? 0) >= 3);
    const after = await store.load();
    const humor = after.events.find((e) => e.slug === "classical-music-humor-2026-10")!;
    assert.ok(humor.performances.some((p) => p.availability !== "unknown"), "statuses were read");
    assert.ok(humor.lastSeenAt);
    const states = await store.sources();
    const orch = states.find((s) => s.id === "sarasota-orchestra")!;
    assert.ok(orch.lastOkAt);
    assert.equal(isDue(orch, now), false);
    assert.equal(isDue(orch, new Date(now.getTime() + 7 * 86_400_000)), true);
    const check = await runCollector({ store, mode: "check", deadline: Date.now() + 60_000, fetcher: fetch, only: ["sarasota-orchestra"], now });
    assert.equal(check.processed[0]!.ok, true);
    assert.ok((check.processed[0]!.checks ?? 0) > 0);
    assert.equal((await store.review("pending")).filter((q) => q.kind === "new-event").length >= 0, true);
  });
  test("a failing source is recorded, not thrown", async () => {
    const store = fileStore();
    await store.ensureSources([sourceById("van-wezel")!]);
    const res = await runCollector({ store, mode: "collect", deadline: Date.now() + 30_000, fetcher: fixtureFetcher({}), only: ["van-wezel"] });
    assert.equal(res.processed[0]!.ok, false);
    const s = (await store.sources()).find((x) => x.id === "van-wezel")!;
    assert.match(s.lastError ?? "", /406|404|Van Wezel/);
    assert.equal(s.failures, 1);
  });
});

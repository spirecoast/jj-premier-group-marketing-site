import assert from "node:assert/strict";
import { test } from "node:test";
import type { StoreEvent } from "../store/types";
import { missingImages } from "./run";

const ev = (slug: string, over: Partial<StoreEvent> = {}): StoreEvent =>
  ({ slug, title: slug, presenter: null, venueName: "Herrig Center", startDate: "2026-11-01", endDate: null, ticketUrl: null, sources: [`https://herrig.example/events/${slug}`], performances: [], ...over }) as unknown as StoreEvent;

test("missingImages offers the event's own page for current events never tried", () => {
  const out = missingImages(
    [
      ev("new-show"),
      ev("tried", {}),
      ev("past", { startDate: "2026-01-01" }),
      ev("hidden", { hidden: true }),
      ev("ticketed", { sources: ["https://www.eventbrite.com/e/1", "https://venue.example/show"], presenter: "Venue Co" }),
    ],
    new Set(["tried"]),
    "2026-10-03",
  );
  assert.deepEqual(out, [
    { slug: "new-show", pageUrl: "https://herrig.example/events/new-show", credit: "Herrig Center" },
    { slug: "ticketed", pageUrl: "https://venue.example/show", credit: "Venue Co" },
  ]);
});

"use client";

import { PlaceTabs, type PlaceTab } from "@/components/places/place-tabs";
import { weekday, type Occ } from "@/lib/encore/select";

/** Dinner before an evening show starts this long before the curtain. */
const DINNER_LEAD_MIN = 90;
/** When a listing has no end time, the show is taken to run this long. */
const DEFAULT_RUN_MIN = 150;
const EVENING_MIN = 17 * 60;

/** A minute count that may run past midnight, as a weekday and minute of that day. */
function slot(day: number, minutes: number): { day: number; at: number } {
  const shift = Math.floor(minutes / 1440);
  return { day: (((day + shift) % 7) + 7) % 7, at: minutes - shift * 1440 };
}

/**
 * Restaurants, bars and hotels near a pick's venue, from Google. Dinner is
 * before an evening show and after a matinee; drinks are after. Restaurants
 * and bars are only listed if Google has them open then.
 */
export function NightOut({ o, id }: { o: Occ; id: string }) {
  const [h, m] = o.time.split(":").map(Number) as [number, number];
  const start = h * 60 + m;
  const run = o.end > o.start ? Math.round((o.end - o.start) / 60_000) : DEFAULT_RUN_MIN;
  const evening = start >= EVENING_MIN;
  const day = weekday(o.day);
  const dinner = slot(day, evening ? start - DINNER_LEAD_MIN : Math.max(start + run, EVENING_MIN));
  const drinks = slot(day, start + run);
  const url = (kind: string, s?: { day: number; at: number }) =>
    `/api/places/night?${new URLSearchParams({ venue: o.e.v, kind, ...(s ? { day: String(s.day), at: String(s.at) } : {}) }).toString()}`;

  const tabs: PlaceTab[] = [
    { id: "dinner", label: evening ? "Dinner before" : "Dinner after", url: url("dinner", dinner), empty: `Nothing nearby that’s well rated and open ${evening ? "before" : "after"} the show.` },
    { id: "drinks", label: "Drinks after", url: url("drinks", drinks), empty: "Nothing nearby that’s well rated and open after the show." },
    { id: "stay", label: "Hotels", url: url("stay"), empty: "No well-rated hotels nearby." },
  ];

  return (
    <li id={id} className="flex flex-col gap-4 border-b border-hairline bg-linen-50 px-4 py-5 sm:px-5">
      <p className="t-h4 text-navy">Near {o.e.vn}</p>
      <PlaceTabs tabs={tabs} label={`Near ${o.e.vn}`} note="Nobody pays to be on this list." />
    </li>
  );
}

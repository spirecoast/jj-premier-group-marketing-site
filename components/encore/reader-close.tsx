"use client";

import Link from "next/link";
import { ShareButton } from "@/components/share-button";
import { TrackedLink } from "@/components/tracked-link";

/**
 * The close of /calendar for a reader who already gets Encore: save and
 * share the week, or let the Planner lay out the nights, in place of the
 * sign-up (components/arrived-from.tsx).
 */
export function EncoreReaderClose() {
  return (
    <section id="subscribe" className="scroll-mt-header bg-linen-200" data-encore-reader-close="">
      <div className="container-site grid items-center gap-8 py-section lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 className="t-h1 text-navy">You already get Encore.</h2>
          <p className="t-body max-w-measure text-body">Save the shows you want to your own list and share it, or let the Planner lay out your nights.</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Link href="/calendar/plan" className="btn btn-navy">
              Plan your nights
              <span className="btn-dash" aria-hidden="true" />
            </Link>
            <ShareButton title="Encore, the arts calendar" what="calendar-view" label="Share this week" />
          </div>
          <p className="t-small text-linen-700">
            Prefer your own calendar app?{" "}
            <TrackedLink href="/api/calendar.ics" event="Calendar feed" props={{ kind: "feed", filter: "all" }} className="text-navy underline underline-offset-4 hover:text-harbor-700">
              Subscribe to the feed
            </TrackedLink>
            , or narrow it to a category or a venue above and subscribe to just that.
          </p>
        </div>
      </div>
    </section>
  );
}

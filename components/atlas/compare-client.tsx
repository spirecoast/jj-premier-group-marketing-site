"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { LeadForm } from "@/components/lead-form";
import { ShareButton } from "@/components/share-button";
import { track } from "@/lib/analytics";
import { COMPARE_MAX, compareSet, savedCount } from "@/lib/neighborhoods/my-places";
import { compareHref } from "@/lib/neighborhoods/url";
import { useMyPlaces } from "./use-my-places";

const noop = () => () => {};

/** Counts the comparison once per page view, with how many places it held. */
export function CompareGoal({ count }: { count: number }) {
  useEffect(() => {
    track("Explore", { action: "compare" });
  }, [count]);
  return null;
}

/** Share: the page's own address, which carries the places. */
export function CompareShare({ slugs }: { slugs: string[] }) {
  return <ShareButton title="Compare · Atlas · JJ Premier Group" url={compareHref(slugs)} what="compare" label="Share this comparison" />;
}

/**
 * The ask under the table: the buy form with the places and this page's link
 * in the message, the way Atlas Match does it.
 */
export function CompareAsk({ names, slugs, market }: { names: string[]; slugs: string[]; market?: string }) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const message = [`From Atlas, comparing ${names.join(", ")}.`, "Could you walk me through these?", origin ? `${origin}${compareHref(slugs)}` : ""].filter(Boolean).join(" ");
  return (
    <section className="grid gap-10 border-t border-hairline pt-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="compare-ask-title">
      <div className="flex flex-col gap-3.5">
        <h2 id="compare-ask-title" className="t-h1 text-navy">
          Want us to walk you through these {names.length === 2 ? "two" : names.length === 3 ? "three" : "four"}?
        </h2>
        <p className="t-body max-w-[440px] text-body">Your list is already in the message. Tell us your timing, and one of us will tell you why each one fits, or doesn’t.</p>
      </div>
      <div className="border border-hairline bg-white p-6 sm:p-8">
        <LeadForm key={message} form="buy" fields={["name", "email", "phone", "timing", "sellFirst", "message"]} submitLabel="Walk me through these" defaultMessage={message} hidden={{ market, pageTitle: "Atlas Compare" }} />
      </div>
    </section>
  );
}

/**
 * The page with nothing (or one place) to compare: what it does, and the way
 * in from the places saved in this browser when there are enough of them.
 */
export function CompareEmpty({ given }: { given: number }) {
  const my = useMyPlaces();
  const set = compareSet(my.list);
  return (
    <div className="flex flex-col gap-6 border border-hairline bg-white p-6 sm:p-10">
      <div className="flex flex-col gap-3">
        <h2 className="t-h2 text-navy">{given === 1 ? "One place is here. Add another to compare." : "Save two to four places and hold them side by side."}</h2>
        <p className="t-body max-w-measure text-body">
          Every fact comes with its source and the day we checked it. Save a place with the bookmark on the map, on a Match result or on its page, and the compare link appears with your saved places.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {set.length >= 2 ? (
          <Link href={compareHref(set)} className="btn btn-navy">
            Compare my {savedCount(set.length).replace(" saved", "")} saved places
            <span className="btn-dash" aria-hidden="true" />
          </Link>
        ) : null}
        <Link href={"/neighborhoods" as Route} className="link-rule">
          Open the map
        </Link>
        <Link href={"/neighborhoods/match" as Route} className="link-rule">
          Try Atlas Match
        </Link>
      </div>
      {my.list.length > COMPARE_MAX ? <p className="t-note">You have {savedCount(my.list.length)}; the compare page holds the first {COMPARE_MAX}.</p> : null}
    </div>
  );
}

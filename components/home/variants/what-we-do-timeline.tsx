import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";
import { BOTH_PROMISES, BUYER_PROMISES, SELLER_PROMISES, WHAT_WE_DO, type Step } from "../what-we-do-copy";

/**
 * "Timeline": each column is a vertical rail. The steps hang off it with a
 * square tick and the mono numeral, and a photograph of the moment is let
 * into the rail where the story turns (the Saturday showings, the keys; the
 * house seen from above, the first weekend). "Both get" is three
 * photo-backed cards, the words set over the picture like a place card.
 *
 * Every photograph here is decorative (alt "", hidden from assistive
 * technology): the steps carry the meaning, and a tile sits inside the step
 * it follows so the ordered lists keep their count. The frames live here,
 * not in the copy module, so a photograph used only by this treatment can
 * never take down a page that does not render it.
 */
const TILES: Record<"buyer" | "seller", Record<number, ImageRef>> = {
  buyer: {
    2: img("library/listing-kitchen-4pm-island", "", "50% 50%"),
    4: img("library/moment-key-handoff", "", "50% 40%"),
  },
  seller: {
    1: img("library/listing-exterior-canal-golden", "", "50% 50%"),
    4: img("library/listing-twilight-exterior-pool", "", "50% 55%"),
  },
};

/** Both get: the two of us, the weather, and the map. */
const BOTH: ImageRef[] = [
  img("photos/duo-square", "", "50% 31%"), // faces clear of the title on the 2:1 phone card
  img("library/place-storm-gulf", "", "50% 40%"),
  img("library/art-woodblock-bay", "", "50% 50%"),
];

function Rail({ id, eyebrow, title, items, tiles }: { id: string; eyebrow: string; title: string; items: Step[]; tiles: Record<number, ImageRef> }) {
  return (
    <div className="flex min-w-0 flex-col gap-8" role="group" aria-labelledby={id}>
      <div className="flex flex-col gap-3">
        <p className="t-eyebrow text-amber">{eyebrow}</p>
        <h3 id={id} className="t-h2 text-navy">
          {title}
        </h3>
      </div>
      <ol className="relative ml-[5px] flex flex-col gap-9 border-l border-rule pl-7 sm:pl-9">
        {items.map((step, i) => {
          const tile = tiles[i + 1];
          return (
            <li key={step.title} className="relative flex flex-col gap-2">
              <span className="absolute -left-7 top-[0.55em] h-[9px] w-[9px] -translate-x-[5px] bg-navy sm:-left-9" aria-hidden="true" />
              <div className="flex items-baseline gap-3">
                <span className="t-record text-navy">{String(i + 1).padStart(2, "0")}</span>
                <span className="t-mono-sm text-graphite-500">{step.when}</span>
              </div>
              <h4 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{step.title}</h4>
              <p className="t-body max-w-[52ch] text-body">{step.body}</p>
              {tile ? (
                <div className="relative -ml-7 mt-7 aspect-[16/9] overflow-hidden bg-navy sm:-ml-9 sm:aspect-[2/1]" aria-hidden="true">
                  <Photo image={tile} sizes="(min-width: 1024px) 600px, 100vw" />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WhatWeDoTimeline() {
  return (
    <section className="bg-paper" aria-labelledby="what-title">
      <div className="container-site flex flex-col gap-14 py-section">
        <SectionHeading
          number="04"
          eyebrow="What we do for you"
          size="display"
          title={<span id="what-title">{WHAT_WE_DO.title}</span>}
          titleClassName="max-w-[900px]"
          aside={<p className="t-body max-w-[380px] text-body-muted">{WHAT_WE_DO.aside}</p>}
        />
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-x-20">
          <Rail id="what-buyer" eyebrow={WHAT_WE_DO.buyer.eyebrow} title={WHAT_WE_DO.buyer.title} items={BUYER_PROMISES} tiles={TILES.buyer} />
          <Rail id="what-seller" eyebrow={WHAT_WE_DO.seller.eyebrow} title={WHAT_WE_DO.seller.title} items={SELLER_PROMISES} tiles={TILES.seller} />
        </div>
        <div className="flex flex-col gap-8 border-t border-rule pt-10">
          <p className="t-eyebrow text-amber">{WHAT_WE_DO.both}</p>
          {/* 2:1 on phones, growing taller when the words need it; 380px slabs from the tablet up. The explicit
              track and min-w-0 matter: an aspect-ratio box's content-based minimum height is otherwise
              transferred through the ratio into its width, and a 2:1 card with 227px of words would be 454px wide. */}
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-3">
            {BOTH_PROMISES.map((p, i) => (
              <li key={p.title} className="relative flex aspect-[2/1] w-full min-w-0 flex-col justify-end bg-navy text-white md:aspect-auto md:min-h-[380px]">
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                  {/* The card is 380px tall from 768 at every width up to 1440, so the 16:9 sources draw about 680px wide; below that the 2:1 card is width-bound. */}
                  <Photo image={BOTH[i]!} sizes="(min-width: 768px) 700px, 100vw" />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-harbor-950/92 via-harbor-950/70 via-40% to-harbor-950/10" aria-hidden="true" />
                <div className="relative flex flex-col gap-3 p-6 sm:p-7">
                  <h3 className="font-display text-[1.5rem] font-light leading-[1.15] text-white text-shadow-photo">{p.title}</h3>
                  <p className="t-small max-w-[40ch] text-white text-shadow-soft">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

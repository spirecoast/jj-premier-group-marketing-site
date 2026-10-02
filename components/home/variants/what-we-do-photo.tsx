import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { img } from "@/lib/content/seed/helpers";
import type { ImageRef } from "@/lib/content/types";
import { BOTH_PROMISES, BUYER_PROMISES, SELLER_PROMISES, WHAT_WE_DO, type Step } from "../what-we-do-copy";

/**
 * "Photo": each column opens with a tall moment photograph carrying the
 * column's own heading, and the steps run under it with the numeral set
 * large in the display serif. "Both get" closes the section as a navy band
 * so the page ends the section on weight rather than on another list.
 */

/** The two lead photographs, kept with the treatment that uses them. Alt text checked with checkFairHousing (lib/fair-housing.ts). */
const LEAD = {
  buyer: img("library/moment-crossing-room", "Morning sun through white curtains", "50% 50%"),
  seller: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 60%"),
};
function Column({ id, eyebrow, title, items, image }: { id: string; eyebrow: string; title: string; items: Step[]; image: ImageRef }) {
  return (
    <div className="flex flex-col gap-10" role="group" aria-labelledby={id}>
      <figure className="relative aspect-[4/3] w-full overflow-hidden bg-navy sm:aspect-[16/9] lg:aspect-[5/4]">
        <Photo image={image} sizes="(min-width: 1024px) 600px, 100vw" />
        <div className="absolute inset-0 bg-linear-to-t from-harbor-950/85 via-harbor-950/30 via-45% to-transparent" aria-hidden="true" />
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-7 lg:p-9">
          <p className="t-eyebrow text-mist">{eyebrow}</p>
          <h3 id={id} className="t-h2 max-w-[18ch] text-white text-shadow-photo">
            {title}
          </h3>
        </figcaption>
      </figure>
      <ol className="flex flex-col">
        {items.map((p, i) => (
          <li key={p.title} className="grid gap-3 border-t border-rule py-7 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[112px_minmax(0,1fr)]">
            <div className="flex flex-row items-baseline gap-4 sm:flex-col sm:gap-2">
              <span className="font-display text-[3rem] font-extralight leading-[0.9] tracking-[-0.02em] text-linen-500 sm:text-[3.5rem]" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="t-mono-sm text-graphite-500">{p.when}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{p.title}</h4>
              <p className="t-body max-w-[52ch] text-body">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WhatWeDoPhoto() {
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
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0">
          <Column id="what-buyer" eyebrow={WHAT_WE_DO.buyer.eyebrow} title={WHAT_WE_DO.buyer.title} items={BUYER_PROMISES} image={LEAD.buyer} />
          <Column id="what-seller" eyebrow={WHAT_WE_DO.seller.eyebrow} title={WHAT_WE_DO.seller.title} items={SELLER_PROMISES} image={LEAD.seller} />
        </div>
        <div className="flex flex-col gap-8 bg-navy p-8 text-white sm:p-10 lg:p-14">
          <p className="t-eyebrow text-mist">{WHAT_WE_DO.both}</p>
          <ul className="grid gap-8 md:grid-cols-3 md:gap-10">
            {BOTH_PROMISES.map((p) => (
              <li key={p.title} className="flex flex-col gap-3 border-t border-white/20 pt-5">
                <h3 className="font-display text-[1.5rem] font-light leading-[1.15] text-white">{p.title}</h3>
                <p className="t-body max-w-[40ch] text-linen-200">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

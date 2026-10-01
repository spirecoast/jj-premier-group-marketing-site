import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { img } from "@/lib/content/seed/helpers";
import { BOTH_PROMISES, BUYER_PROMISES, SELLER_PROMISES, WHAT_WE_DO, type Step } from "../what-we-do-copy";

/**
 * "Spread": a full-bleed photograph band carries the section heading, and
 * the two columns come up over its lower edge as white cards on the
 * paper, the way a magazine opener runs a picture under the first
 * page of text. Step titles are set as pull quotes, italic in the display
 * serif, with the step's moment above them in mono.
 */

/** The band behind the spread, kept with the treatment that uses it. Alt text checked with checkFairHousing (lib/fair-housing.ts). */
const BAND = img("library/lakes-aerial-sunset", "Lakes and streets from the air at sunset", "50% 62%");
function Card({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: Step[] }) {
  return (
    <div className="flex flex-col gap-8 border border-hairline bg-white p-7 sm:p-9 lg:p-11" role="group" aria-labelledby={id}>
      <div className="flex flex-col gap-3 border-b border-rule pb-6">
        <p className="t-eyebrow text-amber">{eyebrow}</p>
        <h3 id={id} className="t-h2 text-navy">
          {title}
        </h3>
      </div>
      <ol className="flex flex-col gap-8">
        {items.map((p, i) => (
          <li key={p.title} className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="t-record text-navy">{String(i + 1).padStart(2, "0")}</span>
              <span className="t-mono-sm text-graphite-500">{p.when}</span>
            </div>
            <h4 className="font-display text-[1.75rem] font-light italic leading-[1.14] text-navy">{p.title}</h4>
            <p className="t-body max-w-[52ch] text-body">{p.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WhatWeDoSpread() {
  return (
    <section className="bg-paper" aria-labelledby="what-title">
      <div className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0">
          <Photo image={BAND} sizes="100vw" />
        </div>
        <div className="hero-shade" aria-hidden="true" />
        <div className="container-site relative pb-44 pt-section lg:pb-56">
          <SectionHeading
            number="04"
            eyebrow="What we do for you"
            size="display"
            tone="dark"
            title={<span id="what-title" className="text-shadow-photo">{WHAT_WE_DO.title}</span>}
            titleClassName="max-w-[900px]"
            aside={<p className="t-body max-w-[380px] text-linen-200 text-shadow-soft">{WHAT_WE_DO.aside}</p>}
          />
        </div>
      </div>
      <div className="container-site -mt-32 flex flex-col gap-14 pb-section lg:-mt-40">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card id="what-buyer" eyebrow={WHAT_WE_DO.buyer.eyebrow} title={WHAT_WE_DO.buyer.title} items={BUYER_PROMISES} />
          <Card id="what-seller" eyebrow={WHAT_WE_DO.seller.eyebrow} title={WHAT_WE_DO.seller.title} items={SELLER_PROMISES} />
        </div>
        <div className="flex flex-col gap-8 border-t border-rule pt-10">
          <p className="t-eyebrow text-amber">{WHAT_WE_DO.both}</p>
          <ul className="grid gap-8 md:grid-cols-3 md:gap-10">
            {BOTH_PROMISES.map((p) => (
              <li key={p.title} className="flex flex-col gap-3 md:border-l md:border-rule md:pl-6">
                <h3 className="font-display text-[1.75rem] font-light italic leading-[1.14] text-navy">{p.title}</h3>
                <p className="t-body max-w-[40ch] text-body">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

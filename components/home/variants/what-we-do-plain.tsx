import { SectionHeading } from "@/components/section-heading";
import { BOTH_PROMISES, BUYER_PROMISES, SELLER_PROMISES, WHAT_WE_DO, type Step } from "../what-we-do-copy";

/**
 * "Plain": the Wave 0 treatment, kept for comparison. Two columns of steps
 * on paper with a short third band, stacked on phones. No photography.
 */
function Column({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: Step[] }) {
  return (
    <div className="flex flex-col gap-8" role="group" aria-labelledby={id}>
      <div className="flex flex-col gap-3 border-b border-rule pb-5">
        <p className="t-eyebrow text-amber">{eyebrow}</p>
        <h3 id={id} className="t-h2 text-navy">
          {title}
        </h3>
      </div>
      <ol className="flex flex-col gap-7">
        {items.map((p, i) => (
          <li key={p.title} className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6">
            <div className="flex flex-col gap-1">
              <span className="t-record text-navy">{String(i + 1).padStart(2, "0")}</span>
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

export function WhatWeDoPlain() {
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
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Column id="what-buyer" eyebrow={WHAT_WE_DO.buyer.eyebrow} title={WHAT_WE_DO.buyer.title} items={BUYER_PROMISES} />
          <Column id="what-seller" eyebrow={WHAT_WE_DO.seller.eyebrow} title={WHAT_WE_DO.seller.title} items={SELLER_PROMISES} />
        </div>
        <div className="flex flex-col gap-8 border-t border-rule pt-10">
          <p className="t-eyebrow text-amber">{WHAT_WE_DO.both}</p>
          <ul className="grid gap-8 md:grid-cols-3 md:gap-10">
            {BOTH_PROMISES.map((p) => (
              <li key={p.title} className="flex flex-col gap-2">
                <h3 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{p.title}</h3>
                <p className="t-body max-w-[40ch] text-body">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

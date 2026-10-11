import type { Route } from "next";
import Link from "next/link";
import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * The buyer's and seller's guides (/buy, /sell), after stacyhaas.com's: a
 * photograph across the top with the title on a card over its foot, then the
 * steps as full-width rows, a photograph on one side and the words on the
 * other, swapping sides at every step. Three ways onward at the end. One
 * layout for both pages, so the two guides read as a pair.
 */

export type GuideStep = {
  title: string;
  body: string;
  image: ImageRef;
};

const STEPS_ID = "steps";

export function GuideHero({ title, image }: { title: string; image: ImageRef }) {
  return (
    <section data-header-overlay className="relative -mt-header" aria-labelledby="guide-title">
      <div className="relative h-[72svh] min-h-[460px] max-h-[820px] overflow-hidden bg-navy">
        <Photo image={image} priority sizes="100vw" />
        {/* Shade only the top, under the header; the photograph is the point. */}
        <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-harbor-950/50 to-transparent" aria-hidden="true" />
      </div>
      <div className="container-site relative -mt-24 flex justify-center sm:-mt-32">
        <div className="relative flex w-full max-w-[620px] flex-col items-center gap-7 bg-navy px-8 pb-10 pt-12 text-center text-white shadow-[0_30px_60px_-30px_rgb(20_37_48/0.55)] sm:px-14 sm:pt-14">
          {/* A hairline frame inside the card. */}
          <span className="pointer-events-none absolute inset-3 border border-sky-300/25" aria-hidden="true" />
          <h1 id="guide-title" className="t-display relative font-light text-white">
            {title}
          </h1>
          <span className="relative block h-px w-16 bg-sky-300" aria-hidden="true" />
          <a
            href={`#${STEPS_ID}`}
            className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-navy transition-transform duration-300 hover:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
          >
            <span className="sr-only">To step 1</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * Step 1 has its photograph on the left and its words on the right, step 2
 * the other way round, and so on down the page. On a phone every step is the
 * photograph, then the words.
 */
export function GuideSteps({ steps, label }: { steps: GuideStep[]; label: string }) {
  return (
    <section id={STEPS_ID} aria-label={label} className="scroll-mt-header pt-16 lg:pt-24">
      <ol>
        {steps.map((s, i) => {
          const wordsFirst = i % 2 === 1;
          return (
            <li key={s.title} className="grid lg:grid-cols-2">
              <div className={cn("relative aspect-[4/3] overflow-hidden bg-navy lg:aspect-auto lg:min-h-[620px]", wordsFirst && "lg:order-2")}>
                <Photo image={s.image} sizes="(min-width: 1024px) 50vw, 100vw" />
              </div>
              <div className={cn("flex items-center bg-parchment px-gutter py-14 sm:px-12 sm:py-16 lg:px-16 xl:px-24", wordsFirst && "lg:order-1")}>
                <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
                  <p className="flex items-center gap-4 font-display text-[clamp(1.5rem,2vw,1.875rem)] font-light leading-none text-sky-700">
                    <span className="block h-px w-10 bg-sky-500" aria-hidden="true" />
                    Step {i + 1}
                  </p>
                  <h2 className="t-h1 text-balance text-navy">{s.title}</h2>
                  <p className="t-body text-body lg:text-[18px] lg:leading-[1.75]">{s.body}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export type GuideLink = { href: Route; title: string; image: ImageRef };

/** Three ways onward, photographs with the words set on them, the same card grammar as the home page's Buyer and Seller tiles. */
export function GuideNext({ title, links }: { title: string; links: GuideLink[] }) {
  return (
    <section className="bg-paper" aria-labelledby="guide-next-title">
      <div className="container-site flex flex-col gap-10 py-section">
        <h2 id="guide-next-title" className="t-h1 text-navy">
          {title}
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="door card group relative flex aspect-[4/3] w-full items-end overflow-hidden bg-navy text-white md:aspect-[4/5]"
              >
                <Photo image={{ ...l.image, alt: "" }} sizes="(min-width: 768px) 33vw, 100vw" className="card-img" />
                <div className="scrim" aria-hidden="true" />
                <h3 className="relative flex w-full items-end justify-between gap-5 p-6 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] font-light leading-[1.05] text-white text-shadow-photo lg:p-8">
                  {l.title}
                  <span aria-hidden="true" className="mb-1 text-[20px] transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

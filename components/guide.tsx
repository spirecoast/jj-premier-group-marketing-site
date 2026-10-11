import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * The buyer's and seller's guides (/buy, /sell): a title, a wide photograph,
 * then the steps in the order they happen with a photograph between each pair,
 * and three ways onward at the foot. One layout for both pages, so the two
 * guides read as a pair.
 */

export type GuideStep = {
  title: string;
  body: string;
  /** The photograph after this step. The last step has none, so the steps end on words. */
  image?: ImageRef;
};

export function GuideHero({ title, lead, actions, image }: { title: ReactNode; lead: string; actions: ReactNode; image: ImageRef }) {
  return (
    <>
      <section className="container-site grid gap-8 pt-section pb-12 lg:grid-cols-12 lg:items-end lg:gap-x-8 lg:pb-16">
        <h1 className="t-display text-navy lg:col-span-6">{title}</h1>
        <div className="flex flex-col gap-7 lg:col-span-5 lg:col-start-8">
          <p className="t-lead max-w-measure text-body">{lead}</p>
          <div className="flex flex-wrap gap-3.5">{actions}</div>
        </div>
      </section>
      <div className="container-site">
        <div className="relative aspect-[4/3] overflow-hidden bg-navy sm:aspect-[16/9] lg:aspect-[21/9]">
          <Photo image={image} priority sizes="(min-width: 1440px) 1248px, 100vw" />
        </div>
      </div>
    </>
  );
}

/**
 * The photographs between the steps take three shapes in turn: the full width
 * of the page, then three quarters set to the right, then three quarters set
 * to the left, so the eye moves down the page instead of straight through it.
 */
const PHOTO_SHAPES = [
  { frame: "w-full", aspect: "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]", sizes: "(min-width: 1440px) 1248px, 100vw" },
  { frame: "w-full lg:ml-auto lg:w-3/4", aspect: "aspect-[4/3] sm:aspect-[3/2]", sizes: "(min-width: 1440px) 936px, (min-width: 1024px) 75vw, 100vw" },
  { frame: "w-full lg:w-3/4", aspect: "aspect-[4/3] sm:aspect-[3/2]", sizes: "(min-width: 1440px) 936px, (min-width: 1024px) 75vw, 100vw" },
] as const;

export function GuideSteps({ steps, label }: { steps: GuideStep[]; label: string }) {
  return (
    <section aria-label={label} className="pb-section">
      <ol className="flex flex-col">
        {steps.map((s, i) => {
          const shape = PHOTO_SHAPES[i % PHOTO_SHAPES.length]!;
          return (
            <li key={s.title}>
              <div className="container-site grid gap-5 py-16 lg:grid-cols-12 lg:gap-x-8 lg:py-24">
                <div className="flex flex-col gap-4 lg:col-span-4">
                  <span className="block h-px w-12 bg-sky-500" aria-hidden="true" />
                  <p className="font-display text-[clamp(1.75rem,2.6vw,2.25rem)] font-light leading-none text-sky-700">Step {i + 1}</p>
                </div>
                <div className="flex flex-col gap-5 lg:col-span-7 lg:col-start-6">
                  <h2 className="t-h1 text-balance text-navy">{s.title}</h2>
                  <p className="t-lead max-w-measure text-body">{s.body}</p>
                </div>
              </div>
              {s.image ? (
                <div className="container-site">
                  <div className={cn("relative overflow-hidden bg-navy", shape.frame, shape.aspect)}>
                    <Photo image={s.image} sizes={shape.sizes} />
                  </div>
                </div>
              ) : null}
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
    <section className="bg-parchment" aria-labelledby="guide-next-title">
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

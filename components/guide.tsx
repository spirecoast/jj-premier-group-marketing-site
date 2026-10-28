import type { Route } from "next";
import Link from "next/link";
import { ChecklistSummary, StepCheck } from "@/components/guide-checklist";
import { ReadingCompanion } from "@/components/guides/companion";
import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import type { GuideKey } from "@/lib/guide-checklist";
import { productFamilies } from "@/lib/site";
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

/** A product's id in lib/site.ts (productFamilies), for the tool link under a step. */
export type StepTool = "atlas" | "atlas-match" | "atlas-move" | "encore" | "encore-planner" | "tide" | "tide-street" | "tide-sale-calculator";

function product(id: StepTool) {
  for (const f of productFamilies) {
    const item = f.items.find((i) => i.id === id);
    if (item) return item;
  }
  return null;
}

const STEPS_ID = "steps";

export function GuideHero({ title, image }: { title: string; image: ImageRef }) {
  return (
    <section data-header-overlay className="relative -mt-header" aria-labelledby="guide-title">
      <div className="relative h-[72svh] min-h-[480px] max-h-[800px] overflow-hidden bg-navy">
        <Photo image={image} priority sizes="100vw" />
        {/* Shade the top under the header and the foot behind the card; the photograph is the point. */}
        <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-harbor-950/50 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-harbor-950/45 to-transparent" aria-hidden="true" />
      </div>
      {/*
        The card straddles the photograph's edge, half on the photograph and
        half on the page. It is shifted up by half its own height, so the
        space it keeps in the flow is the half that hangs below the edge.
      */}
      <div className="container-site relative z-10 flex -translate-y-1/2 justify-center">
        <div className="guide-glass guide-glass-straddle rise d2 relative flex w-full max-w-[560px] flex-col items-center gap-6 px-7 pb-9 pt-10 text-center text-white sm:px-12 sm:pt-12">
          <span className="pointer-events-none absolute inset-2.5 border border-white/25" aria-hidden="true" />
          <h1 id="guide-title" className="relative font-display text-[clamp(2.05rem,1rem+3.2vw,3.45rem)] font-extralight leading-[1.04] tracking-[-0.02em] text-balance text-white">
            {title}
          </h1>
          <span className="relative block h-px w-14 bg-sky-300" aria-hidden="true" />
          <a
            href={`#${STEPS_ID}`}
            className="relative grid h-12 w-12 place-items-center bg-white/90 text-navy transition-[transform,background-color] duration-(--dur-panel) hover:translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
          >
            <span className="sr-only">To step 1</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/** The id of step n (1-based) on the page: the companion's list and the address bar both use it. */
export const stepId = (n: number) => `step-${n}`;

/**
 * Step 1 has its photograph on the left and its words on the right, step 2
 * the other way round, and so on down the page. On a phone every step is the
 * photograph, then the words. The reading companion sticks under the header
 * for the length of the list: "Step 3 of 10 · Get prequalified", the ten
 * numerals from lg, the line that fills as the page is read, and the list
 * as a sheet, so a reader can skim the guide or return to a step.
 */
export function GuideSteps({
  steps,
  label,
  checklist,
  tools = {},
}: {
  steps: GuideStep[];
  label: string;
  /** Which guide's checklist the steps keep (components/guide-checklist.tsx). */
  checklist?: GuideKey;
  /** Step number (1-based) to the tool that does that step's work, linked under its words. */
  tools?: Partial<Record<number, StepTool>>;
}) {
  const items = steps.map((s, i) => ({ id: stepId(i + 1), number: String(i + 1).padStart(2, "0"), title: s.title }));
  return (
    <section id={STEPS_ID} aria-label={label} className="relative scroll-mt-header">
      <ReadingCompanion items={items} articleId={STEPS_ID} label={label} word="Step" button="All steps" />
      <ol>
        {steps.map((s, i) => {
          const wordsFirst = i % 2 === 1;
          return (
            <li key={s.title} id={stepId(i + 1)} className="grid scroll-mt-[calc(var(--header-h)+3rem)] lg:grid-cols-2">
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
                  <StepToolLink id={tools[i + 1]} />
                  {checklist ? <StepCheck guide={checklist} step={i + 1} title={s.title} /> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {checklist ? <ChecklistSummary guide={checklist} titles={steps.map((s) => s.title)} /> : null}
    </section>
  );
}

/** The tool for a step, by its product name and the short line it carries in the menus. */
function StepToolLink({ id }: { id?: StepTool }) {
  const item = id ? product(id) : null;
  if (!item) return null;
  return (
    <Link href={item.href as Route} className="group t-small flex items-baseline gap-2 self-start text-sky-700 transition-colors hover:text-navy">
      <span>
        <span className="font-medium">{item.label}</span>
        <span className="text-body"> · {item.short}</span>
      </span>
      <span aria-hidden="true" className="transition-transform duration-(--dur-panel) group-hover:translate-x-1 motion-reduce:transition-none">
        →
      </span>
    </Link>
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
                  <span aria-hidden="true" className="mb-1 text-[20px] transition-transform duration-(--dur-panel) group-hover:translate-x-1">
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

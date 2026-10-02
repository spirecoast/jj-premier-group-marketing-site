import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { Photo } from "@/components/photo";
import { Ask } from "@/components/relocate/ask";
import { PlanView } from "@/components/relocate/plan-view";
import { PlannerProvider } from "@/components/relocate/planner-context";
import { Questions } from "@/components/relocate/questions";
import { SectionHeading } from "@/components/section-heading";
import { getTeam } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { DIFFERENT, FAQS, FAQ_SECTION, FROM_AWAY, HERO } from "@/lib/relocate/copy";
import { SOURCES } from "@/lib/relocate/sources";
import { hasAnswers, parseAnswers, type QueryParams } from "@/lib/relocate/url";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Moving to the Suncoast",
  description:
    "Six questions, no email, and you get a dated relocation plan: the Florida contract deadlines, the week insurance has to be bound, the homestead cycle your move-in falls in, and the days the state gives a new resident. Every rule comes with its source.",
  path: "/relocate",
  fileImage: true, // opengraph-image.tsx beside this page
});

const FRAMES = {
  away: img("library/place-skyway-bridge", "The Sunshine Skyway Bridge over Tampa Bay, from above", "50% 55%"),
};

const FAQ_ITEMS: Faq[] = FAQS.map((f) => ({
  q: f.q,
  answer: f.answer,
  a: (
    <>
      <p>{f.answer}</p>
      <p className="mt-3 t-small text-graphite-500">
        Source:{" "}
        <a href={SOURCES[f.source].url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
          {SOURCES[f.source].label}
        </a>
      </p>
    </>
  ),
}));

/**
 * Print: the plan alone. Everything else on the page, and the site chrome
 * around it, is hidden; the plan's bodies drop so dates, titles, bases,
 * callouts and the documents list print clean, usually on one sheet and
 * honestly on two when the plan is long.
 */
const PRINT_CSS = `
@media print {
  header, footer, .fixed, [data-mobile-action-bar] { display: none !important; }
  main > *:not(#plan) { display: none !important; }
  @page { size: letter; margin: 10mm 11mm; }
  #plan { padding: 0 !important; gap: 7pt !important; color: #2b2d30; }
  #plan a { text-decoration: none; color: inherit; }
  #plan .t-h1 { font-size: 17pt; line-height: 1.05; }
  #plan .t-eyebrow { font-size: 6.5pt; }
  #plan [data-print="summary"] { font-size: 7.5pt; line-height: 1.3; }
  #plan [data-print="callouts"] { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; }
  #plan [data-print="callout"] { border: 0; background: transparent; padding: 0; gap: 1pt; }
  #plan [data-print="phases"] { column-count: 2; column-gap: 8mm; gap: 0; display: block; }
  #plan [data-print="phase"] { gap: 0; margin-bottom: 5pt; }
  #plan [data-print="phase"] > div { break-after: avoid; }
  #plan [data-print="phase-title"] { font-size: 10pt; margin-bottom: 1pt; }
  #plan [data-print="row"] { display: block; break-inside: avoid; padding: 2.5pt 0; border-top: 0.5pt solid #ddd; }
  #plan [data-print="when"] { display: inline-block; width: 62pt; vertical-align: top; }
  #plan [data-print="when"] .t-record { font-size: 6.8pt; letter-spacing: 0; }
  #plan [data-print="what"] { display: inline-block; width: calc(100% - 66pt); vertical-align: top; gap: 0; }
  #plan [data-print="title"] { font-size: 8.5pt; line-height: 1.2; }
  #plan [data-print="row"] .t-mono-sm { font-size: 5.5pt; padding: 0 2pt; }
  #plan [data-print="basis"] { font-size: 6.6pt; line-height: 1.3; max-width: none; }
  #plan [data-print="source"] { font-size: 6.2pt; line-height: 1.25; color: #777; }
  #plan [data-print="body"] { font-size: 7pt; line-height: 1.3; }
  #plan [data-print="foot"] { display: grid; grid-template-columns: 1fr 1fr; gap: 0 8mm; padding-top: 4pt; border-top: 0.5pt solid #c4b69f; }
  #plan [data-print="foot"] > div { gap: 2pt; }
  #plan [data-print="foot"] .t-h2 { font-size: 10pt; }
  #plan [data-print="foot"] .t-small { font-size: 6.6pt; line-height: 1.3; }
  #plan [data-print="foot"] ul { gap: 1pt; }
}
`;

export default async function RelocatePage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const [params, team] = await Promise.all([searchParams, getTeam()]);
  const today = new Date().toISOString().slice(0, 10);
  const provided = hasAnswers(params);
  const answers = parseAnswers(params, today);

  return (
    <PlannerProvider today={today} initialAnswers={answers} initialHasAnswers={provided}>
      <style precedence="default" href="relocate-print">
        {PRINT_CSS}
      </style>
      <JsonLd
        data={[
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Buy", path: "/buy" },
            { name: "Moving to the Suncoast", path: "/relocate" },
          ]),
        ]}
      />

      {/* 01 · Hero: the masthead carries the eyebrow and the heading. The planner is right underneath; nothing is gated. */}
      <Masthead route="/relocate" eyebrow={HERO.eyebrow} title={HERO.title} titleId="relocate-title" titleClassName="max-w-[760px]" className="print:hidden" />
      <section className="container-site grid gap-8 py-section print:hidden lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20" aria-label="What the planner does">
        <p className="t-lead max-w-[600px] text-body">{HERO.lead}</p>
        <p className="t-body max-w-measure text-body lg:pb-2">{HERO.body}</p>
      </section>

      {/* 02 · The six questions. */}
      <Questions />

      {/* 03 and 04 · The plan and its exports. */}
      <PlanView />

      {/* 05 · What's different here. */}
      <section className="bg-parchment print:hidden" aria-labelledby="different-title">
        <div className="container-site flex flex-col gap-10 py-section">
          <SectionHeading eyebrow={DIFFERENT.eyebrow} title={<span id="different-title">{DIFFERENT.title}</span>} />
          <ul className="grid gap-8 md:grid-cols-3 md:gap-10">
            {DIFFERENT.cards.map((c) => (
              <li key={c.title} className="flex flex-col gap-3 border-t border-rule pt-6">
                <span className="-mt-6 h-px w-12 bg-amber" aria-hidden="true" />
                <h3 className="t-h3 pt-5 text-navy">{c.title}</h3>
                <p className="t-body max-w-[44ch] text-body">{c.body}</p>
                <p className="t-small flex flex-col gap-1 text-graphite-600">
                  <a href={SOURCES[c.source].url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
                    {SOURCES[c.source].label}
                  </a>
                  {c.guide ? (
                    <Link href={c.guide.href as Route} className="underline underline-offset-4 hover:text-navy">
                      {c.guide.label}
                    </Link>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 06 · How we work with you from away. */}
      <section className="container-site grid gap-10 py-section print:hidden lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="away-title">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <SectionHeading eyebrow={FROM_AWAY.eyebrow} title={<span id="away-title">{FROM_AWAY.title}</span>} />
          <div className="relative hidden aspect-[4/3] overflow-hidden bg-linen-100 lg:block">
            <Photo image={FRAMES.away} sizes="(min-width: 1024px) 420px, 100vw" />
          </div>
          <p className="t-small flex flex-wrap gap-x-4 gap-y-1 text-graphite-600">
            <Link href={FROM_AWAY.guide.href as Route} className="underline underline-offset-4 hover:text-navy">
              {FROM_AWAY.guide.label}
            </Link>
            <a href={FROM_AWAY.airport.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
              {FROM_AWAY.airport.label}
            </a>
          </p>
        </div>
        <ol className="flex flex-col gap-7">
          {FROM_AWAY.items.map((p, i) => (
            <li key={p.title} className="grid gap-2 border-t border-hairline pt-6 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-6">
              <span className="t-record text-navy">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{p.title}</h3>
                <p className="t-body max-w-[56ch] text-body">{p.body}</p>
                {"source" in p && p.source ? (
                  <a href={SOURCES[p.source].url} target="_blank" rel="noopener noreferrer" className="t-small text-graphite-500 underline underline-offset-4 hover:text-navy">
                    {SOURCES[p.source].label}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 07 · Questions people ask first. */}
      <section className="container-site grid gap-10 pb-section print:hidden lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="faq-title">
        <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
          <SectionHeading eyebrow={FAQ_SECTION.eyebrow} title={<span id="faq-title">{FAQ_SECTION.title}</span>} />
        </div>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* 08 · The ask. */}
      <Ask team={team.map((m) => ({ slug: m.slug, name: m.name, phone: m.phone, phoneE164: m.phoneE164 }))} />
    </PlannerProvider>
  );
}

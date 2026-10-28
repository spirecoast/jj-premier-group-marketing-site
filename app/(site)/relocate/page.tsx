import type { Metadata } from "next";
import { FaqAccordion, type Faq } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { Ask } from "@/components/relocate/ask";
import { MoveHelp } from "@/components/relocate/move-help";
import { PlanView } from "@/components/relocate/plan-view";
import { PlannerProvider } from "@/components/relocate/planner-context";
import { Questions } from "@/components/relocate/questions";
import { getTeam } from "@/lib/content";
import { placesEnabled } from "@/lib/places/google";
import { FAQS, FAQ_SECTION, HERO } from "@/lib/relocate/copy";
import { SOURCES } from "@/lib/relocate/sources";
import { MOVE_DRAFT, RELOCATE_KEYS } from "@/lib/relocate/url";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { SITE_TIMEZONE } from "@/lib/content/format";
import { dayIn } from "@/lib/time";
import { ExternalLink } from "@/components/ui/external-link";
import { IslandBoundary } from "@/components/ui/island-boundary";
import { UrlPending } from "@/components/url-pending";

export const metadata: Metadata = pageMetadata({
  title: "Atlas Move: your Florida move, to the day",
  description:
    "Answer five questions and get every date and deadline for your move on one page: the contract dates, insurance, homestead and Florida's new-resident rules.",
  path: "/relocate",
  fileImage: true, // opengraph-image.tsx beside this page
});

const FAQ_ITEMS: Faq[] = FAQS.map((f) => ({
  q: f.q,
  answer: f.answer,
  a: (
    <>
      <p>{f.answer}</p>
      <p className="mt-3 t-small text-graphite-500">
        Source:{" "}
        <ExternalLink href={SOURCES[f.source].url} className="underline underline-offset-4 hover:text-navy">
          {SOURCES[f.source].label}
        </ExternalLink>
      </p>
    </>
  ),
}));

/**
 * Print: the plan alone, on letter paper, with Atlas Move's lockup and the
 * day at its head and the sources, the two of us and a QR code of the plan's
 * link at its foot (components/keep). The plan keeps its key dates,
 * warnings, timeline, documents and who-pays-what, with the reasoning folds
 * and links left off.
 */
const PRINT_CSS = `
@media print {
  /* The page is the plan alone, headed and footed by components/keep/keep-sheet.tsx (keep.css hides the rest). */
  @page { size: letter; margin: 11mm 12mm; }
  #plan > div { padding: 0 !important; gap: 14pt !important; }
  #plan .t-display { font-size: 22pt; line-height: 1.05; }
  #plan .t-h2 { font-size: 13pt; }
  #plan .t-h3 { font-size: 11pt; }
  #plan .t-h4, #plan .t-body { font-size: 9pt; line-height: 1.35; }
  #plan .t-small, #plan .t-record { font-size: 8pt; }
  #plan [data-print="key"] { padding: 6pt 8pt; }
  #plan [data-print="key"] .font-display { font-size: 15pt; }
  /* Five across a letter page: each card is the date over its name, not the phone's two columns. */
  #plan [data-print="key"] { display: flex !important; flex-direction: column; gap: 4pt; }
  #plan [data-print="key"] > div:last-child { justify-content: flex-start; }
  #plan [data-print="key"] > div:last-child * { font-size: 9pt; line-height: 1.25; }
  #plan [data-print="row"] { break-inside: avoid; }
  #plan [data-print="row"] > div:last-child { padding-bottom: 8pt; }
  #plan [data-print="phase"] { gap: 6pt; }
  #plan [data-print="phase"] > div:first-child { break-after: avoid; }
  #plan [data-print="keys"] { grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 6pt; }
  #plan .key-dates { background: none !important; padding: 0 !important; }
  #plan .key-dates * { color: #102542 !important; background: none !important; box-shadow: none !important; backdrop-filter: none !important; }
  #plan .key-dates [data-print="key"] { border: 1px solid #d9d4c8 !important; }
  #plan a { color: inherit; text-decoration: none; }
}
`;

/**
 * Static: the server renders question one; a plan link's answers, the answers
 * in progress and today's date are applied in the browser
 * (components/relocate/planner-context.tsx). The server's "today" is the
 * site's own day (not the UTC day), the best guess until the browser
 * replaces it with the visitor's.
 */
export default async function RelocatePage() {
  const team = await getTeam();
  const today = dayIn(SITE_TIMEZONE);

  return (
    <PlannerProvider serverToday={today}>
      <style precedence="default" href="relocate-print">
        {PRINT_CSS}
      </style>
      <JsonLd
        data={[
          faqJsonLd(FAQS),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Atlas Move", path: "/relocate" },
          ]),
        ]}
      />

      <Masthead route="/relocate" titleId="relocate-title" className="print:hidden">
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">{HERO.lead}</p>
      </Masthead>

      <UrlPending keys={RELOCATE_KEYS} draftKey={MOVE_DRAFT} />
      <IslandBoundary name="the planner" minHeight="480px">
        <div data-url-island="">
          <Questions />
          <PlanView />
        </div>
      </IslandBoundary>
      <MoveHelp enabled={placesEnabled()} />

      <Ask team={team.map((m) => ({ slug: m.slug, name: m.name, phone: m.phone, phoneE164: m.phoneE164 }))} />

      <section className="container-site grid gap-10 border-t border-hairline py-section print:hidden lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="t-h1 text-navy">
          {FAQ_SECTION.title}
        </h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>
    </PlannerProvider>
  );
}

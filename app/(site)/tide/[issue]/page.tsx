import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EqualHousingMark } from "@/components/equal-housing";
import { EventCard } from "@/components/event-card";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { SectionHeading } from "@/components/section-heading";
import { TideCover } from "@/components/tide/cover";
import { IssueChart } from "@/components/tide/issue-chart";
import { MarketChapter } from "@/components/tide/market-chapter";
import { Moves } from "@/components/tide/moves";
import { TeamNotes } from "@/components/tide/team-notes";
import { getEvent } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import type { Event } from "@/lib/content/types";
import { loadEncoreIndex } from "@/lib/encore/data";
import { guideHref } from "@/lib/guides/slugs";
import { fill } from "@/lib/issues/copy";
import { easternDay, monthLabel } from "@/lib/issues/render";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { encorePicks } from "@/lib/tide/encore";
import { num } from "@/lib/tide/issue";
import { TIDE_ISSUES, isIssueMonth } from "@/lib/tide/issues";
import { loadIssueModel } from "@/lib/tide/load";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * /tide/<issue>: one Tide issue, the monthly letter, rendered from the model
 * in lib/tide/issue.ts. The sections and their order are the standard every
 * issue reuses (docs/ISSUES.md, "The web issue"). The page types no figure:
 * each comes from the county sales through the model. The words are
 * hand-written in lib/tide/issues.ts, every field optional: a field that
 * isn't written falls back to a computed line or leaves its slot out, so the
 * page reads as finished at every stage. Every number in the words is checked
 * against the model (lib/tide/narrative.test.ts).
 */

type Params = Promise<{ issue: string }>;

export const dynamicParams = false;
// "Out this month" comes from the live Encore calendar.
export const revalidate = 3600;

export function generateStaticParams() {
  return TIDE_ISSUES.map((e) => ({ issue: e.issue }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { issue } = await params;
  const model = isIssueMonth(issue) ? await loadIssueModel(issue) : null;
  if (!model) return { title: "Issue not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: model.title,
    description: model.narrative?.dek ?? model.description,
    path: `/tide/${model.issue}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

/** The three markets on the dark band: Sky 300, Mist and Sky 500, in market order. */
const PART_FILL = ["#89d4e3", "#c7e7ef", "#44a6bb"];

const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

/** Up to three Encore events in the issue month, one per market where the calendar has one. Empty when the calendar can't be read. */
async function outThisMonth(issue: string): Promise<{ event: Event; at: { startsAt: string; endsAt?: string; allDay?: boolean } }[]> {
  try {
    const picks = encorePicks(await loadEncoreIndex(), issue, 3, easternDay(new Date()));
    const events = await Promise.all(picks.map((p) => getEvent(p.slug)));
    return picks.flatMap((p, i) => (events[i] ? [{ event: events[i]!, at: p.at }] : []));
  } catch {
    return [];
  }
}

export default async function TideIssuePage({ params }: { params: Params }) {
  const { issue } = await params;
  const model = isIssueMonth(issue) ? await loadIssueModel(issue) : null;
  if (!model) notFound();
  const path = `/tide/${model.issue}`;
  const story = model.narrative;
  const told = Boolean(story?.opening.length);
  const buying = story?.buying ?? [];
  const selling = story?.selling ?? [];
  const hasMoves = Boolean(buying.length || selling.length || story?.buyers.length || story?.sellers.length);
  const events = await outThisMonth(model.issue);
  const month = model.dataLabel.split(" ")[0]!;
  const c = model.combined;

  let n = 0;
  const no = () => String((n += 1)).padStart(2, "0");
  const storyNo = no();
  const figureNo = no();
  const chapterNos = model.markets.map(() => no());
  const movesNo = hasMoves ? no() : null;
  const chartsNo = no();
  const contents = [
    { href: "#what-title", label: told ? W.storyEyebrow : W.aboutEyebrow, n: storyNo },
    { href: "#figure-title", label: W.contentsFigure, n: figureNo },
    ...model.markets.map((m, i) => ({ href: `#${m.market}`, label: m.name, n: chapterNos[i]! })),
    ...(movesNo ? [{ href: "#moves-title", label: W.contentsMoves, n: movesNo }] : []),
    { href: "#charts-title", label: W.contentsCharts, n: chartsNo },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: model.title,
          alternativeHeadline: story?.headline ?? undefined,
          description: story?.dek ?? model.description,
          image: absoluteUrl(model.cover.src),
          datePublished: `${model.issue}-01`,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, url: site.url },
          mainEntityOfPage: absoluteUrl(path),
          isPartOf: { "@type": "Periodical", name: "Tide", url: absoluteUrl("/tide") },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tide", path: "/tide" },
          { name: model.issueLabel, path },
        ])}
      />

      <article id="tide-issue" className="flex flex-col">
        {/* 1. The cover */}
        <TideCover model={model} contents={contents} />

        {/* 2. The story. id="what-title": the anchor site search links the story to (lib/search/sources.ts). */}
        <section className="container-site py-section" aria-labelledby="what-title">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="flex flex-col gap-3 lg:col-span-3 lg:pt-2">
              <p className="t-eyebrow text-amber">{`${storyNo} · ${model.dataLabel}`}</p>
              <h2 id="what-title" className="t-h2 scroll-mt-24 text-navy">
                {told ? W.storyEyebrow : W.aboutEyebrow}
              </h2>
            </div>
            <div className="flex flex-col gap-8 lg:col-span-8">
              <div className="tide-prose tide-story flex max-w-[66ch] flex-col gap-6" data-tide-opening="">
                {(told ? story!.opening : [model.note, model.intro]).map((p, i) => (
                  <p key={p.slice(0, 40)} className={i === 0 ? "guide-drop" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
              {told ? <p className="t-small max-w-[66ch] border-t border-hairline pt-5 text-body-muted">{`${model.note} ${model.intro}`}</p> : null}
            </div>
          </div>
        </section>

        {/* 3. One big figure: the three markets together */}
        <section className="guide-cover-ground tide-figure text-white" aria-labelledby="figure-title">
          <div className="container-site grid gap-12 py-section lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="flex flex-col gap-5 lg:col-span-7">
              <p className="t-eyebrow text-mist">{`${figureNo} · ${fill(W.combinedEyebrow, { data: model.dataLabel })}`}</p>
              <h2 id="figure-title" className="mt-4 flex flex-col gap-5">
                <span className="-ml-[0.04em] font-display text-[clamp(6rem,3rem+13vw,14rem)] leading-[0.86] font-extralight tracking-[-0.04em] text-white tabular-nums">{num(c.count)}</span>
                <span className="max-w-[28ch] font-display text-[clamp(1.375rem,1.05rem+1.1vw,2rem)] leading-[1.22] font-light text-linen-100">{model.combinedLine}</span>
              </h2>
              <p className="t-record text-linen-200">
                {[c.typical !== null ? fill(W.combinedTypical, { value: num(c.typical) }) : null, c.lastYear ? fill(W.combinedLastYear, { month: monthLabel(c.lastYear.month), value: num(c.lastYear.count) }) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-5">
              <p className="t-label text-mist">{W.combinedPartsLabel}</p>
              <div className="flex h-2 w-full gap-[3px]" aria-hidden="true">
                {c.parts.map((p, i) => (
                  <span key={p.market} className="h-full" style={{ width: `${p.share ?? 0}%`, background: PART_FILL[i] }} />
                ))}
              </div>
              <dl className="grid gap-0 sm:grid-cols-3 sm:gap-4">
                {c.parts.map((p, i) => (
                  <div key={p.market} className="flex items-baseline justify-between gap-4 border-t border-sky-300/25 py-3 sm:flex-col sm:items-stretch sm:justify-start sm:gap-1.5 sm:pb-0">
                    <dt className="flex items-center gap-2 text-[0.875rem] leading-snug text-linen-100">
                      <span className="size-2 shrink-0" style={{ background: PART_FILL[i] }} aria-hidden="true" />
                      {p.name}
                    </dt>
                    <dd className="flex items-baseline gap-3 sm:flex-col sm:gap-1.5">
                      <span className="font-mono text-[1.375rem] leading-none text-white tabular-nums">{num(p.count)}</span>
                      <span className="t-record text-linen-200">{p.share === null ? "–" : `${p.share}%`}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 4. The three market chapters */}
        {model.markets.map((m, i) => (
          <MarketChapter key={m.market} m={m} n={chapterNos[i]!} dataLabel={model.dataLabel} move={story?.marketMoves[m.market] ?? null} />
        ))}

        {/* 5. If you're buying, if you're selling: once written */}
        {movesNo ? (
          <section className="bg-linen-100" aria-labelledby="moves-title">
            <div className="container-site flex flex-col gap-12 py-section">
              <SectionHeading number={movesNo} eyebrow={fill(W.movesEyebrow, { data: model.dataLabel })} title={<span id="moves-title">{W.movesHeading}</span>} className="scroll-mt-24" />
              <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
                <Moves id="buyers" heading={W.buyersHeading} moves={buying} legacy={story?.buyers ?? []} />
                <Moves id="sellers" heading={W.sellersHeading} moves={selling} legacy={story?.sellers ?? []} />
              </div>
              <p className="t-small max-w-measure text-body-muted">{W.limits}</p>
            </div>
          </section>
        ) : null}

        {/* 6. The two charts */}
        <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="charts-title">
          <SectionHeading
            number={chartsNo}
            eyebrow={fill(W.chartsEyebrow, { from: monthLabel(model.charts.sales.months[0]!), to: model.dataLabel })}
            title={<span id="charts-title" className="scroll-mt-24">{W.chartsHeading}</span>}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <IssueChart chart={model.charts.sales} />
            <IssueChart chart={model.charts.ppsf} />
          </div>
        </section>

        {/* 7. What we're watching: once written */}
        {story?.watch.length ? (
          <section className="border-t border-hairline" aria-labelledby="watch-title">
            <div className="container-site grid gap-8 py-section lg:grid-cols-12 lg:gap-16">
              <div className="flex flex-col gap-3 lg:col-span-4">
                <p className="t-eyebrow text-amber">{`${no()} · ${model.issueLabel}`}</p>
                <h2 id="watch-title" className="t-h1 text-navy">
                  {W.watchHeading}
                </h2>
              </div>
              <ol className="flex flex-col lg:col-span-8">
                {story.watch.map((w, i) => (
                  <li key={w.slice(0, 40)} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-t border-hairline py-6">
                    <span className="font-mono text-[0.8125rem] text-sky-700 tabular-nums" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="max-w-[60ch] font-display text-[1.375rem] leading-[1.35] font-light text-navy">{w}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        {/* 8. The signed notes: each only when written (sample previews show empty ones as placeholders) */}
        {model.notes.length ? <TeamNotes notes={model.notes} eyebrow={`${no()} · ${W.notesEyebrow}`} /> : null}

        {/* 9. Out this month, from the Encore calendar */}
        {events.length ? (
          <section className="bg-parchment" aria-labelledby="encore-title">
            <div className="container-site flex flex-col gap-10 py-section">
              <SectionHeading
                number={no()}
                eyebrow={fill(W.encoreEyebrow, { issue: model.issueLabel })}
                title={<span id="encore-title">{W.encoreHeading}</span>}
                aside={
                  <Link href="/calendar" className="link-rule">
                    {W.encoreAll}
                  </Link>
                }
              />
              <p className="t-body max-w-measure text-body">{fill(W.encoreIntro, { month: model.issueLabel.split(" ")[0]! })}</p>
              <ul className="grid gap-5 md:grid-cols-3">
                {events.map(({ event, at }) => (
                  <li key={event.slug} className="flex">
                    <EventCard event={event} at={at} className="w-full" sizes="(min-width: 768px) 30vw, 100vw" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* 10. Read next: the guides published that month */}
        <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="guides-title">
          <SectionHeading
            number={no()}
            eyebrow={model.issueLabel}
            title={<span id="guides-title">{W.guidesHeading}</span>}
            aside={
              <Link href="/guides" className="link-rule">
                {W.guidesAll}
              </Link>
            }
          />
          {model.guides.length ? (
            <ul className="grid gap-x-10 md:grid-cols-2">
              {model.guides.map((g) => (
                <li key={g.slug} className="flex border-t border-rule">
                  <Link href={guideHref(g.slug) as Route} className="group flex w-full flex-col gap-2 py-6">
                    <p className="t-record text-graphite-500">{formatDateLong(noon(g.publishedAt))}</p>
                    <h3 className="t-h2 text-navy transition-colors group-hover:text-sky-700">{g.title}</h3>
                    <p className="t-small max-w-[60ch] text-body-muted">{g.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-body">{W.guidesNone}</p>
          )}
        </section>

        {/* The ask */}
        <section className="border-t border-rule bg-linen-100" aria-labelledby="ask-title">
          <div className="container-site grid gap-8 py-14 md:grid-cols-2 md:items-center md:gap-12 lg:py-16">
            <div className="flex flex-col gap-3">
              <p className="t-eyebrow text-amber">Tide</p>
              <h2 id="ask-title" className="t-h1 text-navy">
                {W.askHeading}
              </h2>
              <p className="t-body max-w-measure text-body">{W.askBody}</p>
            </div>
            <LetterForm />
          </div>
        </section>

        {/* 11. Method and sources */}
        <section className="container-site py-14 lg:py-16" aria-labelledby="method-title">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-16">
            <h2 id="method-title" className="t-label text-linen-700 lg:col-span-3">
              {W.methodHeading}
            </h2>
            <div className="flex max-w-[78ch] flex-col gap-3 lg:col-span-9">
              <p className="t-record text-graphite-600">{model.source}</p>
              <p className="t-small text-body-muted">{model.methods}</p>
              <p className="t-small flex items-center gap-3 text-body-muted">
                <EqualHousingMark className="text-graphite-600" />
                {W.fairHousingLine}
              </p>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}

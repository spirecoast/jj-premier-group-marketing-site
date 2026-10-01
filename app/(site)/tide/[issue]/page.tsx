import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { IssueChart } from "@/components/tide/issue-chart";
import { formatDateLong } from "@/lib/content/format";
import { fill } from "@/lib/issues/copy";
import { monthLabel } from "@/lib/issues/render";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, usd, type IssueMarket } from "@/lib/tide/issue";
import { TIDE_ISSUES, isIssueMonth } from "@/lib/tide/issues";
import { loadIssueModel } from "@/lib/tide/load";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/**
 * /tide/<issue>: one Tide issue, rendered from the model in lib/tide/issue.ts.
 * The sections and their order are the standard every issue reuses
 * (docs/ISSUES.md, "The web issue"). The page types no figure: each comes
 * from the county sales through the model.
 */

type Params = Promise<{ issue: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return TIDE_ISSUES.map((e) => ({ issue: e.issue }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { issue } = await params;
  const model = isIssueMonth(issue) ? await loadIssueModel(issue) : null;
  if (!model) return { title: "Issue not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: model.title,
    description: model.description,
    path: `/tide/${model.issue}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);
const pct = (n: number | null) => (n === null ? "–" : `${n}%`);
const money = (n: number | null) => (n === null ? "–" : usd(n));

function Figure({ value, label, typical, sample }: { value: string; label: string; typical: string; sample?: string }) {
  return (
    <div className="flex flex-col gap-1 border-t border-hairline pt-4">
      <dt className="t-label order-2 text-linen-700">{label}</dt>
      <dd className="order-1 font-mono text-[1.75rem] leading-none font-medium text-navy">{value}</dd>
      <dd className="t-record order-3 text-graphite-600">{typical}</dd>
      {sample ? <dd className="order-4 font-mono text-[11px] leading-snug tracking-[0.04em] text-graphite-500">{sample}</dd> : null}
    </div>
  );
}

function MarketCard({ m }: { m: IssueMarket }) {
  const s = m.stats;
  const b = m.baseline;
  const typical = (v: number | null, f: (n: number) => string) => (v === null ? W.typicalNone : fill(W.typical, { value: f(v) }));
  return (
    <article className="flex flex-col gap-5 border border-hairline bg-white p-6" aria-labelledby={`market-${m.market}`}>
      <h3 id={`market-${m.market}`} className="t-h2 text-navy">
        {m.name}
      </h3>
      <dl className="grid gap-5">
        <Figure value={num(s.count)} label={W.figureSales} typical={typical(b.count, num)} />
        <Figure value={money(s.medianPrice)} label={W.figureMedian} typical={typical(b.medianPrice, usd)} sample={fill(W.sampleHomes, { n: num(s.priceSample) })} />
        <Figure value={money(s.medianPpsf)} label={W.figurePpsf} typical={typical(b.medianPpsf, usd)} sample={fill(W.sampleSqft, { n: num(s.ppsfSample) })} />
        <Figure
          value={pct(s.newBuildPct)}
          label={W.figureNew}
          typical={typical(b.newBuildPct, (n) => `${n}%`)}
          sample={fill(W.sampleNew, { n: num(s.newBuild), count: num(s.count) })}
        />
      </dl>
      <Link href={m.href as Route} className="t-small mt-auto self-start py-2 text-sky-700 underline underline-offset-4 hover:text-navy">
        {fill(W.marketLink, { market: m.name })}
      </Link>
    </article>
  );
}

function SectionTitle({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      <p className="t-eyebrow text-amber">{eyebrow}</p>
      <h2 id={id} className="t-h1 text-navy">
        {title}
      </h2>
      {intro ? <p className="t-body text-body">{intro}</p> : null}
    </div>
  );
}

export default async function TideIssuePage({ params }: { params: Params }) {
  const { issue } = await params;
  const model = isIssueMonth(issue) ? await loadIssueModel(issue) : null;
  if (!model) notFound();
  const path = `/tide/${model.issue}`;
  const showWhat = Boolean(model.commentary) || model.showPlaceholder;
  let n = 0;
  const no = () => String((n += 1)).padStart(2, "0");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: model.title,
          description: model.description,
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

      <article className="flex flex-col">
        {/* (a) Masthead */}
        <header className="container-site flex flex-col gap-8 pt-10 pb-12 md:pt-14 md:pb-16">
          <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
            <Link href="/tide" className="-my-2 inline-block py-2 transition-colors hover:text-navy">
              Tide
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-navy" aria-current="page">
              {model.issueLabel}
            </span>
          </nav>
          <div className="flex flex-col gap-5 border-t-2 border-deep-harbor pt-8">
            <p className="t-eyebrow text-amber">{model.eyebrow}</p>
            <h1 className="flex flex-col gap-2 text-navy">
              <span className="font-display text-[clamp(3.5rem,2rem+6vw,7rem)] leading-[0.9] font-light tracking-[-0.02em]">{W.wordmark}</span>
              <span className="t-h1">{model.issueLabel}</span>
            </h1>
            <p className="t-lead max-w-[720px] text-body">{model.note}</p>
            <p className="t-body max-w-measure text-body-muted">{model.intro}</p>
          </div>
        </header>

        {/* (b) The three markets */}
        <section className="bg-linen-100" aria-labelledby="markets-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <SectionTitle id="markets-title" eyebrow={`${no()} · ${model.dataLabel}`} title={fill(W.marketsHeading, { data: model.dataLabel })} intro={fill(W.marketsIntro, { data: model.dataLabel })} />
            <div className="grid gap-5 md:grid-cols-3">
              {model.markets.map((m) => (
                <MarketCard key={m.market} m={m} />
              ))}
            </div>
          </div>
        </section>

        {/* (c, d) The two charts */}
        <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="charts-title">
          <SectionTitle id="charts-title" eyebrow={`${no()} · ${fill(W.chartsEyebrow, { from: monthLabel(model.charts.sales.months[0]!), to: model.dataLabel })}`} title={W.chartsHeading} />
          <div className="grid gap-5 lg:grid-cols-2">
            <IssueChart chart={model.charts.sales} />
            <IssueChart chart={model.charts.ppsf} />
          </div>
        </section>

        {/* (e) Where it sold */}
        <section className="border-t border-hairline" aria-labelledby="streets-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <SectionTitle id="streets-title" eyebrow={`${no()} · ${model.dataLabel}`} title={W.streetsHeading} intro={fill(W.streetsIntro, { data: model.dataLabel })} />
            <div className="grid gap-5 md:grid-cols-3">
              {model.markets.map((m) => (
                <div key={m.market} className="flex flex-col gap-3 border border-hairline bg-white p-6">
                  <h3 className="t-h3 text-navy">{m.name}</h3>
                  {m.streets.length ? (
                    <ol className="flex flex-col">
                      {m.streets.map((s, i) => (
                        <li key={s.label} className="flex items-baseline justify-between gap-4 border-t border-hairline py-2.5 first:border-t-0">
                          <span className="t-body flex gap-3 text-body">
                            <span className="t-record text-graphite-500" aria-hidden="true">
                              {i + 1}
                            </span>
                            {s.label}
                          </span>
                          <span className="t-record shrink-0 text-graphite-600">{fill(W.streetSales, { count: num(s.count) })}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="t-small text-body-muted">{W.streetsNone}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* (f) What it means: the agents' paragraphs; a marked placeholder only in sample previews */}
        {showWhat ? (
          <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="what-title">
            <SectionTitle id="what-title" eyebrow={`${no()} · ${W.whatEyebrow}`} title={W.whatHeading} />
            {model.commentary ? (
              <div className="prose-jj guide flex max-w-measure flex-col gap-5 text-[1.125rem]">
                {model.commentary.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            ) : (
              <div className="flex max-w-measure flex-col gap-2 border-2 border-dashed border-warning bg-warning-fill p-6" role="note">
                <p className="t-mono-sm text-warning">{W.placeholderLabel}</p>
                <p className="t-body text-ink italic">{W.placeholder}</p>
              </div>
            )}
          </section>
        ) : null}

        {/* (g) The guides published that month */}
        <section className="bg-linen-100" aria-labelledby="guides-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <SectionTitle id="guides-title" eyebrow={`${no()} · ${model.issueLabel}`} title={W.guidesHeading} intro={model.guides.length ? fill(W.guidesIntro, { issue: model.issueLabel }) : W.guidesNone} />
            {model.guides.length ? (
              <ul className="grid gap-5 md:grid-cols-2">
                {model.guides.map((g) => (
                  <li key={g.slug} className="flex">
                    <Link href={`/blog/${g.slug}` as Route} className="card group flex w-full flex-col gap-2 border border-hairline bg-white p-6 transition-colors duration-[120ms] hover:border-deep-harbor">
                      <h3 className="t-h3 text-navy">{g.title}</h3>
                      <p className="t-small text-body-muted">{g.excerpt}</p>
                      <p className="t-record mt-auto pt-2 text-graphite-500">{formatDateLong(noon(g.publishedAt))}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link href="/blog" className="t-small self-start py-2 text-sky-700 underline underline-offset-4 hover:text-navy">
              {W.guidesAll}
            </Link>
          </div>
        </section>

        {/* (h) The ask, and the source */}
        <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="ask-title">
          <div className="grid gap-8 border border-hairline bg-white p-6 md:grid-cols-[1fr_1fr] md:items-center md:p-10">
            <div className="flex flex-col gap-3">
              <p className="t-eyebrow text-amber">{`${no()} · Tide`}</p>
              <h2 id="ask-title" className="t-h1 text-navy">
                {W.askHeading}
              </h2>
              <p className="t-body max-w-measure text-body">{W.askBody}</p>
            </div>
            <LetterForm />
          </div>
          <div className="flex max-w-[900px] flex-col gap-3">
            <p className="t-record text-graphite-600">{model.source}</p>
            <p className="t-small text-body-muted">{model.methods}</p>
          </div>
        </section>
      </article>
    </>
  );
}

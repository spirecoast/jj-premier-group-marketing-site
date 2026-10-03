import type { Route } from "next";
import Link from "next/link";
import { fill } from "@/lib/issues/copy";
import { monthLabel } from "@/lib/issues/render";
import { explorerHref } from "@/lib/neighborhoods/url";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, usd, type IssueMarket } from "@/lib/tide/issue";
import { HomeMix } from "./home-mix";
import { PriceBands } from "./price-bands";
import { Sparkline } from "./sparkline";

/** "13% fewer than a typical month", from the unrounded change. */
function againstTypical(now: number, typical: number | null): string {
  if (typical === null || typical === 0) return W.typicalNone;
  const pct = Math.round((100 * Math.abs(now - typical)) / typical);
  if (pct === 0) return W.vsTypicalSame;
  return fill(now > typical ? W.vsTypicalMore : W.vsTypicalFewer, { pct });
}

function Stat({ label, value, lines }: { label: string; value: string; lines: string[] }) {
  return (
    <div className="flex flex-col gap-2 border-t border-hairline pt-4 sm:pt-5">
      <dt className="t-label text-linen-700">{label}</dt>
      <dd className="font-mono text-[clamp(1.625rem,1.2rem+1.2vw,2.25rem)] leading-none font-medium tracking-[-0.01em] text-navy tabular-nums">{value}</dd>
      {lines.map((l) => (
        <dd key={l} className="t-record text-graphite-600">
          {l}
        </dd>
      ))}
    </div>
  );
}

/**
 * One market's chapter: its name set big, a quiet strip of the month's four
 * figures against a typical month and a year before, the story of the place
 * this month (written, or the computed paragraph until it is), and beside it
 * the twelve-month line, the price bands, the kinds of home and the busiest
 * streets. Then the one move, set apart, and the way on to the market's hub
 * and to Atlas.
 */
export function MarketChapter({ m, n, dataLabel, move }: { m: IssueMarket; n: string; dataLabel: string; move: string | null }) {
  const s = m.stats;
  const b = m.baseline;
  const ly = m.lastYear;
  const lyMonth = ly ? monthLabel(ly.month) : null;
  const typical = (v: number | null, f: (x: number) => string) => (v === null ? W.typicalNone : fill(W.typical, { value: f(v) }));
  const year = (v: number | null | undefined, f: (x: number) => string) =>
    ly && lyMonth ? (v === null || v === undefined ? fill(W.vsLastYearNone, { month: lyMonth }) : fill(W.vsLastYear, { month: lyMonth, value: f(v) })) : null;
  const money = (v: number | null) => (v === null ? "–" : usd(v));
  const atlas = explorerHref({ filters: { market: m.market } });

  return (
    <section id={m.market} className="tide-chapter scroll-mt-24 border-t border-rule" aria-labelledby={`${m.market}-title`}>
      <div className="container-site flex flex-col gap-10 py-section lg:gap-14">
        <header className="flex flex-col gap-4">
          <p className="t-eyebrow text-amber">{fill(W.chapterEyebrow, { n, data: dataLabel })}</p>
          <h2 id={`${m.market}-title`} className="t-hero text-navy">
            {m.name}
          </h2>
        </header>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4 lg:gap-x-8">
          <Stat
            label={W.figureSales}
            value={num(s.count)}
            lines={[againstTypical(s.count, b.count), year(ly?.count, num)].filter((x): x is string => Boolean(x))}
          />
          <Stat label={W.figureMedian} value={money(s.medianPrice)} lines={[typical(b.medianPrice, usd), year(ly?.medianPrice, usd)].filter((x): x is string => Boolean(x))} />
          <Stat label={W.figurePpsfShort} value={money(s.medianPpsf)} lines={[typical(b.medianPpsf, usd), year(ly?.medianPpsf, usd)].filter((x): x is string => Boolean(x))} />
          <Stat
            label={W.figureNew}
            value={s.newBuildPct === null ? "–" : `${s.newBuildPct}%`}
            lines={[typical(b.newBuildPct, (x) => `${x}%`), fill(W.sampleNew, { n: num(s.newBuild), count: num(s.count) })]}
          />
        </dl>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="tide-prose flex max-w-[66ch] flex-col gap-5 lg:col-span-7" data-tide-market-story={m.story.written ? "written" : "computed"}>
            {m.story.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          <div className="flex flex-col gap-7 lg:col-span-5">
            <Sparkline m={m} />
            {m.streets.length ? (
              <p className="border-t border-hairline pt-5 text-[0.9375rem] leading-relaxed text-body-muted">
                <span className="t-label mr-2 text-linen-700">{W.streetsLine}</span>
                {m.streets.map((st, i) => (
                  <span key={st.label}>
                    {i ? ", " : ""}
                    <span className="text-body">{st.label}</span> <span className="font-mono text-[0.8125rem] text-graphite-500">({num(st.count)})</span>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-10 border-t border-hairline pt-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          <PriceBands bands={m.bands} market={m.name} />
          <HomeMix mix={m.mix} />
        </div>

        {move ? (
          <figure className="tide-move flex flex-col gap-3 border-l-2 border-amber py-1 pl-6 md:pl-8" data-tide-market-move={m.market}>
            <figcaption className="t-eyebrow text-amber">{fill(W.marketMoveLabel, { market: m.name })}</figcaption>
            <p className="max-w-[34ch] font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-[1.18] font-light text-navy">{move}</p>
          </figure>
        ) : null}

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Link href={m.href as Route} className="link-rule">
            {fill(W.marketLink, { market: m.name })}
          </Link>
          <Link href={atlas} className="link-rule">
            {fill(W.atlasLink, { market: m.name })}
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { Byline } from "@/components/byline";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { EncoreCover, EncoreLetterTile } from "@/components/newsletters/encore-cover";
import { getTeam } from "@/lib/content";
import { marketName } from "@/lib/content/markets";
import { CATEGORY } from "@/lib/encore/categories";
import type { EncoreEvent } from "@/lib/encore/index-format";
import type { Occ } from "@/lib/encore/select";
import { ENCORE_COPY, fill } from "@/lib/issues/copy";
import { pickTime } from "@/lib/issues/encore-weekly";
import { dateLong, dateShort, dayLong } from "@/lib/issues/render";
import { LETTER_COPY as L } from "@/lib/newsletters/copy";
import { encoreLetterWeeks, loadEncoreLetter } from "@/lib/newsletters/encore";
import { encoreLetterAnswer, encoreLetterPath, rangeWithYear } from "@/lib/newsletters/weeks";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import "@/components/encore/encore.css";

/** Hourly, like the calendar it's built from. */
export const revalidate = 3600;

type Params = Promise<{ date: string }>;

export async function generateStaticParams() {
  const { listed } = await encoreLetterWeeks();
  return listed.map((date) => ({ date }));
}

/**
 * The issue for a Monday on the list; an issue no longer kept points to
 * /newsletters (a temporary redirect, since the list is read live); any
 * other address is a 404.
 */
async function resolve(date: string) {
  const { current, listed } = await encoreLetterWeeks();
  const answer = encoreLetterAnswer(date, listed, current);
  if (answer === "gone") redirect("/newsletters#encore");
  if (answer === "missing") notFound();
  return { letter: await loadEncoreLetter(date), others: listed.filter((m) => m !== date) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date } = await params;
  const { issue } = (await resolve(date)).letter;
  const range = rangeWithYear(issue.period.from, issue.period.to);
  const performances = new Intl.NumberFormat("en-US").format(issue.performances);
  return pageMetadata({
    title: fill(L.metaTitle, { range }),
    description: issue.picks.length ? fill(L.description, { range, picks: issue.picks.length, performances }) : fill(L.descriptionEmpty, { range }),
    path: encoreLetterPath(date),
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

/**
 * Encore's Monday issue on the web: the email's own picks, in its order and
 * in its words (lib/newsletters/encore.ts builds it with the email's
 * builder), set in the site's type. The day heads and rows are the Encore
 * Planner's (components/encore/encore.css), so a week reads like a plan.
 */
export default async function EncoreLetterPage({ params }: { params: Params }) {
  const { date } = await params;
  const [{ letter, others }, team] = await Promise.all([resolve(date), getTeam()]);
  const { issue, card } = letter;
  const earlier = (await Promise.all(others.map((m) => loadEncoreLetter(m)))).map((l) => l.card);
  const days = byDay(issue.picks);
  const more = issue.onViewTotal - issue.onView.length;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Newsletters", path: "/newsletters" },
          { name: fill(L.metaTitle, { range: rangeWithYear(issue.period.from, issue.period.to) }), path: encoreLetterPath(date) },
        ])}
      />
      <section className="container-site grid items-center gap-10 py-section lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20" aria-labelledby="letter-title">
        <EncoreCover card={card} className="w-full max-w-[480px]" />
        <div className="flex flex-col gap-7">
          <h1 id="letter-title" className="t-display text-balance text-navy">
            {issue.title}
          </h1>
          <p className="t-lead max-w-[600px] text-body">{issue.intro}</p>
          <Byline people={team.map((m) => ({ name: m.name, headshot: m.headshot }))} extras={[site.calendarShort, dateLong(issue.period.from)]} />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            <ButtonLink href={`/calendar?view=week&date=${issue.period.from}`} dash>
              {ENCORE_COPY.calendarCta}
            </ButtonLink>
            <RuleLink href="/newsletters#encore">{L.allNewsletters}</RuleLink>
          </div>
        </div>
      </section>

      {days.length ? (
        <section className="container-site pb-section" aria-labelledby="picks-title">
          <div className="flex max-w-[860px] flex-col gap-8">
            <h2 id="picks-title" className="t-h1 text-navy">
              {ENCORE_COPY.picksHeading}
            </h2>
            <div className="plan-days">
              {days.map(([day, picks]) => (
                <article key={day} className="plan-day" aria-labelledby={`day-${day}`}>
                  <h3 id={`day-${day}`} className="plan-dayhead">
                    <span className="flex items-center gap-3">
                      <span className="font-display text-[2rem] font-light leading-none text-encore tabular-nums" aria-hidden="true">
                        {Number(day.slice(8, 10))}
                      </span>
                      <span className="text-[15px] text-white">{dayLong(day)}</span>
                    </span>
                  </h3>
                  <ul className="flex flex-col">
                    {picks.map((o) => (
                      <PickRow key={`${o.e.s}-${o.start}`} o={o} />
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {issue.onView.length ? (
        <section className="container-site pb-section" aria-labelledby="onview-title">
          <div className="flex max-w-[860px] flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 id="onview-title" className="t-h1 text-navy">
                {ENCORE_COPY.onViewHeading}
              </h2>
              <p className="t-body text-body">{ENCORE_COPY.onViewIntro}</p>
            </div>
            <ul className="flex flex-col border-t border-hairline">
              {issue.onView.map((e) => (
                <OnViewRow key={e.s} e={e} />
              ))}
            </ul>
            {more > 0 ? (
              <RuleLink href={`/calendar?view=onview&date=${issue.period.from}`} className="self-start">
                {fill(ENCORE_COPY.onViewMore, { more })}
              </RuleLink>
            ) : null}
          </div>
        </section>
      ) : null}

      <section id="subscribe" className="scroll-mt-header bg-linen-200" aria-labelledby="subscribe-title">
        <div className="container-site grid items-center gap-8 py-section lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <h2 id="subscribe-title" className="t-h1 text-navy">
              {L.signupHeading}
            </h2>
            <p className="t-body max-w-measure text-body">{L.signupBody}</p>
          </div>
          <LetterForm form="calendar" label={`Send me ${site.calendarShort}`} />
        </div>
      </section>

      {earlier.length ? (
        <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="others-title">
          <h2 id="others-title" className="t-h1 text-navy">
            {L.otherWeeks}
          </h2>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {earlier.map((c) => (
              <li key={c.monday} className="flex max-w-[400px]">
                <EncoreLetterTile card={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** The picks by day, in the issue's order (time order). */
function byDay(picks: Occ[]): [string, Occ[]][] {
  const out = new Map<string, Occ[]>();
  for (const o of picks) out.set(o.day, [...(out.get(o.day) ?? []), o]);
  return [...out];
}

/** A pick as the email gives it: the time, the title, the venue and place, the kind, the summary, the presenter and price. */
function PickRow({ o }: { o: Occ }) {
  const e = o.e;
  const cat = CATEGORY[e.c];
  const extra = [e.p ? fill(ENCORE_COPY.presentedBy, { presenter: e.p }) : "", e.pr ?? ""].filter(Boolean).join(" · ");
  return (
    <li className="encore-agenda-row" style={{ "--cat": cat.color } as CSSProperties}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link py-4">
        <span className="encore-agenda-time">{pickTime(o)}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="encore-agenda-title">{e.t}</span>
          <span className="encore-meta">
            {[e.vn, marketName(e.m)].join(" · ")} ·{" "}
            <span className="encore-meta-kind">
              <i aria-hidden="true" />
              {cat.label}
            </span>
          </span>
          {e.sum ? <span className="t-small mt-1 text-body">{e.sum}</span> : null}
          {extra ? <span className="t-small text-graphite-500">{extra}</span> : null}
        </span>
        <span className="encore-agenda-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

/** An exhibition open in the week: the title, when it closes, the venue and place. */
function OnViewRow({ e }: { e: EncoreEvent }) {
  const line = [e.r ? fill(ENCORE_COPY.through, { date: dateShort(e.r) }) : "", e.vn, marketName(e.m)].filter(Boolean).join(" · ");
  return (
    <li className="encore-agenda-row" style={{ "--cat": CATEGORY[e.c].color } as CSSProperties}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link py-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="encore-agenda-title">{e.t}</span>
          <span className="encore-meta">{line}</span>
        </span>
        <span className="encore-agenda-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

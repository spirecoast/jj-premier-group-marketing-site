"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SavePlaceButton } from "@/components/atlas/save-place";
import { useMyPlaces } from "@/components/atlas/use-my-places";
import { ButtonLink } from "@/components/buttons";
import { LeadForm } from "@/components/lead-form";
import { ShareButton } from "@/components/share-button";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { QUESTIONS, answeredIds, coverageLine, matchHref, matchListHref, questionIndex, sortMatches, summarize, unknownCount, type AnswerBar, type Answers, type Coverage, type Match, type QuestionId } from "@/lib/neighborhoods/match";
import { pathOf } from "@/lib/neighborhoods/search";
import { LIST_MAX } from "@/lib/neighborhoods/url";
import { cn } from "@/lib/utils";

const PAGE = 60;

type Props = {
  answers: Answers;
  onAnswers: (a: Answers) => void;
  matches: Match[];
  by: Map<string, IndexEntry>;
  asOf: string;
  /** One bar per answered question: confirmed on it, or in only because the fact isn't known yet. */
  bars: AnswerBar[];
  /** Questions held back for thin coverage, offered under the answers. */
  more: { id: QuestionId; coverage: Coverage | null }[];
  onEdit: (step: number) => void;
  onRestart: () => void;
};

/**
 * The places that fit. A summary on the Atlas green leads: the count, then
 * one bar per answered question (how many of the list are confirmed on it
 * and how many are in only because the fact isn't known yet), the answers
 * themselves and what to do next: the map with exactly this list, Save them
 * all, Share. The cards follow, best fit first (or A to Z, or nearest first
 * when a point was chosen); each shows the facts that matched, says "not
 * known" where a field is missing rather than pretending, and carries Save.
 */
export function MatchResults({ answers, onAnswers, matches, by, asOf, bars, more, onEdit, onRestart }: Props) {
  const [order, setOrder] = useState<"fit" | "name" | "distance">(answers.near ? "distance" : "fit");
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [matches.length]);
  useEffect(() => {
    if (!answers.near) setOrder((o) => (o === "distance" ? "fit" : o));
  }, [answers.near]);
  const my = useMyPlaces();

  const sorted = useMemo(() => sortMatches(matches, order), [matches, order]);
  const ids = answeredIds(answers);
  const summary = summarize(answers, by);
  const anyUnknown = bars.some((b) => b.unknown > 0);
  const registryCount = useMemo(() => [...by.values()].filter((e) => e.r === 0).length, [by]);
  const slugs = useMemo(() => matches.map((m) => m.entry.s), [matches]);
  const allSaved = slugs.length > 0 && slugs.every((s) => my.has(s));

  const message = [
    `From Atlas Match: ${matches.length.toLocaleString()} ${matches.length === 1 ? "neighborhood fits" : "neighborhoods fit"} what I told it${summary.length ? ` (${summary.map((s) => s.text).join(" · ")})` : ""}.`,
    "Could you walk me through three of them?",
    typeof window !== "undefined" ? new URL(matchHref({ answers, step: null }), window.location.origin).toString() : "",
  ]
    .filter(Boolean)
    .join(" ");
  // The form keeps whatever has been typed while the list changes; the message only refreshes when asked.
  const [sentMessage, setSentMessage] = useState(message);

  return (
    <div className="flex flex-col gap-12">
      <div className="atlas-panel relative flex flex-col gap-8 overflow-hidden bg-atlas-deep px-5 py-8 text-linen-100 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-6" aria-live="polite">
            <h2 data-results-title="" tabIndex={-1} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-white outline-none">
              <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] font-light leading-none tabular-nums">{matches.length.toLocaleString()}</span>
              <span className="t-h1">{matches.length === 1 ? "neighborhood fits" : "neighborhoods fit"}</span>
            </h2>
            {matches.length && bars.length ? (
              <div className="flex max-w-[560px] flex-col gap-4">
                <ul className="flex flex-col gap-3" aria-label="How many of the list each answer is confirmed for">
                  {bars.map((b) => {
                    const q = QUESTIONS[questionIndex(b.id)]!;
                    const pct = (n: number) => `${(n / matches.length) * 100}%`;
                    return (
                      <li key={b.id} className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                          <span className="t-small text-white">{b.text.charAt(0).toUpperCase() + b.text.slice(1)}</span>
                          <span className="t-small text-white/75 tabular-nums">
                            {b.unknown ? `${b.confirmed.toLocaleString()} confirmed · ${b.unknown.toLocaleString()} not known yet` : `${b.confirmed.toLocaleString()} of ${matches.length.toLocaleString()} confirmed`}
                          </span>
                        </div>
                        <span className="flex h-1.5 overflow-hidden bg-white/12" role="img" aria-label={`${q.title} ${b.confirmed} confirmed, ${b.unknown} not known yet`}>
                          <span className="bg-atlas transition-[width] duration-(--dur-card)" style={{ width: pct(b.confirmed) }} />
                          <span className="bg-white/30 transition-[width] duration-(--dur-card)" style={{ width: pct(b.unknown) }} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="t-small flex flex-wrap gap-x-6 gap-y-1 text-white/75">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 bg-atlas" aria-hidden="true" />
                    confirmed on that answer
                  </span>
                  {anyUnknown ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 bg-white/30" aria-hidden="true" />
                      not known yet · kept because “Keep places we don’t have this detail for” is ticked
                    </span>
                  ) : null}
                </p>
              </div>
            ) : (
              <p className="t-body max-w-measure text-white/80">
                {ids.length === 0 ? "You skipped every question, so this is every neighborhood. Answer one or two and the list narrows." : "Loosen one answer, or on the question that cut the most, tick “Keep places we don’t have this detail for”."}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:flex-col lg:items-end">
            <ButtonLink href={matchListHref(matches) as Route} variant="linen" dash>
              See them on the map
            </ButtonLink>
            {matches.length > LIST_MAX ? <p className="t-small text-white/60 lg:text-right">The map holds the first {LIST_MAX.toLocaleString()} of these.</p> : null}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" className="link-rule" onClick={() => my.addAll(slugs)} disabled={allSaved} aria-disabled={allSaved}>
                {allSaved ? "All saved" : "Save them all"}
              </button>
              <ShareButton title="Atlas Match · JJ Premier Group" url={matchHref({ answers, step: null })} what="match" label="Share this list" />
            </div>
          </div>
        </div>

        {ids.length ? (
          <div className="flex flex-col gap-3 border-t border-white/12 pt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="t-small text-white/60">Your answers. Tap one to change it.</p>
              <div className="flex gap-6">
                <button type="button" className="link-rule" onClick={() => onEdit(1)}>
                  Change the answers
                </button>
                <button type="button" className="link-rule" onClick={onRestart}>
                  Start over
                </button>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Your answers">
              {summary.map(({ id, text }) => {
                const q = QUESTIONS[questionIndex(id)]!;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center gap-2 border border-white/20 bg-white/[0.06] px-4 text-[14px] text-white transition-colors hover:border-atlas hover:bg-white/10"
                      onClick={() => onEdit(questionIndex(id) + 1)}
                      aria-label={`Change: ${q.title}`}
                    >
                      {text.charAt(0).toUpperCase() + text.slice(1)}
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="text-atlas">
                        <path d="M8.2 1.8 10.2 3.8 4 10H2V8z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {more.filter((m) => !ids.includes(m.id)).length ? (
          <div className="flex flex-col gap-2 border-t border-white/12 pt-6">
            <p className="t-small text-white/60">More questions. We hold these for fewer places, so they come last.</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {more
                .filter((m) => !ids.includes(m.id))
                .map((m) => {
                  const q = QUESTIONS[questionIndex(m.id)]!;
                  return (
                    <li key={m.id} className="flex flex-wrap items-baseline gap-x-3">
                      <button type="button" className="link-rule" onClick={() => onEdit(questionIndex(m.id) + 1)}>
                        {q.title}
                      </button>
                      {coverageLine(m.coverage, m.id) ? <span className="t-small text-white/55">{coverageLine(m.coverage, m.id)}</span> : null}
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="match-q flex flex-wrap items-center gap-2" role="group" aria-label="Order">
            <button type="button" className="chip !min-h-9 !text-[13px]" data-active={order === "fit" ? "true" : undefined} aria-pressed={order === "fit"} onClick={() => setOrder("fit")}>
              Best fit first
            </button>
            <button type="button" className="chip !min-h-9 !text-[13px]" data-active={order === "name" ? "true" : undefined} aria-pressed={order === "name"} onClick={() => setOrder("name")}>
              A to Z
            </button>
            {answers.near ? (
              <button type="button" className="chip !min-h-9 !text-[13px]" data-active={order === "distance" ? "true" : undefined} aria-pressed={order === "distance"} onClick={() => setOrder("distance")}>
                Nearest first
              </button>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 t-small text-body">
            <input type="checkbox" checked={answers.registry} onChange={(e) => onAnswers({ ...answers, registry: e.target.checked })} className="size-4 accent-[var(--color-navy)]" />
            Also show {registryCount.toLocaleString()} subdivisions we only know by their county record
          </label>
        </div>

        {sorted.length ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sorted.slice(0, limit).map((m, i) => (
              <li key={m.entry.s} className="sr flex" style={{ "--sr-i": i % 6 } as CSSProperties}>
                <MatchCard match={m} by={by} asOf={asOf} />
              </li>
            ))}
          </ul>
        ) : null}
        {sorted.length > limit ? (
          <button type="button" className="btn btn-outline self-center" onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, sorted.length - limit)} more
          </button>
        ) : null}
        <p className="t-small text-graphite-500">
          Updated {asOf}. Facts come from county, district, association and builder sources.
        </p>
      </div>

      <section className="grid gap-10 border-t border-hairline pt-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="match-ask-title">
        <div className="flex flex-col gap-3.5">
          <h2 id="match-ask-title" className="t-h1 text-navy">
            Want us to walk you through three of these?
          </h2>
          <p className="t-body max-w-[440px] text-body">
            Your answers are already in the message. Tell us your timing, and one of us will pick three neighborhoods from this list and tell you why each one fits.
          </p>
          {sentMessage !== message ? (
            <button type="button" onClick={() => setSentMessage(message)} className="link-rule self-start">
              Use my latest answers
            </button>
          ) : null}
        </div>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <LeadForm
            key={sentMessage}
            form="buy"
            fields={["name", "email", "phone", "timing", "sellFirst", "message"]}
            submitLabel="Walk me through three"
            defaultMessage={sentMessage}
            hidden={{ market: answers.market.length === 1 ? answers.market[0] : undefined, pageTitle: "Atlas Match" }}
          />
        </div>
      </section>
    </div>
  );
}

/** One neighborhood: where it sits, its name, Save, a meter of how many answers it's confirmed on, then each fact with a tick or "not known yet". */
function MatchCard({ match: m, by, asOf }: { match: Match; by: Map<string, IndexEntry>; asOf: string }) {
  const e = m.entry;
  const path = pathOf(e, by).map((a) => a.n);
  const unknown = unknownCount(m);
  const total = m.facts.length;
  const known = total - unknown;
  return (
    <article
      className="group relative flex w-full flex-col gap-5 border border-hairline bg-white p-5 transition-[border-color,box-shadow,transform] duration-(--dur-panel) hover:-translate-y-0.5 hover:border-atlas-ink/40 hover:shadow-[0_22px_48px_-28px_rgba(16,48,47,0.45)] sm:p-6"
      aria-label={e.n}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", unknown ? "bg-linen-300" : "bg-atlas")} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="t-small text-graphite-500">{[path.length ? path.join(" › ") : marketName(e.m), e.t ? TYPE_LABEL[e.t] : LEVEL_LABEL[e.l]].join(" · ")}</p>
          <h3 className="t-h3 text-navy">
            <Link href={`/neighborhoods/${e.s}`} className="after:absolute after:inset-0 transition-colors group-hover:text-atlas-ink">
              {e.n}
            </Link>
          </h3>
        </div>
        {/* Above the card's link, so Save is its own target. */}
        <SavePlaceButton slug={e.s} name={e.n} className="relative z-10 -mr-2 -mt-2 shrink-0 !border-transparent" />
      </div>
      {total ? (
        <div className="flex items-center gap-3">
          <span className="flex flex-1 gap-1" aria-hidden="true">
            {m.facts.map((f) => (
              <span key={f.id} className={cn("h-1.5 flex-1", f.state === "unknown" ? "bg-linen-200" : "bg-atlas")} />
            ))}
          </span>
          <span className={cn("shrink-0 text-[12px] tabular-nums", unknown ? "text-graphite-500" : "font-medium text-atlas-ink")}>
            {unknown ? `${known} of ${total} confirmed` : "Fits every answer"}
          </span>
        </div>
      ) : null}
      {m.facts.length ? (
        <dl className="flex flex-col divide-y divide-hairline border-t border-hairline">
          {m.facts.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-4 py-2">
              <dt className="t-small text-graphite-500">{f.id === "build" ? `${f.label}, ${asOf}` : f.label}</dt>
              <dd className={cn("flex items-start gap-2 text-right t-small", f.state === "unknown" ? "italic text-graphite-500" : "text-body")}>
                {f.state === "unknown" ? "Not known yet" : f.value}
                {f.state === "match" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-1 shrink-0 text-atlas-ink">
                    <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-4 pt-1">
        {!e.r ? <p className="t-small text-graphite-400">Known from the county record</p> : <span />}
        <span className="t-small inline-flex items-center gap-1.5 text-atlas-ink transition-transform duration-(--dur-panel) group-hover:translate-x-0.5" aria-hidden="true">
          See the neighborhood
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 6h8M7 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      </div>
    </article>
  );
}

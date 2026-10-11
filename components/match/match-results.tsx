"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ButtonLink } from "@/components/buttons";
import { LeadForm } from "@/components/lead-form";
import { ShareButton } from "@/components/share-button";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { QUESTIONS, answeredIds, explorerFilters, matchHref, questionIndex, sortMatches, summarize, type Answers, type Match } from "@/lib/neighborhoods/match";
import { pathOf } from "@/lib/neighborhoods/search";
import { cn } from "@/lib/utils";

const PAGE = 60;

const orList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);

type Props = {
  answers: Answers;
  onAnswers: (a: Answers) => void;
  matches: Match[];
  by: Map<string, IndexEntry>;
  asOf: string;
  onEdit: (step: number) => void;
  onRestart: () => void;
};

/**
 * The places that fit, unranked: alphabetical, or nearest first when a point
 * was chosen. Each card shows the facts that matched and says "not known"
 * where a field is missing rather than pretending.
 */
export function MatchResults({ answers, onAnswers, matches, by, asOf, onEdit, onRestart }: Props) {
  const [order, setOrder] = useState<"name" | "distance">(answers.near ? "distance" : "name");
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [matches.length]);
  useEffect(() => {
    if (!answers.near) setOrder("name");
  }, [answers.near]);

  const sorted = useMemo(() => sortMatches(matches, order), [matches, order]);
  const confirmed = matches.filter((m) => m.confirmed).length;
  const ids = answeredIds(answers);
  const summary = summarize(answers, by);
  const explorer = explorerFilters(answers, summary.map((s) => s.id));
  const registryCount = useMemo(() => [...by.values()].filter((e) => e.r === 0).length, [by]);

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
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-4" aria-live="polite">
          <h2 className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-navy">
            <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] font-light leading-none tabular-nums">{matches.length.toLocaleString()}</span>
            <span className="t-h1">{matches.length === 1 ? "neighborhood fits" : "neighborhoods fit"}</span>
          </h2>
          <p className="t-body max-w-measure text-body">
            {ids.length === 0
              ? "You skipped every question, so this is every neighborhood. Answer one or two and the list narrows."
              : matches.length === 0
                ? "Loosen one answer, or on the question that cut the most, tick “Keep places we don’t have this detail for”."
                : confirmed === matches.length
                  ? "Every one is confirmed on every answer you gave."
                  : `${confirmed.toLocaleString()} ${confirmed === 1 ? "is" : "are"} confirmed on every answer. The rest are missing at least one detail, marked “Not known yet”.`}
          </p>
        </div>

        {ids.length ? (
          <div className="flex flex-col gap-2.5">
            <p className="t-small text-graphite-500">Your answers. Tap one to change it.</p>
            <ul className="match-q flex flex-wrap gap-2" aria-label="Your answers">
              {summary.map(({ id, text }) => {
                const q = QUESTIONS[questionIndex(id)]!;
                return (
                  <li key={id}>
                    <button type="button" className="chip !min-h-10 gap-2 !text-[14px]" onClick={() => onEdit(questionIndex(id) + 1)} aria-label={`Change: ${q.title}`}>
                      {text}
                      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="text-sky-700">
                        <path d="M8.2 1.8 10.2 3.8 4 10H2V8z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ButtonLink href={explorer.href as Route} variant="navy" dash>
            See them on the map
          </ButtonLink>
          <ShareButton title="Atlas Match · JJ Premier Group" url={matchHref({ answers, step: null })} what="match" label="Share this list" />
          <button type="button" className="link-rule" onClick={() => onEdit(1)}>
            Change the answers
          </button>
          <button type="button" className="link-rule" onClick={onRestart}>
            Start over
          </button>
        </div>
        {explorer.dropped.length ? (
          <p className="t-small max-w-measure text-body-muted">
            The map can’t filter by {orList(explorer.dropped)}, so it will show more places than this list.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="match-q flex flex-wrap items-center gap-2" role="group" aria-label="Order">
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

/** One neighborhood: where it sits, its name, whether it fits on every answer, then each fact with a tick or "not known yet". */
function MatchCard({ match: m, by, asOf }: { match: Match; by: Map<string, IndexEntry>; asOf: string }) {
  const e = m.entry;
  const path = pathOf(e, by).map((a) => a.n);
  const unknown = m.facts.filter((f) => f.state === "unknown").length;
  return (
    <article className="group relative flex w-full flex-col gap-4 border border-hairline bg-white p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-[0_18px_40px_-24px_rgba(16,37,66,0.35)] sm:p-6" aria-label={e.n}>
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", unknown ? "bg-linen-300" : "bg-sky-400")} aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <p className="t-small text-graphite-500">{[path.length ? path.join(" › ") : marketName(e.m), e.t ? TYPE_LABEL[e.t] : LEVEL_LABEL[e.l]].join(" · ")}</p>
        <h3 className="t-h3 text-navy">
          <Link href={`/neighborhoods/${e.s}`} className="after:absolute after:inset-0 transition-colors group-hover:text-harbor-700">
            {e.n}
          </Link>
        </h3>
        <p className={cn("inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-[12px]", unknown ? "bg-linen-100 text-linen-800" : "bg-sky-100 text-sky-800")}>
          {unknown ? `${unknown} ${unknown === 1 ? "detail" : "details"} not known yet` : "Fits every answer"}
        </p>
      </div>
      {m.facts.length ? (
        <dl className="flex flex-col divide-y divide-hairline border-t border-hairline">
          {m.facts.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-4 py-2">
              <dt className="t-small text-graphite-500">{f.id === "build" ? `${f.label}, ${asOf}` : f.label}</dt>
              <dd className={cn("flex items-start gap-2 text-right t-small", f.state === "unknown" ? "italic text-graphite-500" : "text-body")}>
                {f.state === "unknown" ? "Not known yet" : f.value}
                {f.state === "match" ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-1 shrink-0 text-sky-600">
                    <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {!e.r ? <p className="t-small text-graphite-400">Known from the county record</p> : null}
    </article>
  );
}

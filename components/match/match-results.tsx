"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { ShareButton } from "@/components/share-button";
import { marketName } from "@/lib/content/markets";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { QUESTIONS, answeredIds, explorerFilters, matchHref, questionIndex, sortMatches, summarize, type Answers, type Match } from "@/lib/neighborhoods/match";
import { pathOf } from "@/lib/neighborhoods/search";
import { cn } from "@/lib/utils";

const PAGE = 60;

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
    `From Atlas match: ${matches.length.toLocaleString()} ${matches.length === 1 ? "place fits" : "places fit"} what I told it${summary.length ? ` (${summary.map((s) => s.text).join(" · ")})` : ""}.`,
    "Could you walk me through three of them?",
    typeof window !== "undefined" ? new URL(matchHref({ answers, step: null }), window.location.origin).toString() : "",
  ]
    .filter(Boolean)
    .join(" ");
  // The form keeps whatever has been typed while the list changes; the message only refreshes when asked.
  const [sentMessage, setSentMessage] = useState(message);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">The places</p>
          <h2 className="t-h1 max-w-[760px] text-navy" aria-live="polite">
            {matches.length === 0 ? "Nothing fits every answer yet." : `${matches.length.toLocaleString()} ${matches.length === 1 ? "place matches" : "places match"} what you told us.`}
          </h2>
          <p className="t-body max-w-measure text-body">
            {ids.length === 0
              ? "You skipped every question, so this is the whole catalog. Go back and answer one or two and the list narrows."
              : matches.length === 0
                ? "Loosen one answer, or tick “include places where this isn’t known yet” on the question that cut the most."
                : confirmed === matches.length
                  ? "Every one of them is confirmed on every answer you gave."
                  : `${confirmed.toLocaleString()} ${confirmed === 1 ? "is" : "are"} confirmed on every answer; the rest have at least one fact we don’t hold yet, marked “not known” below.`}{" "}
            No ranking and no score: the list is alphabetical{answers.near ? ", or nearest first" : ""}.
          </p>
        </div>

        {ids.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Your answers">
            {summary.map(({ id, text }) => {
              const q = QUESTIONS[questionIndex(id)]!;
              return (
                <li key={id}>
                  <button type="button" className="chip !min-h-9 !px-3 !text-[12px]" onClick={() => onEdit(questionIndex(id) + 1)} aria-label={`Change: ${q.title}`}>
                    {text}
                    <span aria-hidden="true" className="font-mono text-[11px] text-harbor-700">
                      edit
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-5">
          <button type="button" className="link-rule" onClick={() => onEdit(1)}>
            Change the answers
          </button>
          <button type="button" className="link-rule" onClick={onRestart}>
            Start over
          </button>
          <ShareButton title="Atlas match · JJ Premier Group" url={matchHref({ answers, step: null })} what="match" label="Share this list" />
          <Link href={explorer.href as Route} className="link-rule">
            See these on the map
          </Link>
        </div>
        {explorer.dropped.length ? (
          <p className="t-small max-w-measure text-body-muted">
            The map carries {explorer.carried.length ? explorer.carried.join(", ") : "none of these filters yet"}; it doesn’t filter by {explorer.dropped.join(", ")}, so it will show more places than this list.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 border-b border-hairline pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Order">
            <button type="button" className="chip !min-h-9 !px-3 !text-[12px]" data-active={order === "name" ? "true" : undefined} aria-pressed={order === "name"} onClick={() => setOrder("name")}>
              A to Z
            </button>
            {answers.near ? (
              <button type="button" className="chip !min-h-9 !px-3 !text-[12px]" data-active={order === "distance" ? "true" : undefined} aria-pressed={order === "distance"} onClick={() => setOrder("distance")}>
                Nearest first
              </button>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 t-small text-body">
            <input type="checkbox" checked={answers.registry} onChange={(e) => onAnswers({ ...answers, registry: e.target.checked })} className="size-4 accent-[var(--color-navy)]" />
            Include county-registry names ({registryCount.toLocaleString()} places not yet researched individually)
          </label>
        </div>

        {sorted.length ? (
          <ul className="grid gap-px border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
            {sorted.slice(0, limit).map((m) => (
              <li key={m.entry.s} className="flex">
                <MatchCard match={m} by={by} asOf={asOf} />
              </li>
            ))}
          </ul>
        ) : null}
        {sorted.length > limit ? (
          <button type="button" className="link-rule self-start" onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, sorted.length - limit)} more
          </button>
        ) : null}
        <p className="t-mono-sm text-graphite-500">
          Catalog as of {asOf}. Facts are as county, district, association and builder sources stated them on the checked date. Nothing here is a rating, a price, or a description of who lives where.
        </p>
      </div>

      <section className="grid gap-10 border-t border-hairline pt-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="match-ask-title">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">The next step</p>
          <h2 id="match-ask-title" className="t-h1 text-navy">
            Want us to walk you through three of these?
          </h2>
          <p className="t-body max-w-[440px] text-body">
            Your answers are already in the message. Add your timing and whether there’s a house to sell first, and one of us will come back with three places from this list and the reason for each.
          </p>
          {sentMessage !== message ? (
            <button type="button" onClick={() => setSentMessage(message)} className="link-rule self-start">
              Use this summary
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
            hidden={{ market: answers.market.length === 1 ? answers.market[0] : undefined, pageTitle: "Atlas match" }}
          />
        </div>
      </section>
    </div>
  );
}

/** The place card, in the explorer's style: name, path, type, then the facts that decided it. */
function MatchCard({ match: m, by, asOf }: { match: Match; by: Map<string, IndexEntry>; asOf: string }) {
  const e = m.entry;
  const path = pathOf(e, by).map((a) => a.n);
  return (
    <article className="flex w-full flex-col gap-3 bg-white p-5" aria-label={e.n}>
      <div className="flex flex-col gap-1">
        <p className="t-mono-sm text-graphite-500">{[path.length ? path.join(" › ") : marketName(e.m), e.t ? TYPE_LABEL[e.t] : LEVEL_LABEL[e.l]].join(" · ")}</p>
        <h3 className="t-h3 text-navy">
          <Link href={`/neighborhoods/${e.s}`} className="transition-colors hover:text-harbor-700">
            {e.n}
          </Link>
        </h3>
        {!e.r ? <p className="t-mono-sm text-graphite-400">County registry name</p> : null}
      </div>
      {m.facts.length ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {m.facts.map((f) => (
            <div key={f.id} className="contents">
              <dt className="t-mono-sm text-graphite-500">{f.id === "build" ? `${f.label} · as of ${asOf}` : f.label}</dt>
              <dd className={cn("t-small", f.state === "unknown" ? "italic text-graphite-500" : "text-body")}>{f.state === "unknown" ? "Not known yet" : f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

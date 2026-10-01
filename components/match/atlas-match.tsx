"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { EMPTY_ANSWERS, QUESTIONS, answeredIds, matchAll, matchHref, type Answers, type MatchState } from "@/lib/neighborhoods/match";
import { MatchQuestion } from "./match-question";
import { MatchResults } from "./match-results";

/**
 * Atlas match: the questionnaire and its list, one state (answers, step)
 * that the URL reflects so a result can be shared. The index arrives once
 * from /api/neighborhoods/index, the same 90KB the explorer uses, and every
 * count after that is in memory.
 */
export function AtlasMatch({ initial, datasetVersion, asOf }: { initial: MatchState; datasetVersion: string; asOf: string }) {
  const [entries, setEntries] = useState<IndexEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  // A shared link without a step opens on the list; a fresh visit opens on question one.
  const [step, setStep] = useState<number | null>(initial.step ?? (answeredIds(initial.answers).length ? null : 1));
  const root = useRef<HTMLDivElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoadError(false);
    fetch(`/api/neighborhoods/index?v=${encodeURIComponent(datasetVersion)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { entries: IndexEntry[] }) => setEntries(data.entries))
      .catch((err) => {
        if (err?.name !== "AbortError") setLoadError(true);
      });
    return () => ctrl.abort();
  }, [datasetVersion, loadAttempt]);

  const by = useMemo(() => new Map((entries ?? []).map((e) => [e.s, e])), [entries]);
  const areas = useMemo(() => (entries ?? []).filter((e) => e.l === "area" && e.x !== null && e.y !== null).sort((a, b) => a.n.localeCompare(b.n)), [entries]);
  const matches = useMemo(() => (entries ? matchAll(entries, answers, by) : null), [entries, answers, by]);
  const count = matches ? { total: matches.length, confirmed: matches.filter((m) => m.confirmed).length } : null;

  // Keep the URL honest, so the list can be shared mid-flow or at the end.
  useEffect(() => {
    const t = setTimeout(() => {
      window.history.replaceState(window.history.state, "", matchHref({ answers, step }));
    }, 200);
    return () => clearTimeout(t);
  }, [answers, step]);

  const go = useCallback((next: number | null) => {
    setStep(next);
    if (next === null && !completed.current) {
      completed.current = true;
      track("Explore", { action: "match" });
    }
    requestAnimationFrame(() => root.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const total = QUESTIONS.length;
  const question = step !== null ? QUESTIONS[step - 1] : undefined;

  return (
    <div ref={root} className="scroll-mt-header flex flex-col gap-8" aria-busy={!entries && !loadError}>
      {question ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="h-px w-full bg-hairline">
            <div className="h-px bg-navy transition-[width] duration-300" style={{ width: `${(step! / total) * 100}%` }} />
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div className="flex flex-col gap-3 border border-hairline bg-white p-6">
          <p className="t-h3 text-navy">The catalog did not load.</p>
          <p className="t-small text-body-muted">Check the connection and try again. Your answers are kept in the address bar.</p>
          <button type="button" className="link-rule self-start" onClick={() => setLoadAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : question ? (
        <MatchQuestion
          key={question.id}
          question={question}
          number={step!}
          total={total}
          answers={answers}
          onAnswers={setAnswers}
          areas={areas}
          count={count}
          onBack={() => go(Math.max(1, step! - 1))}
          onSkip={() => go(step! < total ? step! + 1 : null)}
          onNext={() => go(step! < total ? step! + 1 : null)}
        />
      ) : matches ? (
        <MatchResults
          answers={answers}
          onAnswers={setAnswers}
          matches={matches}
          by={by}
          asOf={asOf}
          onEdit={(s) => go(s)}
          onRestart={() => {
            setAnswers(EMPTY_ANSWERS);
            go(1);
          }}
        />
      ) : (
        <div className="flex flex-col gap-3" aria-hidden="true">
          <span className="block h-5 w-1/3 animate-pulse bg-linen-100" />
          <span className="block h-9 w-2/3 animate-pulse bg-linen-100" />
          <span className="block h-4 w-1/2 animate-pulse bg-linen-100" />
        </div>
      )}
    </div>
  );
}

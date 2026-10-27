"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStepDirection } from "@/components/ui/stepper";
import { track } from "@/lib/analytics";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { EMPTY_ANSWERS, MATCH_DRAFT, MATCH_KEYS, QUESTIONS, QUESTION_IDS, answerBars, answeredIds, coverage, deferredIds, flowOf, matchAll, matchHref, parseMatch, questionIndex, summarize, type Answers, type MatchState, type QuestionId } from "@/lib/neighborhoods/match";
import { revealStep } from "@/lib/scroll";
import { useJsonResource } from "@/lib/use-json-resource";
import { draft, hasAny, replaceQuery, useStepHistory, useUrlInitial } from "@/lib/url-state";
import { MatchQuestion } from "./match-question";
import { MatchResults } from "./match-results";

/**
 * Atlas Match: the questionnaire and its list, one state (answers, step).
 * Each step is a history entry, so the browser's Back returns to the question
 * before; the address carries the answers so far, so a list can be shared
 * mid-flow or at the end (choices only: nothing typed). Answers in progress
 * are also kept in this browser, so a reload or a swipe away comes back to the
 * same question. The index arrives once from /api/neighborhoods/index, the
 * same 90KB the explorer uses (lib/use-json-resource.ts), and every count
 * after that is in memory.
 */
export function AtlasMatch({ initial, datasetVersion, asOf }: { initial: MatchState; datasetVersion: string; asOf: string }) {
  const index = useJsonResource<{ entries: IndexEntry[] }>(`/api/neighborhoods/index?v=${encodeURIComponent(datasetVersion)}`);
  const entries = index.data?.entries ?? null;
  const loadError = index.error;
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  // A shared link without a step opens on the list; a fresh visit opens on question one.
  const [step, setStep] = useState<number | null>(initial.step ?? (answeredIds(initial.answers).length ? null : 1));
  const root = useRef<HTMLDivElement>(null);
  const completed = useRef(false);
  const moved = useRef(false);
  const dir = useStepDirection(step ?? QUESTIONS.length + 1);

  const by = useMemo(() => new Map((entries ?? []).map((e) => [e.s, e])), [entries]);
  const areas = useMemo(() => (entries ?? []).filter((e) => e.l === "area" && e.x !== null && e.y !== null).sort((a, b) => a.n.localeCompare(b.n)), [entries]);
  const matches = useMemo(() => (entries ? matchAll(entries, answers, by) : null), [entries, answers, by]);
  /* One bar per answered question (the list's panel), and the current question's own on its footer. */
  const bars = useMemo(() => (matches ? answerBars(matches, summarize(answers, by)) : []), [matches, answers, by]);
  /* How much of the catalog holds each fact, and which questions wait behind "More questions" for thin coverage. */
  const coverages = useMemo(() => Object.fromEntries(QUESTION_IDS.map((id) => [id, entries ? coverage(entries, id, answers.registry) : null])) as Record<QuestionId, ReturnType<typeof coverage>>, [entries, answers.registry]);
  const deferred = useMemo(() => deferredIds(entries, answers.registry), [entries, answers.registry]);
  const flow = useMemo(() => flowOf(deferred), [deferred]);

  // Answers in progress, kept in this browser on every change.
  useEffect(() => {
    if (answeredIds(answers).length || step !== 1) draft.write(MATCH_DRAFT, { answers, step } satisfies MatchState);
    else draft.clear(MATCH_DRAFT);
  }, [answers, step]);

  const showResults = useCallback(() => {
    if (!completed.current) {
      completed.current = true;
      track("Explore", { action: "match" });
    }
    // The list takes focus, so a screen reader hears the count, and comes into view under the header.
    requestAnimationFrame(() => {
      const title = root.current?.querySelector<HTMLElement>("[data-results-title]");
      title?.focus({ preventScroll: true });
      revealStep(root.current);
    });
  }, []);

  // Back and Forward move between the questions; the answers given stay as they are.
  const history = useStepHistory<MatchState>("match", { answers: initial.answers, step }, (entry) => {
    moved.current = true;
    setStep(entry.step);
    if (entry.step === null) showResults();
  });

  // On the list, a changed answer is a committed choice: the address follows, once per change.
  const onList = step === null;
  useEffect(() => {
    if (onList) replaceQuery(matchHref({ answers, step: null }));
  }, [answers, onList]);


  const go = (next: number | null, nextAnswers: Answers = answers) => {
    moved.current = true;
    setStep(next);
    history.push({ answers: nextAnswers, step: next }, matchHref({ answers: nextAnswers, step: next }));
    if (next === null) showResults();
  };
  const back = (to: number) => {
    if (history.back((before) => before.step === to)) return;
    moved.current = true;
    setStep(to);
    history.replace({ answers, step: to }, matchHref({ answers, step: to }));
  };

  const total = flow.length;
  const question = step !== null ? QUESTIONS[step - 1] : undefined;
  /* Where this question sits in the main flow; a deferred one has no place in it and goes back to the list. */
  const at = question ? flow.indexOf(question.id) : -1;
  const nextStep = at >= 0 && at < flow.length - 1 ? questionIndex(flow[at + 1]!) + 1 : null;
  const prevStep = at > 0 ? questionIndex(flow[at - 1]!) + 1 : 1;
  const here = question ? bars.find((b) => b.id === question.id) : undefined;
  const count = matches ? { total: matches.length, here: here ? { confirmed: here.confirmed, unknown: here.unknown } : null } : null;

  return (
    <div ref={root} className="scroll-mt-header flex flex-col gap-8" aria-busy={!entries && !loadError} data-url-island="">
      {loadError ? (
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-3 border border-hairline bg-white p-6">
          <p className="t-h3 text-navy">The neighborhoods didn’t load.</p>
          <p className="t-small text-body-muted">Check the connection and try again. Your answers are kept.</p>
          <button type="button" className="link-rule self-start" onClick={index.retry}>
            Try again
          </button>
        </div>
      ) : question ? (
        <MatchQuestion
          key={question.id}
          question={question}
          number={at >= 0 ? at + 1 : null}
          total={total}
          coverage={coverages[question.id]}
          answers={answers}
          onAnswers={setAnswers}
          areas={areas}
          count={count}
          moved={moved.current}
          dir={dir}
          onBack={at > 0 ? () => back(prevStep) : at < 0 ? () => go(null) : undefined}
          onSkip={() => go(nextStep)}
          onNext={() => go(nextStep)}
        />
      ) : matches ? (
        <MatchResults
          answers={answers}
          onAnswers={setAnswers}
          matches={matches}
          by={by}
          asOf={asOf}
          bars={bars}
          more={deferred.map((id) => ({ id, coverage: coverages[id] }))}
          onEdit={(s) => go(s)}
          onRestart={() => {
            setAnswers(EMPTY_ANSWERS);
            go(1, EMPTY_ANSWERS);
          }}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-3 border border-hairline bg-white p-6 sm:p-10" aria-hidden="true">
          <span className="block h-5 w-1/3 animate-pulse bg-linen-100" />
          <span className="block h-9 w-2/3 animate-pulse bg-linen-100" />
          <span className="block h-4 w-1/2 animate-pulse bg-linen-100" />
        </div>
      )}
    </div>
  );
}

const FRESH: MatchState = { answers: EMPTY_ANSWERS, step: 1 };

/** A link's answers, or the answers in progress in this browser; null for a fresh start. */
function stateFromUrl(sp: URLSearchParams): MatchState | null {
  if (hasAny(sp, MATCH_KEYS)) return parseMatch(sp);
  const saved = draft.read<MatchState>(MATCH_DRAFT);
  if (!saved || typeof saved !== "object") return null;
  // Read back through the URL parser, so a stale or hand-edited record can't carry anything the link couldn't.
  const s = parseMatch(new URLSearchParams(matchHref(saved as MatchState).split("?")[1] ?? ""));
  return answeredIds(s.answers).length || (s.step ?? 1) > 1 ? s : null;
}

/** Atlas Match as the static page serves it: question one on the server, then the link's answers or the ones in progress. */
export function AtlasMatchIsland({ datasetVersion, asOf }: { datasetVersion: string; asOf: string }) {
  const { initial, key } = useUrlInitial(stateFromUrl, FRESH);
  return <AtlasMatch key={key} initial={initial} datasetVersion={datasetVersion} asOf={asOf} />;
}

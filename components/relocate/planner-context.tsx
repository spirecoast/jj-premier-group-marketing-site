"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { buildPlan, normalizeAnswers, type Answers, type Plan } from "@/lib/relocate/plan";
import { MOVE_DRAFT, MOVE_STEPS, answersToQuery, hasAnswers, parseAnswers, planPath, readMoveDraft, type MoveDraft } from "@/lib/relocate/url";
import { scrollToTop } from "@/lib/scroll";
import { draft, replaceQuery, useStepHistory, useUrlInitial } from "@/lib/url-state";

export type Mode = "questions" | "plan";

type Ctx = {
  today: string;
  answers: Answers;
  setAnswers: (patch: Partial<Answers>) => void;
  mode: Mode;
  /** True when the plan was shown from "I'll just read" and no answer has been touched. */
  generic: boolean;
  plan: Plan;
  /** The share link for the current answers, absolute once mounted. */
  shareUrl: string;
  /** "I'll just read": show the generic plan without touching the answers. */
  readGeneric: () => void;
  /** The question on screen, zero-based. */
  step: number;
  /** The furthest question reached; past the last once a plan has shown. */
  reached: number;
  /** Next, or a jump from the rail: a new history entry, so the browser's Back returns here. */
  goTo: (n: number) => void;
  /** The question before: back through history when we came from it. */
  back: () => void;
  /** Show the plan for the answers given. */
  finish: () => void;
  /** Reopen the questions at one of them. */
  editAt: (n: number) => void;
};

const PlannerContext = createContext<Ctx | null>(null);

type Entry = { mode: Mode; step: number; generic: boolean };
type Start = { today: string; answers: Answers; mode: Mode; step: number; reached: number };

/**
 * One state for the planner: the answers, which question is showing, and
 * whether the plan is. Each question is a history entry (lib/url-state.ts),
 * so the phone's swipe back returns to the question before, not to the page
 * before. The plan's address carries the answers, so a link is a plan; the
 * answers in progress are kept in this browser on every change, so a reload
 * or an accidental exit comes back to the same question.
 */
function PlannerState({ start, children }: { start: Start; children: ReactNode }) {
  const { today } = start;
  const [answers, setAnswersState] = useState<Answers>(start.answers);
  const [mode, setMode] = useState<Mode>(start.mode);
  const [generic, setGeneric] = useState(false);
  const [step, setStep] = useState(start.step);
  const [reached, setReached] = useState(start.reached);
  const [origin, setOrigin] = useState("");
  const query = useMemo(() => answersToQuery(answers), [answers]);
  const plan = useMemo(() => buildPlan(answers, today), [answers, today]);

  useEffect(() => setOrigin(window.location.origin), []);

  /* Every change is kept in this browser, plan or not (from the first change: a visit that changes nothing leaves nothing). */
  const keep = useRef(false);
  useEffect(() => {
    if (!keep.current) {
      keep.current = true;
      return;
    }
    draft.write(MOVE_DRAFT, { query, mode, step, reached: Number.isFinite(reached) ? reached : MOVE_STEPS } satisfies MoveDraft);
  }, [query, mode, step, reached]);

  /* Once a plan is on the page, its address follows the answers (a committed choice: one write per change). */
  useEffect(() => {
    if (mode === "plan" && !generic) replaceQuery(planPath(answers));
  }, [mode, generic, answers]);

  /* One Explore event per rendered plan. The commute text is context only, so typing in it doesn't count as a new plan. */
  const trackKey = useMemo(() => answersToQuery({ ...answers, work: answers.work === "commute" ? "na" : answers.work, commuteTo: undefined }), [answers]);
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "plan" || tracked.current === trackKey) return;
    tracked.current = trackKey;
    track("Explore", { action: "relocate-plan" });
  }, [mode, trackKey]);

  const history = useStepHistory<Entry>("move", { mode: start.mode, step: start.step, generic: false }, (e) => {
    setMode(e.mode);
    setStep(e.step);
    setGeneric(e.generic);
    if (e.mode === "questions") setReached((r) => Math.max(r, e.step));
  });
  const { push, replace: replaceEntry, back: historyBack } = history;

  const setAnswers = useCallback(
    (patch: Partial<Answers>) => {
      setGeneric(false);
      setAnswersState((prev) => normalizeAnswers({ ...prev, ...patch }, today));
    },
    [today],
  );

  const goTo = useCallback(
    (n: number) => {
      const next = Math.min(MOVE_STEPS - 1, Math.max(0, n));
      if (next === step) return;
      setStep(next);
      setReached((r) => Math.max(r, next));
      push({ mode: "questions", step: next, generic: false });
    },
    [push, step],
  );

  const back = useCallback(() => {
    const prev = Math.max(0, step - 1);
    if (historyBack((before) => before.mode === "questions" && before.step === prev)) return;
    setStep(prev);
    replaceEntry({ mode: "questions", step: prev, generic: false });
  }, [historyBack, replaceEntry, step]);

  const finish = useCallback(() => {
    setReached(MOVE_STEPS);
    setMode("plan");
    setGeneric(false);
    push({ mode: "plan", step, generic: false }, planPath(answers));
    requestAnimationFrame(() => scrollToTop(document.getElementById("plan")));
  }, [push, step, answers]);

  const readGeneric = useCallback(() => {
    setGeneric(true);
    setMode("plan");
    push({ mode: "plan", step, generic: true });
    requestAnimationFrame(() => scrollToTop(document.getElementById("plan")));
  }, [push, step]);

  const editAt = useCallback(
    (n: number) => {
      setStep(n);
      setMode("questions");
      push({ mode: "questions", step: n, generic: false });
      requestAnimationFrame(() => scrollToTop(document.getElementById("questions")));
    },
    [push],
  );

  const value = useMemo<Ctx>(
    () => ({ today, answers, setAnswers, mode, generic, plan, shareUrl: `${origin}${planPath(answers)}`, readGeneric, step, reached, goTo, back, finish, editAt }),
    [today, answers, setAnswers, mode, generic, plan, origin, readGeneric, step, reached, goTo, back, finish, editAt],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

/** The browser's date, the way the server writes it. */
const clientToday = () => new Date().toISOString().slice(0, 10);

const fresh = (today: string): Start => ({ today, answers: parseAnswers({}, today), mode: "questions", step: 0, reached: 0 });

/** A link's plan, or the answers in progress, on the browser's date; null when the server's render already fits. */
function startFromBrowser(sp: URLSearchParams, serverToday: string): Start | null {
  const today = clientToday();
  const params = Object.fromEntries(sp);
  if (hasAnswers(params)) return { today, answers: parseAnswers(params, today), mode: "plan", step: 0, reached: Number.POSITIVE_INFINITY };
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(MOVE_DRAFT);
  } catch {
    stored = null;
  }
  const saved = readMoveDraft(stored);
  if (saved) {
    const answers = parseAnswers(Object.fromEntries(new URLSearchParams(saved.query)), today);
    // A finished plan opens on the questions with its answers, the way a return visit always has.
    const step = saved.mode === "questions" ? saved.step : 0;
    return { today, answers, mode: "questions", step, reached: Math.max(step, saved.reached) };
  }
  return today === serverToday ? null : fresh(today);
}

/**
 * Atlas Move as the static page serves it: question one on the server, then,
 * in the browser, a link's plan, or the answers in progress, on today's date.
 */
export function PlannerProvider({ serverToday, children }: { serverToday: string; children: ReactNode }) {
  const { initial, key } = useUrlInitial((sp) => startFromBrowser(sp, serverToday), fresh(serverToday));
  return (
    <PlannerState key={key} start={initial}>
      {children}
    </PlannerState>
  );
}

export function usePlanner(): Ctx {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner outside PlannerProvider");
  return ctx;
}

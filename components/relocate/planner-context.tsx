"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { buildPlan, normalizeAnswers, type Answers, type Plan } from "@/lib/relocate/plan";
import { answersToQuery, hasAnswers, parseAnswers } from "@/lib/relocate/url";

export type Mode = "questions" | "plan";

type Ctx = {
  today: string;
  answers: Answers;
  setAnswers: (patch: Partial<Answers>) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  /** True when the plan was shown from "I'll just read" and no answer has been touched. */
  generic: boolean;
  plan: Plan;
  /** The share link for the current answers, absolute once mounted. */
  shareUrl: string;
  /** "I'll just read": show the generic plan without touching the answers. */
  readGeneric: () => void;
};

const PlannerContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "relocate:answers";

/**
 * One state for the planner: the six answers, which the URL carries (the
 * source of truth, so a link is a plan) and localStorage mirrors (so a
 * return visit picks up where it left off). The server parses the query and
 * passes `initialAnswers`, so the first paint matches the link.
 */
export function PlannerProvider({ today, initialAnswers, initialHasAnswers, children }: { today: string; initialAnswers: Answers; initialHasAnswers: boolean; children: ReactNode }) {
  const [answers, setAnswersState] = useState<Answers>(initialAnswers);
  const [mode, setMode] = useState<Mode>(initialHasAnswers ? "plan" : "questions");
  const [generic, setGeneric] = useState(false);
  const [origin, setOrigin] = useState("");
  const query = useMemo(() => answersToQuery(answers), [answers]);
  const plan = useMemo(() => buildPlan(answers, today), [answers, today]);

  /* A fresh visit with no answers in the address: try the browser's mirror. */
  useEffect(() => {
    setOrigin(window.location.origin);
    if (initialHasAnswers) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const params = Object.fromEntries(new URLSearchParams(raw));
      if (!hasAnswers(params)) return;
      setAnswersState(parseAnswers(params, today));
    } catch {
      /* private mode, blocked storage: the defaults stand */
    }
  }, [initialHasAnswers, today]);

  /* The URL is the record. Mirror it once a plan is on the page. */
  useEffect(() => {
    if (mode !== "plan") return;
    try {
      const url = new URL(window.location.href);
      if (url.search !== `?${query}`) {
        url.search = query;
        window.history.replaceState(window.history.state, "", url);
      }
      window.localStorage.setItem(STORAGE_KEY, query);
    } catch {
      /* nothing to do */
    }
  }, [mode, query]);

  /* One Explore event per rendered plan. The commute text is context only, so typing in it doesn't count as a new plan. */
  const trackKey = useMemo(() => answersToQuery({ ...answers, work: answers.work === "commute" ? "na" : answers.work, commuteTo: undefined }), [answers]);
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "plan" || tracked.current === trackKey) return;
    tracked.current = trackKey;
    track("Explore", { action: "relocate-plan" });
  }, [mode, trackKey]);

  const setAnswers = useCallback(
    (patch: Partial<Answers>) => {
      setGeneric(false);
      setAnswersState((prev) => normalizeAnswers({ ...prev, ...patch }, today));
    },
    [today],
  );

  const readGeneric = useCallback(() => {
    setGeneric(true);
    setMode("plan");
  }, []);

  const value = useMemo<Ctx>(
    () => ({ today, answers, setAnswers, mode, setMode, generic, plan, shareUrl: `${origin}/relocate?${query}`, readGeneric }),
    [today, answers, setAnswers, mode, generic, plan, origin, query, readGeneric],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): Ctx {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner outside PlannerProvider");
  return ctx;
}

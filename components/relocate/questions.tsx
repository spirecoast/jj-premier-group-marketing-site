"use client";

import { useId, useState, type ReactNode } from "react";
import { QUESTIONS as Q } from "@/lib/relocate/copy";
import { STATE_CODES, STATES } from "@/lib/relocate/states";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";

const STEPS = ["moveIn", "path", "homeToSell", "fromState", "county"] as const;
type StepKey = (typeof STEPS)[number];

/** Choices drawn as pills; the chosen one fills navy and shows a tick. */
function Choice<T extends string | number>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] transition-[background-color,border-color,color] duration-200",
              on ? "border-navy bg-navy text-linen-100" : "border-hairline bg-white text-navy hover:border-navy",
            )}
          >
            {on ? (
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
                <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** One question as a numbered card. On phones only the active card shows; from md every card is on the page. */
function Card({ n, id, label, hint, active, className, children }: { n: number; id: string; label: string; hint?: string; active: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex-col gap-5 border border-hairline bg-white p-6 sm:p-7", active ? "flex" : "hidden md:flex", className)}>
      <div className="flex items-start gap-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-100 font-display text-[18px] text-sky-800" aria-hidden="true">
          {n}
        </span>
        <div className="flex flex-col gap-1 pt-1">
          <span id={id} className="font-display text-[clamp(1.25rem,1.6vw,1.5rem)] font-light leading-tight text-navy">
            {label}
          </span>
          {hint ? <span className="t-small text-graphite-500">{hint}</span> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * The five questions. One DOM: on phones a stepper shows one card at a time,
 * from md the cards sit in a grid. Every answer has a default, so a visitor
 * can go straight to the plan.
 */
export function Questions() {
  const { today, answers, setAnswers, mode, setMode, readGeneric } = usePlanner();
  const uid = useId();
  const [step, setStep] = useState(0);
  const key: StepKey = STEPS[step]!;
  const buying = answers.path !== "renting-first";
  const last = step === STEPS.length - 1;
  const id = (k: string) => `${uid}-${k}`;

  const go = (n: number) => setStep(Math.min(STEPS.length - 1, Math.max(0, n)));
  const finish = () => {
    setMode("plan");
    requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const folded = mode === "plan";

  return (
    <section id="questions" className="container-site flex scroll-mt-header flex-col gap-8 py-section print:hidden" aria-labelledby="questions-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="questions-title" className="t-h1 text-navy">
          {Q.title}
        </h2>
        {mode === "questions" ? (
          <button type="button" onClick={readGeneric} className="link-rule">
            {Q.skipAll}
          </button>
        ) : null}
      </div>

      <div className={cn("flex-col gap-6", folded ? "hidden md:flex" : "flex")}>
        {/* Phone stepper rail. */}
        <div className="flex items-center justify-between md:hidden">
          <span className="t-mono-sm text-graphite-500">
            {step + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1 w-7 rounded-full transition-colors", i <= step ? "bg-navy" : "bg-hairline")} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card n={1} id={id("move-in")} label={Q.moveIn.label} hint={Q.moveIn.hint} active={key === "moveIn"} className="lg:col-span-2">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-start">
              <input
                type="date"
                aria-labelledby={id("move-in")}
                className="field-input"
                min={today}
                value={answers.moveInDate}
                onChange={(e) => e.target.value && setAnswers({ moveInDate: e.target.value })}
              />
              {buying ? (
                <div className="flex flex-col gap-2">
                  <span id={id("gap")} className="t-small text-graphite-600">
                    {Q.closingOffset.label}
                  </span>
                  <Choice labelId={id("gap")} options={Q.closingOffset.options} value={answers.closingOffset} onChange={(closingOffset) => setAnswers({ closingOffset })} />
                </div>
              ) : null}
            </div>
          </Card>

          <Card n={2} id={id("path")} label={Q.path.label} active={key === "path"}>
            <Choice
              labelId={id("path")}
              options={(Object.keys(Q.path.options) as (keyof typeof Q.path.options)[]).map((v) => ({ value: v, label: Q.path.options[v] }))}
              value={answers.path}
              onChange={(path) => setAnswers({ path })}
            />
            {buying ? (
              <div className="flex flex-col gap-2 border-t border-hairline pt-4">
                <span id={id("fin")} className="t-small text-graphite-600">
                  {Q.financing.label}
                </span>
                <Choice
                  labelId={id("fin")}
                  options={(Object.keys(Q.financing.options) as (keyof typeof Q.financing.options)[]).map((v) => ({ value: v, label: Q.financing.options[v] }))}
                  value={answers.financing}
                  onChange={(financing) => setAnswers({ financing })}
                />
              </div>
            ) : null}
          </Card>

          <Card n={3} id={id("sell")} label={Q.homeToSell.label} active={key === "homeToSell"}>
            <Choice
              labelId={id("sell")}
              options={(Object.keys(Q.homeToSell.options) as (keyof typeof Q.homeToSell.options)[]).map((v) => ({ value: v, label: Q.homeToSell.options[v] }))}
              value={answers.homeToSell}
              onChange={(homeToSell) => setAnswers({ homeToSell })}
            />
          </Card>

          <Card n={4} id={id("from")} label={Q.fromState.label} active={key === "fromState"}>
            <select aria-labelledby={id("from")} className="field-input" value={answers.fromState} onChange={(e) => setAnswers({ fromState: e.target.value })}>
              <option value="other">{Q.fromState.other}</option>
              {STATE_CODES.map((c) => (
                <option key={c} value={c}>
                  {STATES[c]}
                </option>
              ))}
            </select>
          </Card>

          <Card n={5} id={id("county")} label={Q.county.label} hint={Q.county.hint} active={key === "county"}>
            <Choice
              labelId={id("county")}
              options={(Object.keys(Q.county.options) as (keyof typeof Q.county.options)[]).map((v) => ({ value: v, label: Q.county.options[v] }))}
              value={answers.county}
              onChange={(county) => setAnswers({ county })}
            />
          </Card>
        </div>

        {/* Phone: back / skip / next. From md: one button. */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex w-full items-center justify-between gap-4 md:hidden">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="link-rule disabled:opacity-40">
              {Q.back}
            </button>
            <div className="flex items-center gap-4">
              {!last ? (
                <button type="button" onClick={() => go(step + 1)} className="t-small text-graphite-500 underline underline-offset-4">
                  {Q.skip}
                </button>
              ) : null}
              <button type="button" onClick={last ? finish : () => go(step + 1)} className="btn btn-navy">
                {last ? Q.showPlan : Q.next}
                <span className="btn-dash" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="hidden w-full items-center gap-6 md:flex">
            <button type="button" onClick={finish} className="btn btn-navy">
              {Q.showPlan}
              <span className="btn-dash" aria-hidden="true" />
            </button>
            {mode === "plan" ? <span className="t-small text-graphite-500">{Q.live}</span> : null}
          </div>
        </div>
      </div>

      {/* Phone, plan mode: the questions fold to a line. */}
      {folded ? (
        <div className="flex items-center justify-between gap-4 border border-hairline bg-white p-5 md:hidden">
          <span className="t-small text-body">{Q.folded(STEPS.length)}</span>
          <button
            type="button"
            onClick={() => {
              setMode("questions");
              setStep(0);
            }}
            className="link-rule shrink-0"
          >
            {Q.editAnswers}
          </button>
        </div>
      ) : null}
    </section>
  );
}

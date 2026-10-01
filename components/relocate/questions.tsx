"use client";

import { useId, useState, type ReactNode } from "react";
import { SectionHeading } from "@/components/section-heading";
import { QUESTIONS as Q } from "@/lib/relocate/copy";
import { FACTS } from "@/lib/relocate/sources";
import { STATE_CODES, STATES } from "@/lib/relocate/states";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";

const STEPS = ["moveIn", "path", "homeToSell", "fromState", "work", "county"] as const;
type StepKey = (typeof STEPS)[number];

/** Radio-style choices drawn as bordered buttons. One group per question. */
function Choice<T extends string>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-11 border px-4 font-body text-[15px] transition-colors",
              on ? "border-navy bg-navy text-linen-200" : "border-hairline bg-white text-navy hover:border-navy",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ id, label, hint, children, active, className }: { id: string; label: string; hint?: string; children: ReactNode; active: boolean; className?: string }) {
  return (
    <div className={cn("flex-col gap-3", active ? "flex" : "hidden md:flex", className)}>
      <div className="flex flex-col gap-1">
        <span id={id} className="field-label">
          {label}
        </span>
        {hint ? <span className="t-small text-graphite-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * 02 · The six questions. One DOM: on phones a stepper shows one field at a
 * time (the others take `hidden`), on desktop every field is on the page as
 * a compact form. Every answer has a default, so skipping is always allowed.
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
    document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* In plan mode on phones, the form folds to a line and a button. */
  const folded = mode === "plan";

  return (
    <section id="questions" className="container-site flex scroll-mt-header flex-col gap-10 pb-section print:hidden" aria-labelledby="questions-title">
      <SectionHeading
        eyebrow={Q.eyebrow}
        title={<span id="questions-title">{Q.title}</span>}
        aside={
          mode === "questions" ? (
            <div className="flex flex-col gap-1">
              <button type="button" onClick={readGeneric} className="link-rule self-start">
                {Q.skipAll}
              </button>
              <span className="t-small text-graphite-500">{Q.skipAllHint}</span>
            </div>
          ) : null
        }
      />

      <div className={cn("border border-hairline bg-white p-6 sm:p-8", folded && "md:block", folded ? "hidden" : "block")}>
        {/* Phone stepper rail. */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <span className="t-mono-sm text-graphite-500">
            {step + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-px w-6", i <= step ? "bg-navy" : "bg-hairline")} />
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Field id={id("move-in")} label={Q.moveIn.label} hint={Q.moveIn.hint} active={key === "moveIn"}>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <input
                type="date"
                aria-labelledby={id("move-in")}
                className="field-input"
                min={today}
                value={answers.moveInDate}
                onChange={(e) => e.target.value && setAnswers({ moveInDate: e.target.value })}
              />
              {buying ? (
                <label className="flex flex-col gap-1">
                  <span className="t-small text-graphite-500">{Q.closingOffset.label}</span>
                  <select className="field-input" value={answers.closingOffset} onChange={(e) => setAnswers({ closingOffset: Number(e.target.value) })}>
                    {Array.from({ length: FACTS.planning.closingOffsetMax + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            {buying ? <span className="t-small text-graphite-500">{Q.closingOffset.hint}</span> : null}
          </Field>

          <Field id={id("path")} label={Q.path.label} active={key === "path"}>
            <Choice
              labelId={id("path")}
              options={(Object.keys(Q.path.options) as (keyof typeof Q.path.options)[]).map((v) => ({ value: v, label: Q.path.options[v] }))}
              value={answers.path}
              onChange={(path) => setAnswers({ path })}
            />
            {buying ? (
              <div className="flex flex-col gap-2 pt-2">
                <span id={id("fin")} className="t-small text-graphite-500">
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
          </Field>

          <Field id={id("sell")} label={Q.homeToSell.label} active={key === "homeToSell"}>
            <Choice
              labelId={id("sell")}
              options={(Object.keys(Q.homeToSell.options) as (keyof typeof Q.homeToSell.options)[]).map((v) => ({ value: v, label: Q.homeToSell.options[v] }))}
              value={answers.homeToSell}
              onChange={(homeToSell) => setAnswers({ homeToSell })}
            />
          </Field>

          <Field id={id("from")} label={Q.fromState.label} active={key === "fromState"}>
            <select aria-labelledby={id("from")} className="field-input" value={answers.fromState} onChange={(e) => setAnswers({ fromState: e.target.value })}>
              <option value="other">{Q.fromState.other}</option>
              {STATE_CODES.map((c) => (
                <option key={c} value={c}>
                  {STATES[c]}
                </option>
              ))}
            </select>
          </Field>

          <Field id={id("work")} label={Q.work.label} active={key === "work"}>
            <Choice
              labelId={id("work")}
              options={(Object.keys(Q.work.options) as (keyof typeof Q.work.options)[]).map((v) => ({ value: v, label: Q.work.options[v] }))}
              value={answers.work}
              onChange={(work) => setAnswers({ work })}
            />
            {answers.work === "commute" ? (
              <label className="flex flex-col gap-1 pt-2">
                <span className="t-small text-graphite-500">{Q.work.commuteTo.label}</span>
                <input type="text" className="field-input" maxLength={80} placeholder={Q.work.commuteTo.placeholder} value={answers.commuteTo ?? ""} onChange={(e) => setAnswers({ commuteTo: e.target.value })} />
                <span className="t-small text-graphite-500">{Q.work.commuteTo.hint}</span>
              </label>
            ) : null}
          </Field>

          <Field id={id("county")} label={Q.county.label} hint={Q.county.hint} active={key === "county"}>
            <Choice
              labelId={id("county")}
              options={(Object.keys(Q.county.options) as (keyof typeof Q.county.options)[]).map((v) => ({ value: v, label: Q.county.options[v] }))}
              value={answers.county}
              onChange={(county) => setAnswers({ county })}
            />
          </Field>
        </div>

        {/* Phone: back / skip / next. Desktop: one button. */}
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-hairline pt-6">
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
          <div className="hidden w-full items-center justify-between gap-4 md:flex">
            <button type="button" onClick={finish} className="btn btn-navy">
              {Q.showPlan}
              <span className="btn-dash" aria-hidden="true" />
            </button>
            {mode === "plan" ? <span className="t-small text-graphite-500">{Q.live}</span> : null}
          </div>
        </div>
      </div>

      {/* Phone, plan mode: the fold. */}
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

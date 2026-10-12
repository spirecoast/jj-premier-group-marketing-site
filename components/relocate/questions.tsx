"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { QUESTIONS as Q } from "@/lib/relocate/copy";
import { formatDate } from "@/lib/relocate/plan";
import { STATE_CODES, STATES } from "@/lib/relocate/states";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";

const STEPS = ["moveIn", "path", "homeToSell", "fromState", "county"] as const;

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY);

/** The main answer to a question, as large tiles with a radio dot. */
function Tiles<T extends string>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-labelledby={labelId} className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-16 items-center gap-4 border px-5 text-left text-[16px] transition-[background-color,border-color,color,box-shadow] duration-200",
              on ? "border-navy bg-navy text-linen-100 shadow-[0_18px_40px_-24px_rgba(16,37,66,0.7)]" : "border-hairline bg-white text-navy hover:border-navy",
            )}
          >
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-atlas bg-atlas" : "border-graphite-400")} aria-hidden="true">
              {on ? (
                <svg width="10" height="10" viewBox="0 0 12 12">
                  <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="var(--color-atlas-deep)" strokeWidth="2" />
                </svg>
              ) : null}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A follow-up answer, as pills. */
function Pills<T extends string | number>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
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

function FollowUp({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-hairline pt-6">
      <span id={id} className="t-body font-medium text-navy">
        {label}
      </span>
      {children}
    </div>
  );
}

const opts = <K extends string>(o: Record<K, string>) => (Object.keys(o) as K[]).map((v) => ({ value: v, label: o[v] }));

/**
 * The five questions, one at a time. From lg a rail beside the card shows
 * where you are and what you've said, and takes you back to any question.
 * Every answer has a default, so a visitor can go straight to the plan.
 * Once the plan shows, the questions step aside; the plan's answer chips
 * bring any one of them back.
 */
export function Questions() {
  const { today, answers, setAnswers, mode, setMode, readGeneric, step, setStep, reached, setReached } = usePlanner();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const key = STEPS[step]!;
  const last = step === STEPS.length - 1;
  const buying = answers.path !== "renting-first";

  /* After Back, Next or a rail click, focus the new question and keep it in view. */
  useEffect(() => {
    if (!moved.current) return;
    titleRef.current?.focus({ preventScroll: true });
    const section = document.getElementById("questions");
    if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  if (mode === "plan") return null;

  const go = (n: number) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, n));
    moved.current = true;
    setStep(next);
    setReached(Math.max(reached, next));
  };
  const finish = () => {
    setReached(STEPS.length);
    setMode("plan");
    requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const summary: Record<(typeof STEPS)[number], string> = {
    moveIn: formatDate(answers.moveInDate),
    path: answers.path === "buying" ? `${Q.path.options.buying}, ${Q.financing.options[answers.financing].toLowerCase()}` : Q.path.options[answers.path],
    homeToSell: Q.homeToSell.options[answers.homeToSell],
    fromState: answers.fromState === "other" ? Q.fromState.other : (STATES[answers.fromState as keyof typeof STATES] ?? answers.fromState),
    county: Q.county.options[answers.county],
  };
  const away = daysBetween(today, answers.moveInDate);
  const hint = "hint" in Q[key] ? (Q[key] as { hint: string }).hint : null;

  return (
    <section id="questions" className="container-site scroll-mt-header py-section print:hidden" aria-labelledby={id("q")}>
      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-14">
        {/* The rail: where you are, and what you've said so far. */}
        <nav aria-label={Q.title} className="hidden flex-col gap-6 lg:flex">
          <p className="t-h3 text-navy">{Q.title}</p>
          <ol className="flex flex-col">
            {STEPS.map((s, i) => {
              const current = i === step;
              const seen = i <= reached;
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={current ? "step" : undefined}
                    className={cn("flex w-full items-start gap-4 border-l-2 py-3 pl-5 text-left transition-colors", current ? "border-navy" : "border-hairline hover:border-graphite-400")}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[13px] tabular-nums transition-colors",
                        current ? "bg-navy text-linen-100" : seen ? "bg-atlas/25 text-atlas-ink" : "border border-hairline text-graphite-500",
                      )}
                      aria-hidden="true"
                    >
                      {seen && !current ? (
                        <svg width="12" height="12" viewBox="0 0 12 12">
                          <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className={cn("t-small", current ? "text-navy" : "text-graphite-500")}>{Q[s].short}</span>
                      {seen ? <span className="truncate text-[15px] text-navy">{summary[s]}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={readGeneric} className="link-rule self-start">
            {Q.skipAll}
          </button>
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <span className="t-small text-graphite-500 tabular-nums">
              {step + 1} of {STEPS.length}
            </span>
            <button type="button" onClick={readGeneric} className="link-rule">
              {Q.skipAll}
            </button>
          </div>

          <div className="flex flex-col gap-8 border border-hairline bg-white p-6 shadow-[0_24px_60px_-40px_rgba(16,37,66,0.4)] sm:p-10">
            <span className="flex gap-1" aria-hidden="true">
              {STEPS.map((s, i) => (
                <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-navy" : "bg-hairline")} />
              ))}
            </span>

            <div key={key} className="move-q-step flex min-h-[240px] flex-col gap-8">
              <div className="flex flex-col gap-3">
                <h2 id={id("q")} ref={titleRef} tabIndex={-1} className="t-h1 max-w-[680px] text-navy outline-none">
                  {Q[key].label}
                </h2>
                {hint ? <p className="t-body text-body">{hint}</p> : null}
              </div>

              {key === "moveIn" ? (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                    <input
                      type="date"
                      aria-labelledby={id("q")}
                      className="field-input max-w-[260px] text-[18px]"
                      min={today}
                      value={answers.moveInDate}
                      onChange={(e) => e.target.value && setAnswers({ moveInDate: e.target.value })}
                    />
                    {away > 0 ? <span className="t-small pb-3 text-graphite-500">{Q.moveIn.away(away)}</span> : null}
                  </div>
                  {buying ? (
                    <FollowUp id={id("gap")} label={Q.closingOffset.label}>
                      <Pills labelId={id("gap")} options={Q.closingOffset.options} value={answers.closingOffset} onChange={(closingOffset) => setAnswers({ closingOffset })} />
                    </FollowUp>
                  ) : null}
                </div>
              ) : null}

              {key === "path" ? (
                <div className="flex flex-col gap-8">
                  <Tiles labelId={id("q")} options={opts(Q.path.options)} value={answers.path} onChange={(path) => setAnswers({ path })} />
                  {buying ? (
                    <FollowUp id={id("fin")} label={Q.financing.label}>
                      <Pills labelId={id("fin")} options={opts(Q.financing.options)} value={answers.financing} onChange={(financing) => setAnswers({ financing })} />
                    </FollowUp>
                  ) : null}
                </div>
              ) : null}

              {key === "homeToSell" ? <Tiles labelId={id("q")} options={opts(Q.homeToSell.options)} value={answers.homeToSell} onChange={(homeToSell) => setAnswers({ homeToSell })} /> : null}

              {key === "fromState" ? (
                <select aria-labelledby={id("q")} className="field-input max-w-[420px] text-[18px]" value={answers.fromState} onChange={(e) => setAnswers({ fromState: e.target.value })}>
                  <option value="other">{Q.fromState.other}</option>
                  {STATE_CODES.map((c) => (
                    <option key={c} value={c}>
                      {STATES[c]}
                    </option>
                  ))}
                </select>
              ) : null}

              {key === "county" ? <Tiles labelId={id("q")} options={opts(Q.county.options)} value={answers.county} onChange={(county) => setAnswers({ county })} /> : null}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-hairline pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => go(step - 1)} className="link-rule">
                  {Q.back}
                </button>
              ) : (
                <span />
              )}
              <button type="button" onClick={last ? finish : () => go(step + 1)} className="btn btn-navy">
                {last ? Q.showPlan : Q.next}
                <span className="btn-dash" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

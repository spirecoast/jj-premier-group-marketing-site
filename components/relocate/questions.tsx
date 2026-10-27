"use client";

import { useId, type ReactNode } from "react";
import { Chip, ChipGroup, ChoiceTile } from "@/components/ui/chip";
import { Input, Select } from "@/components/ui/field";
import { RuleButton } from "@/components/ui/button";
import { StepBody, StepCard, StepFooter, StepNumber, StepProgress, StepTitle, useStepDirection, useStepFocus } from "@/components/ui/stepper";
import { QUESTIONS as Q } from "@/lib/relocate/copy";
import { formatDate } from "@/lib/relocate/plan";
import { STATE_CODES, STATES } from "@/lib/relocate/states";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";

const STEPS = ["moveIn", "path", "homeToSell", "fromState", "county"] as const;

/** How far ahead the date picker reaches: a move-in three years out is as far as a plan is worth drawing. */
const MOVE_IN_YEARS_AHEAD = 3;

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY);

/** The main answer to a question, as large tiles with a square check. */
function Tiles<T extends string>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-labelledby={labelId} className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <ChoiceTile key={o.value} selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </ChoiceTile>
      ))}
    </div>
  );
}

/** A follow-up answer, as chips. */
function Chips<T extends string | number>({ labelId, options, value, onChange }: { labelId: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <ChipGroup aria-labelledby={labelId}>
      {options.map((o) => (
        <Chip key={String(o.value)} size="lg" selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </ChipGroup>
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
  const { today, answers, setAnswers, mode, readGeneric, step, reached, goTo, back, finish } = usePlanner();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  /* After Back, Next or a rail click, the new question takes focus and comes back into view if it had scrolled up under the header. */
  const titleRef = useStepFocus<HTMLHeadingElement>(step);
  const dir = useStepDirection(step);

  const key = STEPS[step]!;
  const last = step === STEPS.length - 1;
  const buying = answers.path !== "renting-first";

  if (mode === "plan") return null;

  const go = goTo;

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
                    <span className="mt-0.5 flex">
                      <StepNumber n={i + 1} state={current ? "current" : seen ? "done" : "todo"} />
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
          <RuleButton onClick={readGeneric} className="self-start">
            {Q.skipAll}
          </RuleButton>
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <span className="t-small text-graphite-500 tabular-nums">
              {step + 1} of {STEPS.length}
            </span>
            <RuleButton onClick={readGeneric}>{Q.skipAll}</RuleButton>
          </div>

          <StepCard className="max-w-none p-6">
            <StepProgress step={step + 1} total={STEPS.length} count={false} />

            <StepBody stepKey={key} dir={dir}>
              <div className="flex flex-col gap-3">
                <StepTitle id={id("q")} ref={titleRef} className="max-w-[680px]">
                  {Q[key].label}
                </StepTitle>
                {hint ? <p className="t-body text-body">{hint}</p> : null}
              </div>

              {key === "moveIn" ? (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                    <Input
                      type="date"
                      aria-labelledby={id("q")}
                      className="max-w-[260px] text-[18px]"
                      min={today}
                      max={`${Number(today.slice(0, 4)) + MOVE_IN_YEARS_AHEAD}${today.slice(4)}`}
                      value={answers.moveInDate}
                      onChange={(e) => e.target.value && setAnswers({ moveInDate: e.target.value })}
                    />
                    {away > 0 ? <span className="t-small pb-3 text-graphite-500">{Q.moveIn.away(away)}</span> : null}
                  </div>
                  {buying ? (
                    <FollowUp id={id("gap")} label={Q.closingOffset.label}>
                      <Chips labelId={id("gap")} options={Q.closingOffset.options} value={answers.closingOffset} onChange={(closingOffset) => setAnswers({ closingOffset })} />
                    </FollowUp>
                  ) : null}
                </div>
              ) : null}

              {key === "path" ? (
                <div className="flex flex-col gap-8">
                  <Tiles labelId={id("q")} options={opts(Q.path.options)} value={answers.path} onChange={(path) => setAnswers({ path })} />
                  {buying ? (
                    <FollowUp id={id("fin")} label={Q.financing.label}>
                      <Chips labelId={id("fin")} options={opts(Q.financing.options)} value={answers.financing} onChange={(financing) => setAnswers({ financing })} />
                    </FollowUp>
                  ) : null}
                </div>
              ) : null}

              {key === "homeToSell" ? <Tiles labelId={id("q")} options={opts(Q.homeToSell.options)} value={answers.homeToSell} onChange={(homeToSell) => setAnswers({ homeToSell })} /> : null}

              {key === "fromState" ? (
                <Select aria-labelledby={id("q")} className="max-w-[420px] text-[18px]" value={answers.fromState} onChange={(e) => setAnswers({ fromState: e.target.value })}>
                  <option value="other">{Q.fromState.other}</option>
                  {STATE_CODES.map((c) => (
                    <option key={c} value={c}>
                      {STATES[c]}
                    </option>
                  ))}
                </Select>
              ) : null}

              {key === "county" ? <Tiles labelId={id("q")} options={opts(Q.county.options)} value={answers.county} onChange={(county) => setAnswers({ county })} /> : null}
            </StepBody>

            <StepFooter
              back={step > 0 ? { label: Q.back, onClick: back } : undefined}
              next={{ label: last ? Q.showPlan : Q.next, onClick: last ? finish : () => go(step + 1) }}
            />
          </StepCard>
        </div>
      </div>
    </section>
  );
}

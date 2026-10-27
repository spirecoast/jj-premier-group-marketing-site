"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import { revealStep } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { Button, RuleButton } from "./button";

/**
 * One question at a time. Atlas Match, Atlas Move and the Encore Planner
 * each keep their own state (the URL, a context, a draft); these pieces give
 * them one look and one behaviour:
 *
 *   <StepCard as="form" onSubmit={…}>
 *     <StepProgress step={2} total={5} />
 *     <StepBody stepKey={key}>
 *       <StepTitle ref={titleRef} id="q">Where are you moving from?</StepTitle>
 *       …
 *     </StepBody>
 *     <StepFooter back={{ onClick }} next={{ label: "Next", onClick }} />
 *   </StepCard>
 *
 * The card is white on a hairline with no shadow; the progress is a row of
 * 2px square segments; the step slides in the way the visitor moved (not
 * under reduced motion); after a move the title takes focus so a screen
 * reader hears the new question, and the card comes back into view if it
 * had scrolled up under the header.
 */

/**
 * Focuses the step's title after Back, Next or a jump, never on first paint,
 * and brings the question back into view when its top has gone up under the
 * sticky header (a phone, after a tall question): the card stops below the
 * header (`scroll-mt-header`), smoothly unless reduced motion is asked for.
 * A stepper that remounts its question on every move passes `onMount` once
 * the visitor has moved, so the fresh mount is treated as a move.
 */
export function useStepFocus<T extends HTMLElement>(step: number | string, onMount = false): RefObject<T | null> {
  const ref = useRef<T>(null);
  const moved = useRef(onMount);
  useEffect(() => {
    if (moved.current && ref.current) {
      ref.current.focus({ preventScroll: true });
      revealStep(ref.current.closest<HTMLElement>("[data-step-card]"));
    }
    moved.current = true;
  }, [step]);
  return ref;
}

/** Which way the last move went, so the next question slides in from the right and the one before from the left. */
export function useStepDirection(step: number): StepDir {
  const [prev, setPrev] = useState(step);
  const [dir, setDir] = useState<StepDir>("next");
  if (step !== prev) {
    setPrev(step);
    setDir(step < prev ? "back" : "next");
  }
  return dir;
}

export type StepDir = "next" | "back";

type CardProps = { as?: "div" | "form"; className?: string; children: ReactNode } & Omit<ComponentProps<"form">, "className" | "children">;

export function StepCard({ as = "div", className, children, ...rest }: CardProps) {
  const cls = cn("mx-auto flex w-full max-w-[960px] scroll-mt-header flex-col gap-8 border border-hairline bg-white p-5 sm:p-10", className);
  if (as === "form") {
    return (
      <form data-step-card="" className={cls} {...rest}>
        {children}
      </form>
    );
  }
  return (
    <div data-step-card="" className={cls} {...(rest as ComponentProps<"div">)}>
      {children}
    </div>
  );
}

const TONE = { navy: "bg-navy", encore: "bg-encore-ink", atlas: "bg-atlas-ink" } as const;

/** "2 of 5" and the bar. `done` is how many segments are filled (defaults to the step). */
export function StepProgress({ step, total, done = step, tone = "navy", count = true, className }: { step: number; total: number; done?: number; tone?: keyof typeof TONE; count?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {count ? (
        <span className="t-small shrink-0 text-graphite-500 tabular-nums">
          {step} of {total}
        </span>
      ) : null}
      <span className="flex flex-1 gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-0.5 flex-1 transition-colors duration-(--dur-panel)", i < done ? TONE[tone] : "bg-hairline")} />
        ))}
      </span>
    </div>
  );
}

/** The question's own ground. Keyed on the step so each one slides in fresh: from the right after Next, from the left after Back. */
export function StepBody({ stepKey, dir = "next", className, children }: { stepKey: string | number; dir?: StepDir; className?: string; children: ReactNode }) {
  return (
    <div key={stepKey} data-dir={dir} className={cn("move-q-step flex min-h-[240px] flex-col gap-8", className)}>
      {children}
    </div>
  );
}

export function StepTitle({ ref, id, className, children }: { ref?: RefObject<HTMLHeadingElement | null>; id?: string; className?: string; children: ReactNode }) {
  return (
    <h2 id={id} ref={ref} tabIndex={-1} className={cn("t-h1 max-w-[720px] text-navy outline-none", className)}>
      {children}
    </h2>
  );
}

/** The square 28px step number on a rail: navy when current, a tick once answered. */
export function StepNumber({ n, state }: { n: number; state: "current" | "done" | "todo" }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center font-mono text-[12px] tabular-nums transition-colors",
        state === "current" ? "bg-navy text-linen-100" : state === "done" ? "bg-atlas/25 text-atlas-ink" : "border border-hairline text-graphite-500",
      )}
      aria-hidden="true"
    >
      {state === "done" ? (
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : (
        n
      )}
    </span>
  );
}

type Action = { label: ReactNode; onClick?: () => void };

/** Back on the left; on the right anything extra, Skip, then Next or the finishing action (a submit when `submit`). */
export function StepFooter({ back, skip, next, submit = false, aside, children, className }: { back?: Action; skip?: Action; next: Action; submit?: boolean; aside?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between", className)}>
      {children ?? (back ? <RuleButton onClick={back.onClick}>{back.label}</RuleButton> : <span />)}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {aside}
        {children && back ? <RuleButton onClick={back.onClick}>{back.label}</RuleButton> : null}
        {skip ? <RuleButton onClick={skip.onClick}>{skip.label}</RuleButton> : null}
        <Button type={submit ? "submit" : "button"} dash onClick={next.onClick}>
          {next.label}
        </Button>
      </div>
    </div>
  );
}

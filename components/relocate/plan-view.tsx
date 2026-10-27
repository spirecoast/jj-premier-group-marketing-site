"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { EXPORTS, PLAN as C, QUESTIONS as Q } from "@/lib/relocate/copy";
import { PHASE_LABEL, formatDate, type Callout, type Milestone, type Phase } from "@/lib/relocate/plan";
import { SOURCES_CHECKED, SOURCE_LIST } from "@/lib/relocate/sources";
import { STATES } from "@/lib/relocate/states";
import { icsPath } from "@/lib/relocate/url";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";
import { ExternalLink } from "@/components/ui/external-link";

const PHASES: Phase[] = ["before", "contract", "closing", "after"];

/** Each phase keeps one colour through the key dates and the timeline. */
const TONE: Record<Phase, { dot: string; line: string; text: string }> = {
  before: { dot: "bg-sky-600", line: "bg-sky-300", text: "text-sky-700" },
  contract: { dot: "bg-navy", line: "bg-harbor-300", text: "text-navy" },
  closing: { dot: "bg-coral", line: "bg-coral/40", text: "text-danger" },
  after: { dot: "bg-success", line: "bg-success/35", text: "text-success" },
};

/** The dates a person plans the rest around, in the order they happen. */
const KEY_IDS = ["effective", "inspection", "closing", "move-in", "homestead"] as const;

function Flag({ flag }: { flag: Milestone["flags"][number] }) {
  const tone =
    flag === "hurricaneSeason" || flag === "forceMajeure"
      ? "border-warning/50 bg-warning-fill text-warning"
      : flag === "nfip30"
        ? "border-sky-300 bg-sky-50 text-sky-800"
        : "border-hairline bg-linen-50 text-graphite-600";
  return <span className={cn("border px-2.5 py-0.5 text-[12px]", tone)}>{C.flags[flag]}</span>;
}

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY);

function dayParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    year: d.getFullYear(),
  };
}

/** Each phase's dot on the dark key-dates panel. */
const KEY_DOT: Record<Phase, string> = { before: "bg-sky-300", contract: "bg-linen-100", closing: "bg-coral", after: "bg-atlas" };

/**
 * The five dates the rest hangs on, on the Atlas green: a track across the
 * top with the days between each, and a card per date counting down from
 * today. Move-in day, the one the whole plan is for, is filled.
 */
function KeyDates({ items, today }: { items: Milestone[]; today: string }) {
  if (!items.length) return null;
  return (
    <div className="key-dates relative overflow-hidden bg-atlas-deep px-5 py-8 text-linen-100 sm:p-10">
      <h3 className="t-h3 relative text-white">{C.keyDates}</h3>
      <ol data-print="keys" className="relative mt-6 grid gap-3 lg:mt-8 lg:grid-cols-5 lg:gap-4">
        {items.map((m, i) => {
          const p = dayParts(m.date!);
          const away = daysBetween(today, m.date!);
          const gap = i ? daysBetween(items[i - 1]!.date!, m.date!) : null;
          const goal = m.id === "move-in";
          return (
            <li key={m.id} data-print="key-item" className="flex flex-col gap-3">
              <div className="hidden items-center gap-3 lg:flex" aria-hidden="true">
                <span className={cn("size-3 shrink-0 rounded-full ring-4 ring-white/10", KEY_DOT[m.phase])} />
                <span className="h-px flex-1 bg-white/20" />
              </div>
              <div
                data-print="key"
                className={cn(
                  "grid flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4 border p-5 transition-transform duration-(--dur-panel) hover:-translate-y-0.5 lg:flex lg:flex-col lg:gap-1",
                  goal ? "border-atlas bg-atlas text-atlas-deep" : "border-white/12 bg-white/[0.06] backdrop-blur-sm",
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className={cn("t-small flex items-center gap-2", goal ? "text-atlas-deep/70" : "text-white/55")}>
                    <span className={cn("size-2 shrink-0 rounded-full lg:hidden", KEY_DOT[m.phase])} aria-hidden="true" />
                    {gap !== null && gap > 0 ? C.gapDays(gap) : "\u00a0"}
                  </span>
                  <span className={cn("font-display text-[2.125rem] font-light leading-none lg:text-[2.5rem]", goal ? "text-atlas-deep" : "text-white")}>{p.day}</span>
                  <span className={cn("t-small", goal ? "text-atlas-deep/80" : "text-white/65")}>
                    {p.weekday}, {p.year}
                  </span>
                </div>
                <div className="flex flex-col justify-end gap-2 lg:mt-3 lg:flex-1 lg:justify-between">
                  <span className={cn("text-[16px] font-medium leading-snug", goal ? "text-atlas-deep" : "text-white")}>{C.keyTitles[m.id] ?? m.title}</span>
                  <span className={cn("self-start px-2.5 py-0.5 pt-1 text-[12px] tabular-nums print:hidden", away < 0 ? "bg-coral/90 text-white" : goal ? "bg-atlas-deep text-atlas" : "bg-white/10 text-white/80")}>
                    {away < 0 ? C.past : C.inDays(away)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CalloutCard({ c }: { c: Callout }) {
  const { setAnswers } = usePlanner();
  const urgent = c.id === "past";
  return (
    <li data-print="callout" className={cn("flex gap-4 border bg-white p-6", urgent ? "border-coral md:col-span-2" : "border-hairline")}>
      <span className={cn("grid size-9 shrink-0 place-items-center print:hidden", urgent ? "bg-coral text-white" : "bg-warning-fill text-warning")} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="4" r="1.2" fill="currentColor" />
          <path d="M8 7v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <h4 className="t-h4 text-navy">{c.title}</h4>
        <p className="t-body text-body">{c.body}</p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          {c.action ? (
            <button type="button" className="btn btn-navy !min-h-11 print:hidden" onClick={() => setAnswers({ moveInDate: c.action!.moveInDate })}>
              {c.action.label}
              <span className="btn-dash" aria-hidden="true" />
            </button>
          ) : null}
          <ExternalLink href={c.source.url} className="t-small text-graphite-600 underline underline-offset-4 hover:text-navy print:hidden">
            {C.sourceLabel}: {c.source.label}
          </ExternalLink>
        </div>
      </div>
    </li>
  );
}

function Step({ m, phase, lastInPhase }: { m: Milestone; phase: Phase; lastInPhase: boolean }) {
  const t = TONE[phase];
  return (
    <li data-print="row" className="relative grid grid-cols-[22px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[140px_22px_minmax(0,1fr)] sm:gap-x-5">
      <div className="relative col-start-1 row-start-1 flex justify-center sm:col-start-2" aria-hidden="true">
        <span className={cn("relative z-10 mt-[7px] h-3 w-3 rounded-full ring-4 ring-white", t.dot)} />
        {!lastInPhase ? <span className={cn("absolute top-[19px] bottom-0 w-px", t.line)} /> : null}
      </div>
      <div className="row-start-1 hidden sm:col-start-1 sm:block">
        <span className="t-record text-navy">{m.date ? formatDate(m.date) : C.undated}</span>
      </div>
      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-2 pb-7 sm:col-start-3">
        <span className="t-record text-graphite-500 sm:hidden">{m.date ? formatDate(m.date) : C.undated}</span>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="t-h4 text-navy">{m.title}</h4>
          {m.flags.map((f) => (
            <Flag key={f} flag={f} />
          ))}
        </div>
        <p className="t-body max-w-measure text-body">{m.body}</p>
        <details className="group max-w-measure print:hidden">
          <summary className="t-small inline-flex cursor-pointer list-none items-center gap-1.5 text-graphite-600 hover:text-navy [&::-webkit-details-marker]:hidden">
            <span className="transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
            {C.basisLabel}
          </summary>
          <div className="t-small mt-2 flex flex-col gap-1.5 border-l border-hairline pl-4 text-graphite-600">
            <p>{m.basis}</p>
            {m.dateRange && m.dateRange.start !== m.dateRange.end ? (
              <p>
                {C.rangePrefix}: {formatDate(m.dateRange.start)} to {formatDate(m.dateRange.end)}
              </p>
            ) : null}
            {m.source ? (
              <ExternalLink href={m.source.url} className="self-start underline underline-offset-4 hover:text-navy">
                {C.sourceLabel}: {m.source.label}
              </ExternalLink>
            ) : (
              <span>{m.flags.includes("askUs") ? C.askUs : C.ourRule}</span>
            )}
          </div>
        </details>
        {m.link ? (
          <Link href={m.link.href as Route} className="t-small self-start text-sky-700 underline underline-offset-4 hover:text-navy print:hidden">
            {m.link.label}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function Exports() {
  const { answers, shareUrl } = usePlanner();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    track("Share", { what: "relocate-plan" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  }

  return (
    <div role="group" aria-label={EXPORTS.label} className="grid shrink-0 grid-cols-2 gap-2 print:hidden sm:flex sm:flex-wrap lg:flex-nowrap">
      <a href={icsPath(answers)} download="move-plan.ics" className="btn btn-navy col-span-2" onClick={() => track("Calendar feed", { kind: "relocate" })}>
        {EXPORTS.calendar}
      </a>
      <button type="button" className="btn btn-outline" onClick={() => window.print()}>
        {EXPORTS.print}
      </button>
      <button type="button" className="btn btn-outline sm:min-w-[132px]" onClick={copy}>
        <span aria-live="polite">{copied ? EXPORTS.copied : EXPORTS.copy}</span>
      </button>
    </div>
  );
}

/** The answers, as chips under the plan's title. Each one reopens its question. */
function AnswerChips() {
  const { answers, plan, editAt } = usePlanner();
  const chips: [number, string][] = [
    [0, `Move in ${formatDate(answers.moveInDate)}`],
    [1, answers.path === "buying" ? `${Q.path.options.buying}, ${Q.financing.options[answers.financing].toLowerCase()}` : Q.path.options[answers.path]],
    [2, answers.homeToSell === "no" ? "No home to sell" : answers.homeToSell === "listed" ? "Home already listed" : "Home to sell"],
    [3, answers.fromState === "other" ? "From outside the US" : `From ${STATES[answers.fromState as keyof typeof STATES] ?? answers.fromState}`],
    [4, plan.counties.map((c) => c.name).join(" or ")],
  ];
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Your answers">
      {chips.map(([i, c]) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => editAt(i)}
            aria-label={`${c}. Change this answer`}
            className="group inline-flex min-h-9 items-center gap-2 border border-hairline bg-white px-3 py-1 text-[13px] text-graphite-700 transition-colors hover:border-navy hover:bg-linen-100 hover:text-navy focus-visible:border-navy focus-visible:bg-linen-100 focus-visible:text-navy print:border-0 print:p-0"
          >
            {c}
            {/* The edit pencil: always there, and it steps forward on hover and focus, like the site's row arrow. */}
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="text-graphite-400 transition-[color,transform] duration-(--dur-panel) ease-(--ease-brand) group-hover:translate-x-0.5 group-hover:text-sky-700 group-focus-visible:translate-x-0.5 group-focus-visible:text-sky-700 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0 print:hidden"
            >
              <path d="M8.5 1.5 10.5 3.5 4 10H2V8Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The plan. The title, the answers and the ways to keep it come first; then
 * the five dates everything else hangs on, any warnings, and the timeline,
 * one colour per phase, each step's reasoning folded under it. Documents and
 * who pays what close it, and the sources fold at the foot.
 */
export function PlanView() {
  const { plan, mode, generic, answers, shareUrl, editAt, today } = usePlanner();
  if (mode !== "plan") return null;
  const grouped = PHASES.map((p) => ({ phase: p, items: plan.milestones.filter((m) => m.phase === p) })).filter((g) => g.items.length);
  const keyDates = KEY_IDS.map((id) => plan.milestones.find((m) => m.id === id)).filter((m): m is Milestone => Boolean(m?.date));
  /* A plan that doesn't fit says so before the dates; the rest of the callouts follow them. */
  const urgent = plan.callouts.filter((c) => c.id === "past");
  const callouts = plan.callouts.filter((c) => c.id !== "past");

  return (
    <section id="plan" className="scroll-mt-header bg-linen-50 print:bg-white" aria-labelledby="plan-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <div className="flex flex-col gap-6 border-b border-hairline pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4">
            <h2 id="plan-title" className="t-display text-navy">
              {generic ? C.genericTitle : C.title}
            </h2>
            <p className="t-body max-w-[560px] text-body print:hidden">{C.intro}</p>
            <p className="t-small max-w-[560px] border-l-2 border-atlas pl-3 text-graphite-600">{C.estimate}</p>
            <AnswerChips />
            <button type="button" className="link-rule self-start print:hidden" onClick={() => editAt(0)}>
              {Q.editAnswers}
            </button>
          </div>
          <Exports />
        </div>

        <p className="hidden text-[9pt] text-graphite-600 print:block">{shareUrl}</p>

        {urgent.length ? (
          <ul className="grid gap-3">
            {urgent.map((c) => (
              <CalloutCard key={c.id} c={c} />
            ))}
          </ul>
        ) : null}

        <KeyDates items={keyDates} today={today} />

        {callouts.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {callouts.map((c) => (
              <CalloutCard key={c.id} c={c} />
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-12">
          {grouped.map((g) => (
            <div key={g.phase} data-print="phase" className="flex flex-col gap-6" aria-labelledby={`phase-${g.phase}`}>
              <div className="flex items-center gap-3">
                <span className={cn("h-2.5 w-2.5 rounded-full", TONE[g.phase].dot)} aria-hidden="true" />
                <h3 id={`phase-${g.phase}`} className={cn("t-h2", TONE[g.phase].text)}>
                  {PHASE_LABEL[g.phase].title}
                </h3>
                <span className="t-small text-graphite-500">
                  {g.items.length} {g.items.length === 1 ? "step" : "steps"}
                </span>
              </div>
              <ol className="flex flex-col">
                {g.items.map((m, i) => (
                  <Step key={m.id} m={m} phase={g.phase} lastInPhase={i === g.items.length - 1} />
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8">
            <h3 className="t-h2 text-navy">{C.documents.title}</h3>
            <ul className="flex flex-col gap-3">
              {plan.documents.map((d) => (
                <li key={d} className="t-body flex gap-3 text-body">
                  <span className="mt-[0.3em] h-4 w-4 shrink-0 border border-rule" aria-hidden="true" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8">
            <h3 className="t-h2 text-navy">
              {C.county.titlePrefix} {plan.counties.map((c) => c.name).join(" and ")}
            </h3>
            {plan.counties.map((c) => (
              <div key={c.key} className="flex flex-col gap-2">
                <p className="t-body text-body">{C.countyBody(c.name, c.titleCustom)}</p>
                <p className="t-small flex flex-wrap gap-x-4 gap-y-1 text-graphite-500 print:hidden">
                  <ExternalLink href={c.clerk.url} className="underline underline-offset-4 hover:text-navy">
                    {c.clerk.label}
                  </ExternalLink>
                  <ExternalLink href={c.pao.url} className="underline underline-offset-4 hover:text-navy">
                    {c.pao.label}
                  </ExternalLink>
                </p>
              </div>
            ))}
            {answers.county === "both" ? <p className="t-small text-graphite-600">{C.countyBoth}</p> : null}
            <p className="t-small text-graphite-600 print:hidden">{C.docStamps}</p>
          </div>
        </div>

        <details className="group border-t border-hairline pt-4 print:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-2 [&::-webkit-details-marker]:hidden">
            <span className="t-h4 text-navy">{C.sources.title}</span>
            <span className="t-small text-graphite-500">
              {C.sources.checked} {formatDate(SOURCES_CHECKED, "long")}
            </span>
          </summary>
          <ul className="flex flex-col gap-2 pt-4">
            {SOURCE_LIST.map((s) => (
              <li key={s.id} className="t-small text-graphite-600">
                <ExternalLink href={s.url} className="underline underline-offset-4 hover:text-navy">
                  {s.label}
                </ExternalLink>
                {s.note ? <span className="text-graphite-500"> · {s.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

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

const PHASES: Phase[] = ["before", "contract", "closing", "after"];

/** Each phase keeps one colour through the key dates and the timeline. */
const TONE: Record<Phase, { dot: string; line: string; text: string; soft: string }> = {
  before: { dot: "bg-sky-600", line: "bg-sky-300", text: "text-sky-700", soft: "bg-sky-50" },
  contract: { dot: "bg-navy", line: "bg-harbor-300", text: "text-navy", soft: "bg-harbor-50" },
  closing: { dot: "bg-coral", line: "bg-coral/40", text: "text-[#b4523c]", soft: "bg-[#fbefe9]" },
  after: { dot: "bg-success", line: "bg-success/35", text: "text-success", soft: "bg-[#eef5f1]" },
};

/** The dates a person plans the rest around, in the order they happen. */
const KEY_IDS = ["effective", "inspection", "closing", "move-in", "homestead"] as const;

function Flag({ flag }: { flag: Milestone["flags"][number] }) {
  const tone =
    flag === "hurricaneSeason" || flag === "forceMajeure"
      ? "border-warning/50 bg-[#fbf4e6] text-warning"
      : flag === "nfip30"
        ? "border-sky-300 bg-sky-50 text-sky-800"
        : "border-hairline bg-linen-50 text-graphite-600";
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-[12px]", tone)}>{C.flags[flag]}</span>;
}

function dayParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rest: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric" }),
  };
}

function KeyDates({ items }: { items: Milestone[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col gap-4">
      <h3 className="t-h3 text-navy">{C.keyDates}</h3>
      <ol data-print="keys" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((m) => {
          const p = dayParts(m.date!);
          return (
            <li key={m.id} data-print="key" className={cn("relative flex flex-col gap-2 overflow-hidden border border-hairline bg-white p-5", TONE[m.phase].soft)}>
              <span className={cn("absolute inset-x-0 top-0 h-1", TONE[m.phase].dot)} aria-hidden="true" />
              <span className="font-display text-[2rem] font-light leading-none text-navy">{p.day}</span>
              <span className="t-small text-graphite-500">{p.rest}</span>
              <span className="t-body font-medium text-navy">{m.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CalloutCard({ c }: { c: Callout }) {
  return (
    <li data-print="callout" className="flex flex-col gap-2 border-l-[3px] border-warning bg-[#fbf4e6] p-5">
      <h4 className="t-h4 text-navy">{c.title}</h4>
      <p className="t-body text-body">{c.body}</p>
      <a href={c.source.url} target="_blank" rel="noopener noreferrer" className="t-small self-start text-graphite-600 underline underline-offset-4 hover:text-navy print:hidden">
        {C.sourceLabel}: {c.source.label}
      </a>
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
              <a href={m.source.url} target="_blank" rel="noopener noreferrer" className="self-start underline underline-offset-4 hover:text-navy">
                {C.sourceLabel}: {m.source.label}
              </a>
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
    track("Share", { kind: "relocate" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  }

  return (
    <div role="group" aria-label={EXPORTS.label} className="flex shrink-0 flex-wrap gap-2 print:hidden lg:flex-nowrap">
      <a href={icsPath(answers)} download="move-plan.ics" className="btn btn-navy" onClick={() => track("Calendar feed", { kind: "relocate" })}>
        {EXPORTS.calendar}
      </a>
      <button type="button" className="btn btn-outline" onClick={() => window.print()}>
        {EXPORTS.print}
      </button>
      <button type="button" className="btn btn-outline min-w-[132px]" onClick={copy}>
        <span aria-live="polite">{copied ? EXPORTS.copied : EXPORTS.copy}</span>
      </button>
    </div>
  );
}

/** The answers, as a line of chips under the plan's title. */
function AnswerChips() {
  const { answers, plan } = usePlanner();
  const buying = answers.path !== "renting-first";
  const chips = [
    `Move in ${formatDate(answers.moveInDate)}`,
    Q.path.options[answers.path],
    buying ? Q.financing.options[answers.financing] : null,
    answers.homeToSell === "no" ? "No home to sell" : answers.homeToSell === "listed" ? "Home already listed" : "Home to sell",
    answers.fromState === "other" ? "From outside the US" : `From ${STATES[answers.fromState as keyof typeof STATES] ?? answers.fromState}`,
    plan.counties.map((c) => c.name).join(" or "),
  ].filter(Boolean) as string[];
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Your answers">
      {chips.map((c) => (
        <li key={c} className="rounded-full border border-hairline bg-white px-3 py-1 text-[13px] text-graphite-700">
          {c}
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
  const { plan, mode, generic, answers, shareUrl, setMode } = usePlanner();
  if (mode !== "plan") return null;
  const grouped = PHASES.map((p) => ({ phase: p, items: plan.milestones.filter((m) => m.phase === p) })).filter((g) => g.items.length);
  const keyDates = KEY_IDS.map((id) => plan.milestones.find((m) => m.id === id)).filter((m): m is Milestone => Boolean(m?.date));

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
            <button
              type="button"
              className="link-rule self-start print:hidden"
              onClick={() => {
                setMode("questions");
                requestAnimationFrame(() => document.getElementById("questions")?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
            >
              {Q.editAnswers}
            </button>
          </div>
          <Exports />
        </div>

        <p className="hidden text-[9pt] text-graphite-600 print:block">{shareUrl}</p>

        <KeyDates items={keyDates} />

        {plan.callouts.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {plan.callouts.map((c) => (
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
                  <a href={c.clerk.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
                    {c.clerk.label}
                  </a>
                  <a href={c.pao.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
                    {c.pao.label}
                  </a>
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
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
                  {s.label}
                </a>
                {s.note ? <span className="text-graphite-500"> · {s.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

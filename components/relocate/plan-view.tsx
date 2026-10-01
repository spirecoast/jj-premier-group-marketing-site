"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { track } from "@/lib/analytics";
import { EXPORTS, PLAN as C } from "@/lib/relocate/copy";
import { PHASE_LABEL, formatDate, type Callout, type Milestone, type Phase } from "@/lib/relocate/plan";
import { SOURCES_CHECKED, SOURCE_LIST } from "@/lib/relocate/sources";
import { icsPath } from "@/lib/relocate/url";
import { cn } from "@/lib/utils";
import { usePlanner } from "./planner-context";

const PHASES: Phase[] = ["before", "contract", "closing", "after"];

function Flag({ flag }: { flag: Milestone["flags"][number] }) {
  const tone =
    flag === "hurricaneSeason" || flag === "forceMajeure"
      ? "border-amber text-amber"
      : flag === "nfip30"
        ? "border-sky-700 text-sky-700"
        : flag === "askUs"
          ? "border-graphite-400 text-graphite-600"
          : "border-navy text-navy";
  return <span className={cn("t-mono-sm border px-1.5 py-0.5", tone)}>{C.flags[flag]}</span>;
}

/** A source that several rows in one phase share is shown once under the phase; the rows carry a mark. */
function sharedSource(items: Milestone[]) {
  const counts = new Map<string, number>();
  for (const m of items) if (m.source) counts.set(m.source.id, (counts.get(m.source.id) ?? 0) + 1);
  const id = [...counts.entries()].find(([, n]) => n >= 2)?.[0];
  return id ? items.find((m) => m.source?.id === id)!.source! : undefined;
}

function Row({ m, footnote }: { m: Milestone; footnote?: string }) {
  return (
    <li data-print="row" className="grid gap-2 border-t border-hairline py-5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
      <div data-print="when" className="flex flex-col gap-1">
        <span className="t-record text-navy">{m.date ? formatDate(m.date) : C.undated}</span>
        {m.dateRange && m.dateRange.start !== m.dateRange.end ? (
          <span className="t-mono-sm text-graphite-500 print:hidden">
            {C.rangePrefix} {formatDate(m.dateRange.start)} to {formatDate(m.dateRange.end)}
          </span>
        ) : null}
      </div>
      <div data-print="what" className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 data-print="title" className="t-h4 text-navy">
            {m.title}
            {footnote && m.source?.id === footnote ? (
              <a href={`#source-${footnote}`} className="ml-1 align-super text-[0.6em] text-graphite-500 no-underline" aria-label={`${C.sourceLabel}: ${m.source.label}`}>
                †
              </a>
            ) : null}
          </h4>
          {m.flags.map((f) => (
            <Flag key={f} flag={f} />
          ))}
        </div>
        <p className="t-body max-w-measure text-body print:hidden">{m.body}</p>
        <p data-print="basis" className="t-small max-w-measure text-graphite-600">
          <span className="font-semibold">{C.basisLabel}:</span> {m.basis}
        </p>
        <p data-print="source" className="t-small flex flex-wrap gap-x-4 gap-y-1 text-graphite-500">
          {m.source && m.source.id === footnote ? null : m.source ? (
            <a href={m.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
              {C.sourceLabel}: {m.source.label}
            </a>
          ) : (
            <span>{m.flags.includes("askUs") ? C.askUs : C.ourRule}</span>
          )}
          {m.link ? (
            <Link href={m.link.href as Route} className="underline underline-offset-4 hover:text-navy print:hidden">
              {m.link.label}
            </Link>
          ) : null}
        </p>
      </div>
    </li>
  );
}

function CalloutCard({ c }: { c: Callout }) {
  return (
    <li data-print="callout" className="flex flex-col gap-2 border border-hairline bg-linen-100 p-5">
      <h4 data-print="title" className="t-h4 text-navy">{c.title}</h4>
      <p data-print="body" className="t-body text-body">{c.body}</p>
      <a data-print="source" href={c.source.url} target="_blank" rel="noopener noreferrer" className="t-small text-graphite-500 underline underline-offset-4 hover:text-navy">
        {C.sourceLabel}: {c.source.label}
      </a>
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
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", shareUrl);
    }
  }

  return (
    <div className="flex flex-col gap-6 border border-hairline bg-white p-6 print:hidden sm:p-8" aria-label={EXPORTS.eyebrow}>
      <p className="t-eyebrow text-amber">{EXPORTS.eyebrow}</p>
      <ul className="grid gap-6 sm:grid-cols-3">
        <li className="flex flex-col gap-2">
          <a href={icsPath(answers)} download className="btn btn-navy" onClick={() => track("Calendar feed", { kind: "relocate" })}>
            {EXPORTS.calendar}
          </a>
          <span className="t-small text-graphite-500">{EXPORTS.calendarHint}</span>
        </li>
        <li className="flex flex-col gap-2">
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            {EXPORTS.print}
          </button>
          <span className="t-small text-graphite-500">{EXPORTS.printHint}</span>
        </li>
        <li className="flex flex-col gap-2">
          <button type="button" className="btn btn-outline" onClick={copy} aria-live="polite">
            {copied ? EXPORTS.copied : EXPORTS.copy}
          </button>
          <span className="t-small text-graphite-500">{EXPORTS.copyHint}</span>
        </li>
      </ul>
    </div>
  );
}

/**
 * 03 and 04 · The plan and its exports. Grouped by phase, every row carrying
 * its date, the rule behind it and a source link. Callouts are the plan's
 * plain-language warnings. The print stylesheet in the page strips the
 * bodies and keeps dates, titles and bases on one sheet.
 */
export function PlanView() {
  const { plan, mode, generic, answers, shareUrl } = usePlanner();
  if (mode !== "plan") return null;
  const grouped = PHASES.map((p) => {
    const items = plan.milestones.filter((m) => m.phase === p);
    return { phase: p, items, shared: sharedSource(items) };
  }).filter((g) => g.items.length);

  return (
    <section id="plan" className="container-site flex scroll-mt-header flex-col gap-10 pb-section" aria-labelledby="plan-title">
      <SectionHeading
        eyebrow={C.eyebrow}
        title={<span id="plan-title">{generic ? C.genericTitle : C.title}</span>}
        aside={<p className="t-body max-w-[380px] text-body-muted print:hidden">{C.intro}</p>}
      />

      {/* Print header: the answers in one line. */}
      <p data-print="summary" className="hidden print:block text-graphite-600">
        {plan.summary.split("\n")[1]} · {shareUrl}
      </p>

      {plan.callouts.length ? (
        <ul data-print="callouts" className="grid gap-4 md:grid-cols-2">
          {plan.callouts.map((c) => (
            <CalloutCard key={c.id} c={c} />
          ))}
        </ul>
      ) : null}

      <div data-print="phases" className="flex flex-col gap-12">
        {grouped.map((g) => (
          <div key={g.phase} data-print="phase" className="flex flex-col gap-4" aria-labelledby={`phase-${g.phase}`}>
            <div className="flex flex-col gap-1">
              <p className="t-eyebrow text-amber print:hidden">{PHASE_LABEL[g.phase].eyebrow}</p>
              <h3 id={`phase-${g.phase}`} data-print="phase-title" className="t-h2 text-navy">
                {PHASE_LABEL[g.phase].title}
              </h3>
            </div>
            <ol className="border-b border-hairline">
              {g.items.map((m) => (
                <Row key={m.id} m={m} footnote={g.shared?.id} />
              ))}
            </ol>
            {g.shared ? (
              <p id={`source-${g.shared.id}`} data-print="source" className="t-small text-graphite-500">
                † {C.sourceLabel}:{" "}
                <a href={g.shared.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-navy">
                  {g.shared.label}
                </a>
                {g.shared.note ? <span> · {g.shared.note}</span> : null}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div data-print="foot" className="grid gap-10 border-t border-rule pt-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-4">
          <p className="t-eyebrow text-amber">{C.documents.eyebrow}</p>
          <h3 className="t-h2 text-navy">{C.documents.title}</h3>
          <ul className="flex flex-col gap-2 print:gap-1">
            {plan.documents.map((d) => (
              <li key={d} data-print="body" className="t-body flex gap-3 text-body">
                <span className="mt-[0.8em] h-px w-4 shrink-0 bg-amber" aria-hidden="true" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <p className="t-eyebrow text-amber">{C.county.eyebrow}</p>
          <h3 className="t-h2 text-navy">
            {C.county.titlePrefix} {plan.counties.map((c) => c.name).join(" and ")}
          </h3>
          {plan.counties.map((c) => (
            <div key={c.key} className="flex flex-col gap-2">
              <p data-print="body" className="t-body text-body">{C.countyBody(c.name, c.titleCustom)}</p>
              <p className="t-small flex flex-wrap gap-x-4 gap-y-1 text-graphite-500">
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
          <p className="t-small text-graphite-600">{C.docStamps}</p>
        </div>
      </div>

      <Exports />

      <details className="group border-t border-hairline pt-4 print:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-2 [&::-webkit-details-marker]:hidden">
          <span className="t-eyebrow text-amber">{C.sources.eyebrow}</span>
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
    </section>
  );
}

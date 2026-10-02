"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Q_COPY } from "@/lib/questionnaire/copy";
import {
  MAX_VALUE_LENGTH,
  canAnswer,
  hasContent,
  hasText,
  numberQuestions,
  optionsFor,
  questionLine,
  sectionsFor,
  type Respondent,
} from "@/lib/questionnaire/model";
import type { Question } from "@/lib/questionnaire/questions";
import type { DbState } from "@/lib/questionnaire/store";
import type { SaveInput } from "@/lib/questionnaire/validate";

/**
 * One person's questionnaire. Every change is written to this browser's
 * localStorage at once and sent to the server ~900ms after typing stops; the
 * local copy is cleared only once the server has confirmed that exact version.
 * With no database (or a failed save) answers stay local and go up the next
 * time the link is opened with a working database. Typed text is never dropped.
 */

export type Entry = { value: string; choice: string | null; updatedAt: string };
export type InitialAnswers = Record<string, Entry>;
type SaveResult = { ok: true } | { ok: false; reason: "invalid" | "missing" | "error" };
type Status = "idle" | "saving" | "saved" | "failed" | "local";

const DEBOUNCE_MS = 900;
const EMPTY: Entry = { value: "", choice: null, updatedAt: "" };

const storageKey = (r: Respondent) => `jj-questionnaire:v1:${r}`;

function readLocal(r: Respondent): Record<string, Entry> {
  try {
    const raw = window.localStorage.getItem(storageKey(r));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, Entry> = {};
    for (const [qid, e] of Object.entries(parsed as Record<string, Partial<Entry>>)) {
      if (e && typeof e.value === "string" && typeof e.updatedAt === "string") {
        out[qid] = { value: e.value, choice: typeof e.choice === "string" ? e.choice : null, updatedAt: e.updatedAt };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeLocal(r: Respondent, data: Record<string, Entry>) {
  try {
    if (Object.keys(data).length) window.localStorage.setItem(storageKey(r), JSON.stringify(data));
    else window.localStorage.removeItem(storageKey(r));
  } catch {
    // Storage blocked (private mode): the answer is still on screen and still sent.
  }
}

export function QuestionnaireForm({
  token,
  respondent,
  db,
  initial,
  save,
}: {
  token: string;
  respondent: Respondent;
  db: DbState;
  initial: InitialAnswers;
  save: (input: SaveInput) => Promise<SaveResult>;
}) {
  const sections = useMemo(() => sectionsFor(respondent), [respondent]);
  const numbered = useMemo(() => numberQuestions(sections), [sections]);
  const numOf = useMemo(() => new Map(numbered.map((n) => [n.question.id, n.num])), [numbered]);

  const [answers, setAnswers] = useState<InitialAnswers>(initial);
  const [mode, setMode] = useState<"db" | "local">(db === "missing" ? "local" : "db");
  const [dbProblem, setDbProblem] = useState(db === "error");
  const [status, setStatus] = useState<Status>(db === "missing" ? "local" : "idle");
  const [view, setView] = useState<"form" | "readback">("form");
  const [active, setActive] = useState(sections[0]?.id ?? "");

  const answersRef = useRef<InitialAnswers>(initial);
  const pending = useRef<Record<string, Entry>>({});
  const modeRef = useRef(mode);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const again = useRef(false);

  const goLocal = useCallback(() => {
    modeRef.current = "local";
    setMode("local");
    setStatus("local");
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (modeRef.current === "local") {
      setStatus("local");
      return;
    }
    if (inflight.current) {
      again.current = true;
      return;
    }
    const batch = Object.entries(pending.current)
      .slice(0, 200)
      .map(([questionId, e]) => ({ questionId, value: e.value, choice: e.choice, updatedAt: e.updatedAt }));
    if (!batch.length) {
      setStatus((s) => (s === "saving" ? "saved" : s));
      return;
    }
    inflight.current = true;
    setStatus("saving");
    let result: SaveResult;
    try {
      result = await save({ token, entries: batch });
    } catch {
      result = { ok: false, reason: "error" };
    }
    inflight.current = false;
    if (result.ok) {
      for (const b of batch) {
        if (pending.current[b.questionId]?.updatedAt === b.updatedAt) delete pending.current[b.questionId];
      }
      writeLocal(respondent, pending.current);
      setDbProblem(false);
      setStatus(Object.keys(pending.current).length ? "saving" : "saved");
    } else if (result.reason === "missing") {
      goLocal();
    } else {
      setStatus("failed");
    }
    if (again.current) {
      again.current = false;
      void flush();
    }
  }, [goLocal, respondent, save, token]);

  // On first load: anything this browser kept that's newer than the server copy wins, and is sent up.
  useEffect(() => {
    const local = readLocal(respondent);
    const merged: InitialAnswers = { ...answersRef.current };
    const keep: Record<string, Entry> = {};
    for (const [qid, e] of Object.entries(local)) {
      if (!canAnswer(respondent, qid)) continue;
      const server = answersRef.current[qid];
      if (!server || e.updatedAt > server.updatedAt) {
        merged[qid] = e;
        keep[qid] = e;
      }
    }
    pending.current = keep;
    writeLocal(respondent, keep);
    answersRef.current = merged;
    setAnswers(merged);
    if (Object.keys(keep).length && modeRef.current === "db") void flush();
  }, [flush, respondent]);

  // Leaving the page: send what's waiting (it's already in localStorage either way).
  useEffect(() => {
    const onHide = () => {
      if (timer.current) void flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  // Highlight the section in view in the index.
  useEffect(() => {
    if (view !== "form" || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) setActive(en.target.id.replace(/^sec-/, ""));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections, view]);

  const edit = useCallback(
    (qid: string, patch: Partial<Pick<Entry, "value" | "choice">>) => {
      const cur = answersRef.current[qid] ?? EMPTY;
      const next: Entry = { ...cur, ...patch, updatedAt: new Date().toISOString() };
      answersRef.current = { ...answersRef.current, [qid]: next };
      setAnswers(answersRef.current);
      pending.current[qid] = next;
      writeLocal(respondent, pending.current);
      if (modeRef.current === "local") {
        setStatus("local");
        return;
      }
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush, respondent],
  );

  const counts = useMemo(() => {
    const per: Record<string, number> = {};
    let total = 0;
    for (const s of sections) {
      per[s.id] = s.qs.filter((q) => hasContent(answers[q.id])).length;
      total += per[s.id];
    }
    return { per, total };
  }, [answers, sections]);
  const totalQs = numbered.length;
  const pct = totalQs ? Math.round((100 * counts.total) / totalQs) : 0;

  const statusText =
    status === "idle" ? "" : status === "local" ? Q_COPY.status.local : Q_COPY.status[status];

  const toggleView = () => {
    if (timer.current) void flush();
    setView((v) => (v === "form" ? "readback" : "form"));
    window.scrollTo(0, 0);
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-navy text-linen-100 print:hidden" aria-label="Progress and save status">
        <div className="mx-auto flex max-w-[70rem] flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 lg:px-6">
          {/* Phones: title and button on one line, progress and status under them. */}
          <span className="order-1 mr-auto font-display text-[1.1875rem] leading-tight">
            {Q_COPY.barName}
          </span>
          <span className="order-3 flex items-center gap-2.5 t-small tabular-nums sm:order-2">
            <span className="block h-1 w-[72px] overflow-hidden bg-linen-100/20" aria-hidden="true">
              <i className="block h-full bg-linen-100 transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </span>
            <span>{Q_COPY.answered(counts.total, totalQs)}</span>
          </span>
          <span className="order-4 flex min-w-[4.5em] items-center gap-1.5 t-small text-nav-link sm:order-3" role="status" aria-live="polite">
            {status === "failed" ? <span className="inline-block size-2 shrink-0 rounded-full bg-coral" aria-hidden="true" /> : null}
            {statusText}
          </span>
          <button
            type="button"
            onClick={toggleView}
            aria-pressed={view === "readback"}
            className="order-2 min-h-11 border border-linen-100/45 px-3.5 t-label text-linen-100 hover:bg-linen-100/10 aria-pressed:bg-linen-100 aria-pressed:text-navy sm:order-4"
          >
            {view === "readback" ? Q_COPY.backToForm : Q_COPY.readBack}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[70rem] px-4 pb-24 pt-8 lg:grid lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-14 lg:px-6">
        <nav
          aria-label={Q_COPY.sectionsLabel}
          className={cn("hidden self-start print:hidden lg:sticky lg:top-[5.5rem]", view === "form" && "lg:block")}
        >
          <p className="t-eyebrow mb-2.5 text-graphite-500">{Q_COPY.sectionsLabel}</p>
          <SectionList sections={sections} counts={counts.per} active={active} />
        </nav>

        <main className="grid min-w-0 max-w-[43.75rem] gap-14">
          {view === "form" ? (
            <div className="grid gap-14 print:hidden">
              <section className="grid gap-4" aria-labelledby="q-intro">
                <p className="t-eyebrow text-amber">{Q_COPY.eyebrow}</p>
                <h1 id="q-intro" className="t-h1 text-balance text-navy">
                  {Q_COPY.heading(respondent)}
                </h1>
                <p className="t-lead max-w-[34em]">{Q_COPY.lede}</p>
                <p className="t-body max-w-[38em]">{Q_COPY.how}</p>
                <p className="t-body max-w-[38em]">{Q_COPY.ownLink(respondent)}</p>
                {mode === "local" || dbProblem ? (
                  <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="note">
                    {mode === "local" ? Q_COPY.bannerMissing : Q_COPY.bannerError}
                  </p>
                ) : null}
                <details className="border border-hairline bg-white lg:hidden">
                  <summary className="flex min-h-12 cursor-pointer items-center px-4 t-label text-navy">
                    {Q_COPY.sectionsLabel}
                  </summary>
                  <div className="px-2 pb-3">
                    <SectionList sections={sections} counts={counts.per} active={active} />
                  </div>
                </details>
              </section>

              {sections.map((s, si) => (
                <section key={s.id} id={`sec-${s.id}`} className="grid scroll-mt-24 gap-5" aria-labelledby={`sec-${s.id}-t`}>
                  <div className="grid gap-2 border-t-2 border-navy pt-3.5">
                    <p className="t-eyebrow tabular-nums text-amber">{Q_COPY.partOf(si + 1, sections.length)}</p>
                    <h2 id={`sec-${s.id}-t`} className="t-h2 text-balance text-navy">
                      {s.title}
                    </h2>
                    {s.intro ? <p className="t-body max-w-[38em]">{s.intro}</p> : null}
                  </div>
                  {s.says ? <Says label={s.says.label} text={s.says.text} /> : null}
                  {s.qs.map((q) => (
                    <QuestionCard key={q.id} q={q} num={numOf.get(q.id) ?? 0} entry={answers[q.id]} onEdit={edit} onBlur={flush} />
                  ))}
                </section>
              ))}
            </div>
          ) : null}

          <ReadBack
            sections={sections}
            numOf={numOf}
            answers={answers}
            className={view === "readback" ? "grid" : "hidden print:grid"}
          />

          <p className="border-t border-hairline pt-4 t-small text-body-muted print:hidden">{Q_COPY.foot}</p>
        </main>
      </div>
    </>
  );
}

function SectionList({
  sections,
  counts,
  active,
}: {
  sections: ReturnType<typeof sectionsFor>;
  counts: Record<string, number>;
  active: string;
}) {
  return (
    <ol className="m-0 grid list-none gap-0.5 p-0">
      {sections.map((s, i) => {
        const done = counts[s.id] === s.qs.length;
        return (
          <li key={s.id}>
            <a
              href={`#sec-${s.id}`}
              className={cn(
                "grid min-h-11 grid-cols-[1.6em_1fr_auto] items-center gap-1.5 px-2 py-1.5 text-[0.9375rem] leading-snug text-body no-underline hover:bg-harbor-50",
                active === s.id && "bg-harbor-100 font-semibold text-navy",
              )}
            >
              <span className="tabular-nums text-graphite-500">{i + 1}</span>
              <span>{s.nav}</span>
              <span className={cn("text-xs tabular-nums", done ? "text-success" : "text-graphite-500")}>
                {counts[s.id] ?? 0}/{s.qs.length}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function Says({ label, text }: { label: string; text: string[] }) {
  return (
    <figure className="m-0 grid gap-2 bg-parchment px-4 py-3.5">
      <span className="t-mono-sm text-linen-700">{label}</span>
      {text.map((t, i) => (
        <p key={i} className="m-0 font-display text-[1.0625rem] leading-normal text-body">
          {t}
        </p>
      ))}
    </figure>
  );
}

const inputClass =
  "w-full border border-hairline bg-paper px-3 py-2.5 text-base leading-normal text-ink focus:border-navy focus:outline-2 focus:outline-offset-0 focus:outline-sky-700/40";

function QuestionCard({
  q,
  num,
  entry,
  onEdit,
  onBlur,
}: {
  q: Question;
  num: number;
  entry: Entry | undefined;
  onEdit: (qid: string, patch: Partial<Pick<Entry, "value" | "choice">>) => void;
  onBlur: () => void;
}) {
  const fid = `f-${q.id}`;
  const e = entry ?? EMPTY;
  const options = optionsFor(q);
  const answered = hasContent(e);

  let label: string | null = null;
  if (q.type === "promise") label = Q_COPY.promiseNote;
  else if (q.type === "faq") label = Q_COPY.faqNote;
  else if (q.type === "choice" && q.note) label = Q_COPY.optional(q.note);

  return (
    <article id={`q-${q.id}`} className="grid min-w-0 scroll-mt-24 gap-3 border border-hairline bg-white p-[18px]">
      <div className="grid grid-cols-[2.4em_minmax(0,1fr)] items-baseline gap-1">
        <span className={cn("font-display text-[1.1875rem] tabular-nums", answered ? "text-success" : "text-graphite-500")}>
          {num}
        </span>
        <h3 id={`${fid}-q`} className="m-0 font-display text-[1.1875rem] font-medium leading-[1.35] text-navy">
          {q.tag ? <span className="mb-0.5 block t-mono-sm font-normal text-linen-700">{q.tag}</span> : null}
          {questionLine(q)}
        </h3>
      </div>
      <div className="grid min-w-0 gap-2.5 sm:ml-[2.65em]">
        {q.hint ? <p className="m-0 t-small text-body-muted">{q.hint}</p> : null}
        {q.type === "promise" ? <Says label={Q_COPY.promiseSays} text={[q.body]} /> : null}
        {q.type === "faq" ? <Says label={Q_COPY.faqSays} text={[q.current]} /> : null}
        {options ? (
          <fieldset className="m-0 min-w-0 border-0 p-0" aria-labelledby={q.type === "promise" ? undefined : `${fid}-q`}>
            {q.type === "promise" ? <legend className="mb-1.5 p-0 t-small text-body-muted">{Q_COPY.promiseLegend}</legend> : null}
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const checked = e.choice === o;
                return (
                  <label key={o} className="relative">
                    <input
                      type="radio"
                      name={fid}
                      value={o}
                      checked={checked}
                      // Tapping the picked option again clears it.
                      onClick={() => onEdit(q.id, { choice: checked ? null : o })}
                      onChange={() => {}}
                      className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                    />
                    <span className="inline-flex min-h-11 items-center border border-hairline bg-paper px-4 text-[0.9375rem] font-semibold text-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-linen-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-700">
                      {o}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {hasText(q) ? (
          <>
            {label ? (
              <label htmlFor={fid} className="t-small text-body-muted">
                {label}
              </label>
            ) : null}
            {q.type === "short" || q.type === "url" || q.type === "email" ? (
              <input
                id={fid}
                type={q.type === "short" ? "text" : q.type}
                inputMode={q.type === "url" ? "url" : q.type === "email" ? "email" : undefined}
                autoComplete="off"
                aria-labelledby={label ? undefined : `${fid}-q`}
                maxLength={MAX_VALUE_LENGTH}
                value={e.value}
                onChange={(ev) => onEdit(q.id, { value: ev.target.value })}
                onBlur={onBlur}
                className={cn(inputClass, "min-h-12")}
              />
            ) : (
              <AutoTextarea
                id={fid}
                labelledBy={label ? undefined : `${fid}-q`}
                value={e.value}
                onChange={(v) => onEdit(q.id, { value: v })}
                onBlur={onBlur}
              />
            )}
          </>
        ) : null}
      </div>
    </article>
  );
}

function AutoTextarea({
  id,
  labelledBy,
  value,
  onChange,
  onBlur,
}: {
  id: string;
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Browsers without field-sizing grow the box by hand.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || (typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content"))) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 2, 560)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      id={id}
      rows={3}
      aria-labelledby={labelledBy}
      maxLength={MAX_VALUE_LENGTH}
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
      onBlur={onBlur}
      className={cn(inputClass, "max-h-[24em] min-h-[5.5em] resize-y [field-sizing:content]")}
    />
  );
}

function ReadBack({
  sections,
  numOf,
  answers,
  className,
}: {
  sections: ReturnType<typeof sectionsFor>;
  numOf: Map<string, number>;
  answers: InitialAnswers;
  className: string;
}) {
  return (
    <div className={cn("gap-10", className)} aria-label={Q_COPY.readBackTitle}>
      <div className="grid gap-3">
        <p className="t-eyebrow text-amber">{Q_COPY.barName}</p>
        <h1 className="t-h1 text-navy">{Q_COPY.readBackTitle}</h1>
        <p className="t-body print:hidden">{Q_COPY.readBackIntro}</p>
      </div>
      {sections.map((s, si) => (
        <section key={s.id} className="grid">
          <h2 className="mb-3 border-t-2 border-navy pt-3 t-h3 text-navy">
            {si + 1}. {s.title}
          </h2>
          {s.qs.map((q) => {
            const e = answers[q.id];
            const text = hasContent(e) ? [e!.choice, e!.value.trim()].filter(Boolean).join(e!.value.trim() && e!.choice ? ". " : "") : "";
            return (
              <div key={q.id} className="grid break-inside-avoid grid-cols-[2.4em_minmax(0,1fr)] gap-1 border-b border-hairline py-2.5">
                <span className="font-display tabular-nums text-graphite-500">{numOf.get(q.id)}</span>
                <div>
                  <h3 className="m-0 mb-1 font-display text-[1.0625rem] font-medium leading-[1.35] text-navy">
                    {q.tag ? `${q.tag}: ` : ""}
                    {questionLine(q)}
                  </h3>
                  {text ? (
                    <p className="m-0 whitespace-pre-wrap t-body [overflow-wrap:anywhere]">{text}</p>
                  ) : (
                    <p className="m-0 italic text-graphite-500">{Q_COPY.noAnswer}</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

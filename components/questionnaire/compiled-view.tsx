import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/questionnaire/compile";
import { ADMIN_COPY, Q_COPY } from "@/lib/questionnaire/copy";
import {
  ALL_QUESTIONS,
  RESPONDENTS,
  RESPONDENT_NAME,
  answerKey,
  answersDiffer,
  hasContent,
  indexAnswers,
  isSharedSection,
  progressFor,
  questionLine,
  sectionRespondents,
  type Answer,
  type Respondent,
} from "@/lib/questionnaire/model";
import { SECTIONS } from "@/lib/questionnaire/questions";
import type { DbState } from "@/lib/questionnaire/store";
import { PrintButton } from "./print-button";

/**
 * The owner's view: both people's answers to every question, side by side
 * (stacked on phones), with progress per person and the two downloads.
 */
export function CompiledView({ token, state, answers }: { token: string; state: DbState; answers: Answer[] }) {
  const index = indexAnswers(answers);
  const nums = new Map(ALL_QUESTIONS.map((n) => [n.question.id, n.num]));
  const exportHref = (format: "md" | "csv") => `/q/${encodeURIComponent(token)}/export?format=${format}`;
  const btn =
    "inline-flex min-h-11 items-center justify-center border px-4 t-label transition-colors";

  return (
    <>
      <header className="bg-navy text-linen-100 print:hidden">
        <div className="mx-auto flex max-w-[60rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 lg:px-6">
          <span className="mr-auto font-display text-[1.1875rem] leading-tight">{Q_COPY.barName}</span>
          {state === "ok" ? (
            <span className="flex flex-wrap gap-2">
              <a href={exportHref("md")} download className={cn(btn, "border-linen-100/45 text-linen-100 hover:bg-linen-100/10")}>
                {ADMIN_COPY.downloadMd}
              </a>
              <a href={exportHref("csv")} download className={cn(btn, "border-linen-100/45 text-linen-100 hover:bg-linen-100/10")}>
                {ADMIN_COPY.downloadCsv}
              </a>
            </span>
          ) : null}
          <PrintButton label={ADMIN_COPY.print} className={cn(btn, "border-linen-100/45 text-linen-100 hover:bg-linen-100/10")} />
        </div>
      </header>

      <main className="mx-auto grid max-w-[60rem] gap-12 px-4 pb-24 pt-8 lg:px-6 print:max-w-none print:px-0 print:pt-0">
        <section className="grid gap-4">
          <p className="t-eyebrow text-amber">{ADMIN_COPY.eyebrow}</p>
          <h1 className="t-h1 text-balance text-navy">{ADMIN_COPY.heading}</h1>
          <p className="t-body max-w-[40em]">{ADMIN_COPY.intro}</p>
          {state !== "ok" ? (
            <p className="border-l-2 border-warning bg-warning-fill px-4 py-3 t-small text-ink" role="note">
              {state === "missing" ? ADMIN_COPY.missing : ADMIN_COPY.error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
            {RESPONDENTS.map((r) => {
              const p = progressFor(r, index);
              const pct = p.total ? Math.round((100 * p.answered) / p.total) : 0;
              return (
                <div key={r} className="grid gap-2 border border-hairline bg-white p-4">
                  <p className="m-0 font-display text-[1.3125rem] text-navy">{RESPONDENT_NAME[r]}</p>
                  <span className="block h-1 overflow-hidden bg-harbor-100" aria-hidden="true">
                    <i className="block h-full bg-navy" style={{ width: `${pct}%` }} />
                  </span>
                  <p className="m-0 t-small tabular-nums">{Q_COPY.answered(p.answered, p.total)}</p>
                  <p className="m-0 t-small text-body-muted">
                    {p.lastUpdated ? ADMIN_COPY.lastUpdated(formatTime(p.lastUpdated)) : ADMIN_COPY.nothingYet}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {SECTIONS.map((s, si) => {
          const who = sectionRespondents(s);
          const shared = isSharedSection(s);
          return (
            <section key={s.id} className="grid gap-4" aria-labelledby={`c-${s.id}`}>
              <div className="grid gap-1 border-t-2 border-navy pt-3 print:break-after-avoid">
                <p className="t-eyebrow tabular-nums text-amber">{Q_COPY.partOf(si + 1, SECTIONS.length)}</p>
                <h2 id={`c-${s.id}`} className="t-h2 text-balance text-navy">
                  {s.title}
                </h2>
              </div>
              {s.qs.map((q) => {
                const pair = who.map((r) => index.get(answerKey(r, q.id)));
                const differ = shared && answersDiffer(pair[0], pair[1]);
                const onSite = q.type === "promise" ? q.body : q.type === "faq" ? q.current : null;
                return (
                  <article key={q.id} className="grid min-w-0 gap-3 border border-hairline bg-white p-4 break-inside-avoid sm:p-[18px]">
                    <div className="grid grid-cols-[2.4em_minmax(0,1fr)] items-baseline gap-1">
                      <span className="font-display text-[1.1875rem] tabular-nums text-graphite-500">{nums.get(q.id)}</span>
                      <h3 className="m-0 font-display text-[1.1875rem] font-medium leading-[1.35] text-navy">
                        {q.tag ? <span className="mb-0.5 block t-mono-sm font-normal text-linen-700">{q.tag}</span> : null}
                        {questionLine(q)}
                      </h3>
                    </div>
                    <div className="grid min-w-0 gap-3 sm:ml-[2.65em]">
                      {onSite ? (
                        <p className="m-0 bg-parchment px-3 py-2 t-small">
                          <span className="t-mono-sm text-linen-700">{ADMIN_COPY.onSiteNow}: </span>
                          {onSite}
                        </p>
                      ) : null}
                      {differ ? (
                        <p className="m-0 flex items-center gap-2 t-mono-sm text-amber">
                          <span className="inline-block size-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                          {ADMIN_COPY.differ}
                        </p>
                      ) : null}
                      <div className={cn("grid gap-3", who.length === 2 && "sm:grid-cols-2 print:grid-cols-2")}>
                        {who.map((r, i) => (
                          <AnswerCell key={r} respondent={r} answer={pair[i]} />
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </main>
    </>
  );
}

function AnswerCell({ respondent, answer }: { respondent: Respondent; answer: Answer | undefined }) {
  const value = (answer?.value ?? "").trim();
  return (
    <div className="grid min-w-0 content-start gap-1.5 border-l-2 border-hairline pl-3">
      <p className="m-0 t-label text-graphite-500">{RESPONDENT_NAME[respondent]}</p>
      {hasContent(answer) ? (
        <>
          {answer!.choice ? (
            <p className="m-0">
              <span className="inline-block bg-harbor-100 px-2 py-0.5 t-small font-semibold text-harbor-900">{answer!.choice}</span>
            </p>
          ) : null}
          {value ? <p className="m-0 whitespace-pre-wrap t-body [overflow-wrap:anywhere]">{value}</p> : null}
        </>
      ) : (
        <p className="m-0 t-body italic text-graphite-500">{Q_COPY.noAnswer}</p>
      )}
    </div>
  );
}

import type { QuestionsFigure } from "@/lib/guides/types";

/**
 * Questions set the way a form asks them: a large numeral, the question,
 * and two empty boxes for the answer. The boxes are drawn, not inputs; this
 * is a picture of the form, not a form.
 */
export function QuestionsView({ figure }: { figure: QuestionsFigure }) {
  return (
    <ol className="flex flex-col border-y border-hairline bg-white">
      {figure.items.map((it, i) => (
        <li key={it.question} className="grid grid-cols-[44px_1fr] gap-x-4 gap-y-3 border-b border-hairline px-4 py-5 last:border-b-0 md:grid-cols-[64px_1fr_auto] md:items-center md:px-6">
          <span className="font-display text-[40px] font-extralight leading-none text-sky-700 md:text-[52px]" aria-hidden="true">
            {i + 1}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-[17px] font-medium leading-snug text-navy md:text-[18px]">{it.question}</p>
            {it.note ? <p className="text-[14px] leading-snug text-body-muted">{it.note}</p> : null}
          </div>
          <div className="col-start-2 flex gap-5 md:col-start-3" aria-hidden="true">
            {figure.answers.map((a) => (
              <span key={a} className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.08em] text-graphite-600">
                <span className="block h-5 w-5 border-[1.5px] border-harbor-800 bg-white" />
                {a}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

import type { Route } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ui/external-link";
import { ANSWER_COPY as C } from "@/lib/answers/copy";
import type { Answer } from "@/lib/answers/types";
import { checkedOn } from "@/lib/neighborhoods/sources";

/**
 * The answer card above the results on /search: one answer the site already
 * gives, set as the question and its answer, with the page it comes from and,
 * for a fact, the public source and the day it was checked. Or, for a
 * question we don't answer, a plain line saying so and where to look.
 * Server-rendered; nothing on it is written for the query.
 */
export function AnswerCard({ answer }: { answer: Answer }) {
  if (answer.kind === "decline") {
    return (
      <aside className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8" aria-labelledby="answer-title" data-answer="decline" data-answer-topic={answer.topic}>
        <h2 id="answer-title" className="t-h3 text-navy">
          {answer.heading}
        </h2>
        <p className="t-body max-w-measure text-body">{answer.text}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          {answer.links.map((l) => (
            <li key={l.url}>
              {l.external ? (
                <ExternalLink href={l.url} className="link-rule">
                  {l.label} ↗
                </ExternalLink>
              ) : (
                <Link href={l.url as Route} className="link-rule">
                  {l.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </aside>
    );
  }
  return (
    <aside className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8" aria-labelledby="answer-title" data-answer={answer.kind}>
      <p className="t-note">{C.from.replace("{page}", answer.from.label)}</p>
      <h2 id="answer-title" className="t-h3 text-navy">
        {answer.question}
      </h2>
      <p className="t-body max-w-measure text-body">{answer.text}</p>
      {answer.source ? (
        <p className="t-note">
          {C.sourceLead}{" "}
          <ExternalLink href={answer.source.url} className="underline decoration-hairline underline-offset-4 hover:decoration-navy">
            {answer.source.label}
          </ExternalLink>
          , {C.checked.replace("{date}", checkedOn(answer.source.checked))}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
        <Link href={answer.from.url as Route} className="link-rule">
          {answer.from.cta}
        </Link>
        {answer.next ? (
          <Link href={answer.next.url as Route} className="link-rule">
            {answer.next.label}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

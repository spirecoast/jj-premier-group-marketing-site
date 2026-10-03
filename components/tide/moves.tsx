import type { Route } from "next";
import Link from "next/link";
import type { TideMove } from "@/lib/tide/issues";

/**
 * "If you're buying" or "If you're selling": three numbered moves, each the
 * move in the display face, why it matters in body text, and one quiet link
 * on to a tool or guide. An issue written before the moves existed has one
 * paragraph instead, and it shows as it was.
 */
export function Moves({ id, heading, moves, legacy }: { id: string; heading: string; moves: TideMove[]; legacy: string[] }) {
  if (!moves.length && !legacy.length) return null;
  return (
    <div className="flex flex-col gap-8" data-tide-advice={id}>
      <h3 className="t-h2 text-navy">{heading}</h3>
      {moves.length ? (
        <ol className="flex flex-col">
          {moves.map((m, i) => (
            <li key={m.move} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-rule py-7 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-x-6">
              <span className="font-display text-[2.5rem] leading-[0.9] font-extralight text-sky-700 tabular-nums sm:text-[3rem]" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-3">
                <p className="font-display text-[1.5rem] leading-[1.2] font-light text-navy sm:text-[1.75rem]">{m.move}</p>
                <p className="t-body max-w-[60ch] text-body">{m.why}</p>
                {m.link ? (
                  <Link href={m.link.href as Route} className="link-rule mt-1 self-start">
                    {m.link.label}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col gap-4 border-t border-rule pt-7">
          {legacy.map((p) => (
            <p key={p.slice(0, 40)} className="t-body max-w-[60ch] text-body">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

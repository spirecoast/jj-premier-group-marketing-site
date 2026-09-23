import { cn } from "@/lib/utils";

export type Step = { when: string; title: string; body: string };

/**
 * The "how it goes" sequence. A hairline with an amber tick, a large display
 * numeral, the moment it happens, and one plain paragraph. Order carries
 * information here: these are the steps in the order they happen.
 */
export function Steps({ items, columns = 4, className }: { items: Step[]; columns?: 3 | 4; className?: string }) {
  return (
    <ol className={cn("grid gap-10 md:grid-cols-2 md:gap-x-8", columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3", className)}>
      {items.map((s, i) => (
        <li key={s.title} className="relative flex flex-col gap-4 border-t border-rule pt-7">
          <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
          <span className="font-display text-[56px] font-light leading-none text-navy" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-700">{s.when}</p>
          <h3 className="t-h3 text-navy">{s.title}</h3>
          <p className="t-body max-w-[40ch] text-body">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

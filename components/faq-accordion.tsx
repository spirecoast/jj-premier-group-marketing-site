import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Faq = { q: string; a: ReactNode };

/** Native disclosure widgets: keyboard-accessible with no script. */
export function FaqAccordion({ items, className }: { items: Faq[]; className?: string }) {
  return (
    <div className={cn("border-b border-hairline", className)}>
      {items.map((item) => (
        <details key={item.q} className="group border-t border-hairline">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="t-h4 text-navy">{item.q}</span>
            <span className="relative h-4 w-4 shrink-0 text-navy" aria-hidden="true">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-transform group-open:scale-y-0" />
            </span>
          </summary>
          <div className="t-body max-w-measure pb-6 text-body">{item.a}</div>
        </details>
      ))}
    </div>
  );
}

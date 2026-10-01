import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

export type Step = { when: string; title: string; body: string };

/**
 * The "how it goes" sequence. A hairline with an amber tick, a large display
 * numeral, the moment it happens, and one plain paragraph. Order carries
 * information here: these are the steps in the order they happen.
 *
 * `tiles` lets a photograph of the moment into a step, keyed by the step's
 * number (1-based). The tile sits at the foot of its step, so the pictures
 * line up along the bottom of the row however long the words run. Every tile
 * is decorative (alt "", hidden from assistive technology): the step carries
 * the meaning, and the ordered list keeps its count.
 */
export function Steps({ items, columns = 4, tiles, className }: { items: Step[]; columns?: 3 | 4; tiles?: Record<number, ImageRef>; className?: string }) {
  return (
    <ol className={cn("grid gap-10 md:grid-cols-2 md:gap-x-8", columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3", className)}>
      {items.map((s, i) => {
        const tile = tiles?.[i + 1];
        return (
          <li key={s.title} className="relative flex flex-col gap-4 border-t border-rule pt-7">
            <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
            <span className="font-display text-[56px] font-light leading-none text-navy" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sky-700">{s.when}</p>
            <h3 className="t-h3 text-navy">{s.title}</h3>
            <p className="t-body max-w-[40ch] text-body">{s.body}</p>
            {tile ? (
              <div className="mt-auto pt-3" aria-hidden="true">
                <div className="relative aspect-[16/10] overflow-hidden bg-navy">
                  {/* A step is a quarter of the frame from 1024 (about 300px), half from 768, the full width below. */}
                  <Photo image={{ ...tile, alt: "" }} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" />
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

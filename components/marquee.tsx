import { cn } from "@/lib/utils";

/** The ticker under the hero. Pauses on hover; duplicates are hidden from AT. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  const copies = [0, 1, 2, 3];
  return (
    <div className={cn("overflow-hidden whitespace-nowrap border-y border-rule py-5", className)}>
      <div className="marquee inline-flex gap-16 font-mono text-[12px] uppercase tracking-[0.16em] text-linen-700">
        {copies.map((c) =>
          items.map((item, i) => (
            <span key={`${c}-${i}`} aria-hidden={c > 0 ? "true" : undefined}>
              {item}
            </span>
          )),
        )}
      </div>
    </div>
  );
}

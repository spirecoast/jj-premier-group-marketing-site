import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A choice: the `.chip` from app/globals.css (square, Harbor 100 ground,
 * Harbor 900 ink, navy when selected, 44px tall) with a tick drawn in when
 * it is on. One shape for a filter on Encore, an answer in Atlas Match and
 * Move, and a quick date in the Planner. `lg` is the questionnaire size
 * (15px, roomier); `sm` the compact one for a short list of numbers.
 */
export function Chip({
  selected = false,
  size = "md",
  tick = true,
  className,
  children,
  type = "button",
  ...rest
}: {
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  /** Draw the tick glyph when selected. Off for a toggle whose label already says so. */
  tick?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button type={type} aria-pressed={selected} data-active={selected ? "true" : undefined} className={cn("chip", size === "lg" && "chip-lg", size === "sm" && "chip-sm", className)} {...rest}>
      {tick && selected ? <ChipTick /> : null}
      {children}
    </button>
  );
}

export function ChipTick() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** A row of chips that belong to one question or filter. */
export function ChipGroup({ className, children, ...rest }: { className?: string; children: ReactNode } & Omit<ComponentProps<"div">, "className" | "children">) {
  return (
    <div role="group" className={cn("flex flex-wrap gap-2", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * A larger answer: a full-width tile with a square check box, for a question
 * whose options are sentences rather than words ("Buying", "Renting first").
 */
export function ChoiceTile({
  selected = false,
  className,
  children,
  type = "button",
  ...rest
}: { selected?: boolean; className?: string; children: ReactNode } & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "flex min-h-16 items-center gap-4 border px-5 text-left text-[16px] transition-[background-color,border-color,color] duration-(--dur-state)",
        selected ? "border-navy bg-navy text-linen-100" : "border-hairline bg-white text-navy hover:border-navy",
        className,
      )}
      {...rest}
    >
      <span className={cn("grid size-5 shrink-0 place-items-center border transition-colors", selected ? "border-linen-100 bg-linen-100 text-navy" : "border-graphite-400")} aria-hidden="true">
        {selected ? (
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path d="M2 6.2 4.8 9 10 3" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : null}
      </span>
      {children}
    </button>
  );
}

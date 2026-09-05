"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/content/types";
import { marketName } from "@/lib/content/markets";
import { cn } from "@/lib/utils";

/**
 * One quote at a time, moved by hand. No autoplay: testimonials run with
 * written permission and deserve to be read, not glimpsed.
 */
export function TestimonialSlider({
  testimonials,
  tone = "light",
  size = "large",
  className,
}: {
  testimonials: Testimonial[];
  tone?: "light" | "dark";
  /** compact: the t-quote step (22px) for caption-sized panels. */
  size?: "large" | "compact";
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  if (!testimonials.length) return null;
  const t = testimonials[index]!;
  const count = testimonials.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const quoteColor = tone === "dark" ? "text-linen-200" : "text-navy";
  const metaColor = tone === "dark" ? "text-sky-300" : "text-sky-700";
  const btn = tone === "dark" ? "border-linen-200/40 text-linen-200 hover:border-linen-200" : "border-rule text-navy hover:border-navy";

  return (
    <figure aria-live="polite" className={cn("flex flex-col", size === "compact" ? "gap-5" : "gap-8", className)}>
      <div className="flex flex-col gap-5">
        <blockquote className={cn("font-display font-light italic leading-[1.24]", size === "compact" ? "text-[1.375rem]" : "text-[clamp(1.5rem,2.6vw,2.125rem)]", quoteColor)}>
          “{t.quote}”
        </blockquote>
      </div>
      <figcaption className={cn("-mt-3 font-mono text-[10px] uppercase tracking-[0.14em]", metaColor)}>
        {[t.attribution, t.market ? marketName(t.market) : null, t.date].filter(Boolean).join(" · ")}
      </figcaption>
      {count > 1 ? (
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className={cn("flex items-center justify-center border font-mono transition-colors", size === "compact" ? "h-9 w-9 text-[12px]" : "h-11 w-11", btn)}>
            ←
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className={cn("flex items-center justify-center border font-mono transition-colors", size === "compact" ? "h-9 w-9 text-[12px]" : "h-11 w-11", btn)}>
            →
          </button>
          <span className={cn("font-mono text-[10px] tracking-[0.16em]", metaColor)}>
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </figure>
  );
}

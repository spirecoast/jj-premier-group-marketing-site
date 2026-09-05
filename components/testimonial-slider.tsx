"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/content/types";
import { marketName } from "@/lib/content/markets";
import { cn } from "@/lib/utils";

/**
 * One quote at a time, moved by hand. No autoplay: testimonials run with
 * written permission and deserve to be read, not glimpsed.
 */
export function TestimonialSlider({ testimonials, tone = "light", className }: { testimonials: Testimonial[]; tone?: "light" | "dark"; className?: string }) {
  const [index, setIndex] = useState(0);
  if (!testimonials.length) return null;
  const t = testimonials[index]!;
  const count = testimonials.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const quoteColor = tone === "dark" ? "text-linen-200" : "text-navy";
  const metaColor = tone === "dark" ? "text-sky-300" : "text-sky-700";
  const btn = tone === "dark" ? "border-linen-200/40 text-linen-200 hover:border-linen-200" : "border-rule text-navy hover:border-navy";

  return (
    <figure className={cn("flex flex-col gap-8", className)}>
      <div aria-live="polite" className="flex flex-col gap-5">
        <blockquote className={cn("font-display text-[clamp(1.5rem,2.6vw,2.125rem)] font-light italic leading-[1.24]", quoteColor)}>
          “{t.quote}”
        </blockquote>
        <figcaption className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", metaColor)}>
          {[t.attribution, t.market ? marketName(t.market) : null, t.date].filter(Boolean).join(" · ")}
        </figcaption>
      </div>
      {count > 1 ? (
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className={cn("flex h-11 w-11 items-center justify-center border font-mono transition-colors", btn)}>
            ←
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className={cn("flex h-11 w-11 items-center justify-center border font-mono transition-colors", btn)}>
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

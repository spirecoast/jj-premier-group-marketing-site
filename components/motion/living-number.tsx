"use client";

import { useEffect, useRef, useState } from "react";
import { easeBrand, formatLike, splitNumber } from "@/lib/motion/number";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const MS = 600;

/**
 * A figure that counts up to itself the first time it scrolls into view:
 * 600 ms on the brand curve, written in the same shape at every frame, so
 * tabular-nums on the parent keeps the digits still. The server renders the
 * finished figure, which is what a crawler, a reader without JavaScript and
 * anyone who asked for reduced motion gets. A figure already on screen when
 * the page arrives stays as it is rather than flashing to zero.
 */
export function LivingNumber({ text, className }: { text: string; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    setShown(text);
    const el = ref.current;
    const parts = splitNumber(text);
    if (!el || !parts || reduced || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    let first = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (first) {
          first = false;
          // The first report is where the figure stands on arrival: on screen already means no count.
          if (entry.isIntersecting) io.disconnect();
          return;
        }
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / MS);
          if (t < 1) {
            setShown(formatLike(parts, parts.value * easeBrand(t)));
            raf = requestAnimationFrame(tick);
          } else {
            setShown(text);
          }
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, reduced]);

  return (
    <span ref={ref} className={className} data-living-number="">
      {shown}
    </span>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A box that gains `draw-on` the first time it scrolls into view, so the
 * drawing inside it (a data portrait, a Tide chart) can draw itself when
 * someone reaches it and not before. Without JavaScript nothing is added
 * and the finished drawing simply shows, which is also what reduced motion
 * gets (app/globals.css, "Arrival").
 */
export function InView({
  children,
  className,
  ariaHidden,
  threshold = 0.25,
}: {
  children: ReactNode;
  className?: string;
  ariaHidden?: boolean;
  /** How much of the box must be on screen before it draws. */
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <div ref={ref} className={cn(className, on && "draw-on")} aria-hidden={ariaHidden ? "true" : undefined}>
      {children}
    </div>
  );
}

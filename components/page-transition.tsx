"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The page body's view transition boundary (app/(site)/layout.tsx). Keyed by
 * the pathname, so a route change is an exit of the old page and an entry of
 * the new one: a quick cross-fade in the brand easing (app/globals.css,
 * "View transitions"). State changes inside a page, like Encore's filters or
 * the explorer's map, are updates and run no transition at all, and nothing
 * runs for anyone who asked for reduced motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const cls = reduced ? "none" : "vt-page";
  return (
    <ViewTransition key={pathname} enter={cls} exit={cls} update="none" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

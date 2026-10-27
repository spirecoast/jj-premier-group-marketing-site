"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";

/**
 * The page body's view transition boundary (app/(site)/layout.tsx). Keyed
 * by the pathname, so a route change is an exit of the old page and an
 * entry of the new one, and React starts a view transition for it. The
 * boundary itself names nothing: naming the whole page body made Chrome
 * rasterise the old and new pages at their full height (ten thousand
 * pixels on /buy) before any fade, a frozen frame on every link. Instead
 * the cross-fade runs on the document root, whose snapshots are the size
 * of the viewport (app/globals.css, "View transitions"), while the header,
 * the product bar and the phone bar carry their own names there and hold
 * still. State changes inside a page (Encore's filters, the explorer's map)
 * are updates and run no transition, and the stylesheet runs nothing for
 * anyone who asked for reduced motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="none" exit="none" update="none" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

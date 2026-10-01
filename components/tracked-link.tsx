"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** The Plausible goal to fire on click. */
  event: AnalyticsEvent;
  /** Goal props, e.g. `{ where: "footer" }` for a phone tap. */
  props?: Record<string, string | number | boolean>;
};

/**
 * A plain anchor that fires a Plausible goal on click, for server-rendered
 * links the tagged-events script cannot see: `tel:` and `sms:` numbers and
 * the ICS feed links. The navigation itself is untouched, so a visitor who
 * blocks analytics still gets the call or the file.
 */
export function TrackedLink({ event, props, onClick, children, ...rest }: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    track(event, props);
    onClick?.(e);
  };
  return (
    <a {...rest} onClick={handleClick}>
      {children}
    </a>
  );
}

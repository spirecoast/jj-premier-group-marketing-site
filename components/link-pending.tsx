"use client";

import { useLinkStatus } from "next/link";

/**
 * Rendered inside a Link: a soft veil over it while the route it points to is
 * still on its way. It fades in only after 150 ms (app/globals.css,
 * ".link-pending"), so a prefetched page, the usual case, never shows it,
 * and a slow one tells you the click counted without a spinner.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden="true" className="link-pending" /> : null;
}

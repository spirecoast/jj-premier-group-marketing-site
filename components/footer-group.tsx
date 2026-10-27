"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Below this the footer's link groups fold into disclosure rows. */
const WIDE = "(min-width: 40rem)";

/**
 * One group of footer links. From `sm` it is a heading and its list, open
 * on the page as it always was. On a phone, where five open groups made the
 * footer almost three screens tall, it is a native details/summary row,
 * closed by default, 56px tall with a chevron, and the links inside sit at
 * a 44px pitch. The server renders the open form (so nothing is hidden
 * without JavaScript or for a crawler); the browser folds it on a phone.
 */
export function FooterGroup({ heading, children }: { heading: ReactNode; children: ReactNode }) {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const read = () => setWide(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  if (wide) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="flex flex-col gap-1.5">{heading}</h2>
        {children}
      </div>
    );
  }
  return (
    <details className="footer-group">
      <summary className="footer-group-row">
        <h2 className="flex flex-col gap-1.5">{heading}</h2>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="footer-group-chevron">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </summary>
      <div className="footer-group-body">{children}</div>
    </details>
  );
}

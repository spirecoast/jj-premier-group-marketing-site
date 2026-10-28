"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { encode } from "uqr";
import { ProductLockup } from "@/components/brand/emblem";
import { useSiteTeam } from "@/components/site-contact";
import { Wordmark } from "@/components/wordmark";
import { KEEP_TOOLS, type KeepToolId } from "@/lib/keep/tools";
import { cn } from "@/lib/utils";
import "./keep.css";

/*
 * A tool's result as a document (F91). On screen the wrapper is invisible;
 * in print the page is this wrapper alone (keep.css), headed with the
 * product's lockup and the day it was made, and footed with where the
 * numbers come from, the two of us, and a QR code of the link that opens
 * the same result on the site. "Save as PDF" is the browser's own print
 * dialog, so what's saved is exactly what was on the screen.
 */

const still = () => () => {};
const longDate = () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** The link as the QR code and the foot show it: absolute, on this site. */
function absolute(url: string | undefined): string {
  try {
    return new URL(url ?? window.location.href, window.location.href).toString();
  } catch {
    return window.location.href;
  }
}

/** The QR code as one path, drawn in navy on white with its quiet zone. */
function QrCode({ text, size = 84 }: { text: string; size?: number }) {
  const d = useMemo(() => {
    if (!text) return null;
    try {
      const { data } = encode(text, { ecc: "M", border: 2 });
      let path = "";
      data.forEach((row, y) =>
        row.forEach((on, x) => {
          if (on) path += `M${x} ${y}h1v1h-1z`;
        }),
      );
      return { path, n: data.length };
    } catch {
      return null;
    }
  }, [text]);
  if (!d) return null;
  return (
    <svg viewBox={`0 0 ${d.n} ${d.n}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden="true" className="keep-qr">
      <rect width={d.n} height={d.n} fill="#fff" />
      <path d={d.path} fill="#1e3442" />
    </svg>
  );
}

export function KeepSheet({ tool, url, title, className, children }: { tool: KeepToolId; url?: string; title?: string; className?: string; children: ReactNode }) {
  const t = KEEP_TOOLS[tool];
  const team = useSiteTeam();
  // Read when the page prints, so the date, the link and its code are the ones of that moment.
  const today = useSyncExternalStore(still, longDate, () => "");
  const [printing, setPrinting] = useState<{ href: string; day: string } | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // A fold the tool marks data-keep-open (Tide Street's table) prints open, and closes again after.
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = Array.from(sheet.current?.querySelectorAll<HTMLDetailsElement>("details[data-keep-open]:not([open])") ?? []);
      opened.forEach((d) => (d.open = true));
      flushSync(() => setPrinting({ href: absolute(url), day: longDate() }));
    };
    const after = () => {
      opened.forEach((d) => (d.open = false));
      opened = [];
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [url]);
  // Empty on the server and at hydration (the link is the browser's), then the live one.
  const mounted = useSyncExternalStore(still, () => true, () => false);
  const href = printing?.href ?? (mounted ? absolute(url) : "");
  const day = printing?.day ?? today;
  const host = (() => {
    try {
      return new URL(href).host;
    } catch {
      return "";
    }
  })();

  return (
    <div ref={sheet} data-keep-sheet={tool} className={className}>
      <div className="keep-print keep-print-head" aria-hidden="true">
        <span className="keep-print-mark">
          {t.product ? <ProductLockup family={t.family} product={t.product} tone="light" size="md" decorative /> : <Wordmark tone="dark" />}
        </span>
        <span className="keep-print-meta">
          {title ? <span className="keep-print-title">{title}</span> : null}
          <span>Made {day}</span>
          <span>{host}</span>
        </span>
      </div>
      {children}
      <div className="keep-print keep-print-foot" aria-hidden="true">
        <div className="keep-print-words">
          <p className="keep-print-source">{t.source}</p>
          {team.length ? (
            <p className="keep-print-team">
              {team.map((m, i) => (
                <span key={m.name}>
                  {i ? <span className="keep-print-dot"> · </span> : null}
                  {m.name} {m.phone}
                </span>
              ))}
            </p>
          ) : null}
          <p className="keep-print-brand">JJ Premier Group · Coldwell Banker Realty</p>
        </div>
        <div className={cn("keep-print-code", !href && "hidden")}>
          <QrCode text={href} />
          <span>Scan to open this on the site</span>
        </div>
      </div>
    </div>
  );
}

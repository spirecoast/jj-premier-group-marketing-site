"use client";

import { useEffect, useState } from "react";

type Item = { id: string; number: string; title: string };

/**
 * "Inside this guide": numbered sections. Sticky beside the article on
 * desktop with the section in view highlighted; a folded <details> on
 * phones. The highlight is progressive: without JavaScript the list is a
 * plain list of anchors.
 */
export function GuideContents({ items, onePageId }: { items: Item[]; onePageId: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const ids = [...items.map((i) => i.id), onePageId];
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        // The topmost visible section wins; if none is visible, keep the last.
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
        if (top) setActive(top[0]);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items, onePageId]);

  const list = (
    <ol className="guide-toc flex flex-col">
      {[...items, { id: onePageId, number: "", title: "On one page" }].map((it) => (
        <li key={it.id} className="border-b border-hairline last:border-b-0">
          <a href={`#${it.id}`} aria-current={active === it.id ? "true" : undefined} className="grid grid-cols-[32px_1fr] items-baseline gap-2 py-2.5 text-[14px] leading-snug text-body transition-colors hover:text-navy">
            <span className="font-mono text-[11px] text-amber">{it.number || "—"}</span>
            <span className="flex flex-col gap-1">
              {it.title}
              <span className="guide-toc-rule" aria-hidden="true" />
            </span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav aria-label="Inside this guide" className="print-hide hidden lg:block">
        <p className="t-eyebrow mb-3 text-amber">Inside this guide</p>
        {list}
      </nav>
      <details className="print-hide group border-y border-hairline lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-3 [&::-webkit-details-marker]:hidden">
          <span className="t-eyebrow text-amber">Inside this guide</span>
          <span className="font-mono text-[12px] text-graphite-500 transition-transform group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>
        <nav aria-label="Inside this guide" className="pb-2">
          {list}
        </nav>
      </details>
    </>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { scrollBehavior } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import "./guides.css";

export type CompanionItem = { id: string; number: string; title: string };

type Props = {
  /** The sections or steps, in order, each with the id of the element it names. */
  items: CompanionItem[];
  /** The element whose length the progress line measures: the steps' list, the article. */
  articleId: string;
  /** What the list is called: "Steps", "Inside this guide". */
  label: string;
  /** The word before the position ("Step 3 of 10"); none for "3 of 8". */
  word?: string;
  /** The button that opens the list. */
  button: string;
  /** From lg: the bar with its numerals ("bar"), or only the progress line, when a rail already sits beside the text ("line"). */
  desktop?: "bar" | "line";
};

/** How far past the bar's top edge a section's top may sit and still count as the one being read. */
const READ_LINE = 8;

/**
 * The reading companion for a long page: a thin bar that sticks under the
 * header saying where the reader is ("Step 3 of 10 · Get prequalified"),
 * with a 2px line along its foot that fills as the page is read, and a
 * button that opens the whole list as a sheet (a native dialog: Escape and
 * the backdrop close it, focus comes back to the button). From lg the ten
 * numerals sit in the bar, the current one carrying the Sky rule, or the bar
 * folds to the line alone where a contents rail already stands beside the
 * text. It steps up to the top edge while the phone header is tucked away,
 * the way the Encore band does. Without JavaScript the bar is the position
 * line and the list, which are plain anchors.
 */
export function ReadingCompanion({ items, articleId, label, word, button, desktop = "bar" }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const targets = items.map((it) => document.getElementById(it.id));
    let ticking = false;
    const read = () => {
      ticking = false;
      const barRect = bar.current?.getBoundingClientRect();
      // The bar's own foot (it is sticky, so its top is where the page is being read from).
      const line = (barRect ? barRect.bottom : 0) + READ_LINE;
      let at = 0;
      targets.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) at = i;
      });
      setCurrent(at);
      const rect = article.getBoundingClientRect();
      const head = barRect ? barRect.top : 0;
      const length = rect.height - (window.innerHeight - head);
      const p = length > 0 ? (head - rect.top) / length : 1;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(read);
      }
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items, articleId]);

  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();
  const go = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    e.preventDefault();
    close();
    el.scrollIntoView({ block: "start", behavior: scrollBehavior() });
    window.history.replaceState(window.history.state, "", `#${targetId}`);
  };

  const here = items[current];
  const position = `${word ? `${word} ` : ""}${current + 1} of ${items.length}`;

  return (
    <div ref={bar} className={cn("companion print-hide", desktop === "line" && "companion-line-only")} data-companion>
      <div className="container-site companion-row">
        <p className="companion-where">
          <span className="companion-position">{position}</span>
          {here ? <span className="companion-title">{here.title}</span> : null}
        </p>
        {desktop === "bar" ? (
          <ol className="companion-index" aria-label={label}>
            {items.map((it, i) => (
              <li key={it.id}>
                <a href={`#${it.id}`} onClick={(e) => go(e, it.id)} aria-label={`${word ? `${word} ` : ""}${i + 1}, ${it.title}`} aria-current={i === current ? "step" : undefined}>
                  {it.number}
                  <span className="guide-toc-rule" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        ) : null}
        <button type="button" className="companion-button" aria-haspopup="dialog" aria-controls={id} onClick={open}>
          {button}
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <span className="companion-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <dialog
        id={id}
        ref={dialog}
        className="companion-sheet"
        aria-label={label}
        onClick={(e) => {
          // A click on the backdrop (the dialog itself, outside its panel) closes it.
          if (e.target === dialog.current) close();
        }}
      >
        <div className="companion-sheet-panel">
          <div className="companion-sheet-head">
            <p className="t-h4 text-navy">{label}</p>
            <button type="button" className="btn-quiet" onClick={close}>
              Close
            </button>
          </div>
          <ol className="guide-toc flex flex-col">
            {items.map((it, i) => (
              <li key={it.id} className="border-b border-hairline last:border-b-0">
                <a href={`#${it.id}`} onClick={(e) => go(e, it.id)} aria-current={i === current ? "step" : undefined} className="grid grid-cols-[32px_1fr] items-baseline gap-2 py-3 text-[15px] leading-snug text-body transition-colors hover:text-navy">
                  <span className="font-mono text-[11px] text-amber">{it.number}</span>
                  <span className="flex flex-col gap-1">
                    {it.title}
                    <span className="guide-toc-rule" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </div>
  );
}

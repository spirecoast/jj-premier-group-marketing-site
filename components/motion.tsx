"use client";

import { useEffect } from "react";
import { readMotionPref } from "@/lib/motion-pref";

/** Motion that runs on a loop: paused while its element is off the screen. */
const LOOPS = ".hero-img, .masthead-img, .cameo-orbit, .scroll-cue, .encore-marquee, .art-drift, .art-breathe";
/** Elements that rise into place once, the first time they come into view. */
const REVEALS = ".sr, .sr-img";

/**
 * The page's motion, watched from one place (app/(site)/layout.tsx).
 *
 * Reveals: an element marked `.sr` (or `.sr-img`) starts a little low and
 * transparent and settles once it is 15% into the view, then stays. The
 * stylesheet only hides anything after <html data-reveals> is set, and
 * whatever is on the screen at that moment is marked in first, so a page
 * never flashes, and without JavaScript everything is simply in place.
 * New elements (the next page, a filtered list) are picked up as they arrive.
 *
 * Loops: the photographs' slow drift, the cameo's orbit, Encore's bulbs and
 * the Tide art are paused while they are off the screen, and altogether
 * when the visitor asks (lib/motion-pref.ts). Reduced motion runs none of it.
 */
export function Motion() {
  useEffect(() => {
    readMotionPref();

    const seen = new WeakSet<Element>();
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          // A block taller than most of the screen can never show 15% of itself at once.
          const tall = e.boundingClientRect.height > (e.rootBounds?.height ?? window.innerHeight) * 0.6;
          if (e.intersectionRatio < 0.15 && !tall) continue;
          e.target.setAttribute("data-in", "");
          reveal.unobserve(e.target);
        }
      },
      { threshold: [0, 0.15], rootMargin: "0px 0px -8% 0px" },
    );
    const loops = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
      },
      { threshold: 0 },
    );

    const watch = (el: Element) => {
      if (el.matches(REVEALS)) adopt(el, reveal);
      if (el.matches(LOOPS)) adopt(el, loops);
      el.querySelectorAll(REVEALS).forEach((c) => adopt(c, reveal));
      el.querySelectorAll(LOOPS).forEach((c) => adopt(c, loops));
    };
    const adopt = (el: Element, io: IntersectionObserver) => {
      if (seen.has(el) || el.hasAttribute("data-in")) return;
      seen.add(el);
      io.observe(el);
    };

    // What is on the screen now is in before the stylesheet can hide it.
    const vh = window.innerHeight;
    document.querySelectorAll(REVEALS).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.setAttribute("data-in", "");
    });
    document.documentElement.setAttribute("data-reveals", "");
    watch(document.body);

    const added = new MutationObserver((records) => {
      for (const r of records) for (const n of r.addedNodes) if (n instanceof Element) watch(n);
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      reveal.disconnect();
      loops.disconnect();
      added.disconnect();
      document.documentElement.removeAttribute("data-reveals");
    };
  }, []);
  return null;
}

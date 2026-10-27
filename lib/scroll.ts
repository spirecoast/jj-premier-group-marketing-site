/**
 * Scrolling the page from code. A `behavior: "smooth"` passed in JavaScript
 * overrides the stylesheet's reduced-motion rule (scroll-behavior: auto), so
 * every call goes through scrollBehavior() instead of naming "smooth".
 */

const REDUCE = "(prefers-reduced-motion: reduce)";

/** "smooth", or "auto" for anyone who asked their system for reduced motion. */
export function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "auto";
  return window.matchMedia(REDUCE).matches ? "auto" : "smooth";
}

/**
 * Brings a step-by-step question to the top of the screen when its top has
 * gone up under the sticky header (or off the screen), so the new question
 * and its "2 of 4" are what the visitor sees after Next or Back. The element
 * should carry `scroll-mt-header` so it stops below the header. A question
 * whose top is already on screen stays where it is: nothing jumps.
 */
export function revealStep(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const top = el.getBoundingClientRect().top;
  if (top < margin - 1 || top > window.innerHeight * 0.6) el.scrollIntoView({ block: "start", behavior: scrollBehavior() });
}

/** Scrolls an element to the top of the screen (under the header, through its scroll-margin). */
export function scrollToTop(el: HTMLElement | null | undefined): void {
  el?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
}

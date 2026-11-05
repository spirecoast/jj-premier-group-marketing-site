"use client";

import { setMotionPaused, useMotionPaused } from "@/lib/motion-pref";
import { cn } from "@/lib/utils";

/**
 * The one control for the site's looping motion: a small glass square in a
 * hero's corner that pauses what moves there, a masthead photograph's drift
 * or the home page's video (and every other loop, on every page, until it is
 * played again). `what` names that thing in the label. Hidden for anyone
 * whose system already asks for reduced motion, since nothing loops for them.
 */
export function MotionToggle({ className, what = "the photograph" }: { className?: string; what?: string }) {
  const paused = useMotionPaused();
  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? `Play ${what}` : `Pause ${what}`}
      title={paused ? "Play" : "Pause"}
      onClick={() => setMotionPaused(!paused)}
      className={cn("motion-toggle", className)}
    >
      {paused ? (
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
          <path d="M1 1l8 5-8 5z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
          <path d="M1.5 1v10M8.5 1v10" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
      )}
    </button>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { nextStepFor } from "@/lib/site";
import { cn } from "@/lib/utils";

const cell = "t-label action-cell flex h-12 items-center justify-center text-linen-200";

/**
 * The call and text bar on phones. 48px targets, navy furniture, Call and
 * Text on the outside; between them, where a page has one, the page's own
 * next step (lib/site.ts, nextSteps): the inquiry on a listing, the PDF on
 * a guide, tonight on the calendar. On a scroll down the bar steps aside
 * into a small Call · Text chip in the corner (html[data-scroll], set by
 * the header), and it hides while a text field has focus and on very short
 * screens (app/globals.css, "The phone action bar").
 */
export function MobileActionBar({ phoneE164 }: { phoneE164: string }) {
  const pathname = usePathname();
  const step = nextStepFor(pathname);
  const call = () => track("Phone tap", { where: "action-bar" });
  const text = () => track("Phone tap", { where: "action-bar-text" });
  const pdf = step ? /\.pdf$/.test(step.href) : false;
  return (
    <>
      <nav
        data-mobile-bar
        data-ground="dark"
        aria-label="Call or text us"
        className={cn(
          "action-bar fixed inset-x-0 bottom-0 z-40 grid border-t border-sky-300/20 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden",
          step ? "grid-cols-[1fr_minmax(0,1.5fr)_1fr]" : "grid-cols-2",
        )}
      >
        <a href={`tel:${phoneE164}`} className={cell} onClick={call}>
          Call
        </a>
        {step ? (
          <a
            href={step.href}
            download={pdf ? "" : undefined}
            className={`${cell} border-l border-sky-300/20 bg-sky-700 px-2 text-center text-white`}
            onClick={() =>
              pdf
                ? track("Download", { what: "guide-pdf", guide: pathname.slice("/guides/".length) })
                : track("Explore", { action: "next-step", where: "action-bar", to: step.href })
            }
          >
            {step.label}
          </a>
        ) : null}
        <a href={`sms:${phoneE164}`} className={`${cell} border-l border-sky-300/20`} onClick={text}>
          Text
        </a>
      </nav>
      {/* The same two numbers while the bar is tucked: a 36px chip in the corner. */}
      <div data-mobile-pill data-ground="dark" className="action-pill md:hidden">
        <a href={`tel:${phoneE164}`} className="action-pill-cell" onClick={call}>
          Call
        </a>
        <span aria-hidden="true" className="text-linen-200/50">
          ·
        </span>
        <a href={`sms:${phoneE164}`} className="action-pill-cell" onClick={text}>
          Text
        </a>
      </div>
    </>
  );
}

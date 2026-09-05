"use client";

import { usePathname } from "next/navigation";

/**
 * Sticky call and text bar on phones. 48px targets, navy furniture.
 * On a listing page the middle action jumps to the inquiry form, as the
 * web design's "sticky action bar" specifies.
 */
export function MobileActionBar({ phoneE164 }: { phoneE164: string }) {
  const pathname = usePathname();
  const onListing = /^\/listings\/[^/]+$/.test(pathname);
  const cell = "t-label flex h-12 items-center justify-center text-linen-200";
  return (
    <div
      data-mobile-bar
      className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-sky-300/20 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden ${onListing ? "grid-cols-3" : "grid-cols-2"}`}
    >
      <a href={`tel:${phoneE164}`} className={cell}>
        Call
      </a>
      {onListing ? (
        <a href="#inquire" className={`${cell} border-l border-sky-300/20 bg-sky-700 text-white`}>
          Showing
        </a>
      ) : null}
      <a href={`sms:${phoneE164}`} className={`${cell} border-l border-sky-300/20`}>
        Text
      </a>
    </div>
  );
}

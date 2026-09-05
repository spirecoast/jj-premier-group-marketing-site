/** Sticky call and text bar on phones. 48px targets, navy furniture. */
export function MobileActionBar({ phoneE164 }: { phoneE164: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-sky-300/20 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden">
      <a href={`tel:${phoneE164}`} className="t-label flex h-12 items-center justify-center text-linen-200">
        Call
      </a>
      <a
        href={`sms:${phoneE164}`}
        className="t-label flex h-12 items-center justify-center border-l border-sky-300/20 text-linen-200"
      >
        Text
      </a>
    </div>
  );
}

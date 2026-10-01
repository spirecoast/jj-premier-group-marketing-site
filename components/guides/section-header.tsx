/**
 * "Section 03 of 07", the title in the display face and the ghost numeral,
 * on navy, then the one-line lead under it. The lead is the "why this
 * matters" every section opens with.
 */
export function GuideSectionHeader({ number, of, title, lead }: { number: number; of: number; title: string; lead: string }) {
  const n = String(number).padStart(2, "0");
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden bg-navy px-6 py-8 text-white md:px-10 md:py-10">
        <span className="guide-ghost pointer-events-none absolute -right-2 -top-3 md:right-4" aria-hidden="true">
          {n}
        </span>
        <p className="t-eyebrow relative flex items-center gap-3 text-mist">
          <span>Section {n}</span>
          <span className="h-px w-8 bg-sky-300/60" aria-hidden="true" />
          <span>of {String(of).padStart(2, "0")}</span>
        </p>
        <span className="relative mt-5 block h-px w-10 bg-sky-300" aria-hidden="true" />
        <h2 className="t-h1 relative mt-4 max-w-[560px] text-balance text-white">{title}</h2>
      </div>
      <p className="t-lead max-w-measure text-navy">{lead}</p>
    </div>
  );
}

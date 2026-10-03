import Link from "next/link";
import type { Guide } from "@/lib/guides/types";
import { TOOLS } from "@/lib/guides";

/** The worksheet at the end: one row per thing to know, with a line to fill in. */
export function OnOnePage({ guide, id }: { guide: Guide; id: string }) {
  const { onOnePage } = guide;
  return (
    <section id={id} className="flex scroll-mt-header flex-col gap-5 border border-rule bg-parchment p-5 md:p-8" aria-labelledby={`${id}-title`}>
      <div className="flex flex-col gap-1.5">
        <p className="t-eyebrow text-amber">Worksheet · On one page</p>
        <h2 id={`${id}-title`} className="t-h2 text-navy">
          {onOnePage.title}
        </h2>
        <p className="t-small text-body-muted">{onOnePage.reading}</p>
      </div>
      <ol className="flex flex-col divide-y divide-rule border-y border-rule">
        {onOnePage.rows.map((r, i) => (
          <li key={r.label} className="grid gap-x-4 gap-y-1 py-3 md:grid-cols-[32px_1fr_1fr] md:items-baseline">
            <span className="hidden font-mono text-[11px] text-amber md:block">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-[14px] font-medium leading-snug text-ink">{r.label}</span>
            <span className="flex min-w-0 items-baseline gap-3 font-mono text-[11px] text-graphite-600">
              <span className="h-px min-w-6 flex-1 bg-rule md:hidden" aria-hidden="true" />
              {/* A long value wraps inside its column; it used to refuse to shrink and push the page wider than the phone. */}
              <span className="min-w-0 break-words md:text-left">{r.value}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The closing block: what we'll do with an address. */
export function GuideNext({ guide }: { guide: Guide }) {
  const tool = TOOLS[guide.next.tool];
  return (
    <section className="grid gap-6 bg-navy px-6 py-10 text-white md:grid-cols-[1fr_1.4fr] md:gap-12 md:px-10 md:py-12" aria-labelledby="guide-next-title">
      <div className="flex flex-col gap-3">
        <p className="t-eyebrow text-mist">{guide.next.eyebrow}</p>
        <h2 id="guide-next-title" className="t-h1 text-white">
          {guide.next.title}
        </h2>
      </div>
      <div className="flex flex-col gap-6">
        <p className="t-body text-linen-100">{guide.next.body}</p>
        <Link href={tool.href as "/"} className="btn btn-linen self-start print-hide">
          <span className="btn-dash" aria-hidden="true" />
          {guide.next.cta}
        </Link>
      </div>
    </section>
  );
}

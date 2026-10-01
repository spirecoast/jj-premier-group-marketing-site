import Link from "next/link";
import type { Block, CalloutBlock, DefinitionBlock, Inline, Source, TableBlock } from "@/lib/guides/types";
import { TOOLS } from "@/lib/guides";
import { Figure } from "./figure";

export function InlineText({ segs }: { segs: Inline[] }) {
  return (
    <>
      {segs.map((s, i) => {
        if (typeof s === "string") return <span key={i}>{s}</span>;
        const external = /^https?:\/\//.test(s.href);
        return external ? (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
            {s.text}
          </a>
        ) : (
          <Link key={i} href={s.href as "/"}>
            {s.text}
          </Link>
        );
      })}
    </>
  );
}

/** "Source: …" under a factual block. Mono, small, with the link. */
export function SourceLine({ source, className = "" }: { source: Source; className?: string }) {
  return (
    <p className={`font-mono text-[11px] leading-relaxed text-graphite-600 ${className}`}>
      <span className="font-medium text-ink">Source: </span>
      {source.href ? (
        <a href={source.href} target="_blank" rel="noopener noreferrer" className="underline decoration-harbor-300 underline-offset-2 hover:text-navy">
          {source.label}
        </a>
      ) : (
        source.label
      )}
      {source.note ? ` (${source.note})` : ""}
    </p>
  );
}

function Definition({ block }: { block: DefinitionBlock }) {
  return (
    <dl className="guide-definition grid gap-2 border-l-2 border-sky-700 py-1 pl-5 md:grid-cols-[180px_1fr] md:gap-6">
      <dt className="t-label text-navy">{block.term}</dt>
      <dd className="flex flex-col gap-2">
        <p className="text-[15px] leading-relaxed text-body">{block.definition}</p>
        {block.source ? <SourceLine source={block.source} /> : null}
      </dd>
    </dl>
  );
}

function Callout({ block }: { block: CalloutBlock }) {
  const tool = TOOLS[block.tool];
  return (
    <aside className="guide-callout grid gap-4 border border-rule bg-parchment p-5 md:grid-cols-[150px_1fr] md:gap-8 md:p-7" aria-label={block.eyebrow}>
      <div className="flex flex-col gap-2">
        <span className="font-display text-[28px] font-light leading-none text-navy" aria-hidden="true">
          →
        </span>
        <span className="t-eyebrow text-amber">{block.eyebrow}</span>
      </div>
      <div className="flex flex-col gap-4">
        <p className="text-[16px] leading-relaxed text-body">{block.body}</p>
        <Link href={tool.href as "/"} className="link-rule self-start print-hide">
          {block.cta}
        </Link>
        <span className="hidden font-mono text-[10px] text-graphite-500 print:block">{tool.href}</span>
      </div>
    </aside>
  );
}

function Table({ block }: { block: TableBlock }) {
  return (
    <figure className="flex flex-col gap-3 border border-hairline bg-white p-5 md:p-6">
      <figcaption className="t-lead text-navy">{block.title}</figcaption>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[520px] border-collapse text-[14px] leading-snug text-body">
          <thead>
            <tr>
              {block.columns.map((c) => (
                <th key={c} scope="col" className="border-b border-hairline pb-2 pr-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-graphite-600">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i} className="border-b border-hairline">
                {r.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="py-3 pr-4 text-left align-top font-mono text-[12px] text-amber">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className="py-3 pr-4 align-top">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SourceLine source={block.source} className="border-t border-hairline pt-3" />
    </figure>
  );
}

/**
 * Renders a section's blocks in order. Figures are numbered through the
 * whole guide, so the caller passes the number the first figure here gets.
 */
export function Blocks({ blocks, firstFigure }: { blocks: Block[]; firstFigure: number }) {
  let fig = firstFigure - 1;
  let paragraphs = 0;
  return (
    <div className="flex flex-col gap-7">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "paragraph": {
            paragraphs += 1;
            const first = paragraphs === 1;
            return (
              <div key={i} className="flex max-w-measure flex-col gap-2">
                <p className={`guide-text ${first ? "guide-drop" : ""}`}>
                  <InlineText segs={b.segs} />
                </p>
                {b.source ? <SourceLine source={b.source} className="print:block hidden" /> : null}
              </div>
            );
          }
          case "subhead":
            return (
              <h3 key={i} className="t-h3 max-w-measure pt-2 text-navy">
                {b.text}
              </h3>
            );
          case "definition":
            return <Definition key={i} block={b} />;
          case "pull-quote":
            return (
              <blockquote key={i} className="bg-navy px-6 py-8 md:px-10 md:py-10">
                <p className="t-quote max-w-[640px] text-linen-200">{b.text}</p>
              </blockquote>
            );
          case "table":
            return <Table key={i} block={b} />;
          case "callout":
            return <Callout key={i} block={b} />;
          case "figure":
            fig += 1;
            return <Figure key={i} block={b} number={fig} />;
        }
      })}
    </div>
  );
}

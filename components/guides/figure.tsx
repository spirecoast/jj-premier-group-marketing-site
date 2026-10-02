import Link from "next/link";
import type { FigureBlock } from "@/lib/guides/types";
import { TOOLS } from "@/lib/guides";
import { BarFigureView } from "./figures/bar";
import { ChecklistView } from "./figures/checklist";
import { ComparisonFigureView } from "./figures/comparison";
import { ElevationExampleView } from "./figures/elevation-example";
import { LadderFigureView } from "./figures/ladder";
import { MapCalloutView } from "./figures/map-callout";
import { MatrixFigureView } from "./figures/matrix";
import { TimelineFigureView } from "./figures/timeline";
import { CoastFigureView } from "./figures/coast";
import { DecidesView } from "./figures/decides";
import { QuestionsView } from "./figures/questions";
import { TwoHousesView } from "./figures/two-houses";
import { ZoneCardsView } from "./figures/zone-cards";

const two = (n: number) => String(n).padStart(2, "0");

function Drawing({ block }: { block: FigureBlock }) {
  const f = block.figure;
  switch (f.type) {
    case "bar":
      return <BarFigureView figure={f} title={block.title} />;
    case "comparison":
      return <ComparisonFigureView figure={f} title={block.title} />;
    case "matrix":
      return <MatrixFigureView figure={f} title={block.title} />;
    case "timeline":
      return <TimelineFigureView figure={f} title={block.title} />;
    case "worked-example":
      return <ElevationExampleView figure={f} title={block.title} />;
    case "map-callout":
      return <MapCalloutView figure={f} />;
    case "checklist":
      return <ChecklistView figure={f} />;
    case "ladder":
      return <LadderFigureView figure={f} title={block.title} />;
    case "coast":
      return <CoastFigureView figure={f} title={block.title} />;
    case "zone-cards":
      return <ZoneCardsView figure={f} title={block.title} />;
    case "two-houses":
      return <TwoHousesView figure={f} title={block.title} />;
    case "decides":
      return <DecidesView figure={f} />;
    case "questions":
      return <QuestionsView figure={f} />;
  }
}

/**
 * The frame every figure sits in: "Fig. 03 · The example", a title, one
 * line on how to read it, the drawing, a note, and the source line. The
 * optional tool link sits in the foot, the way the samples point at the
 * firm's calculators.
 */
export function Figure({ block, number }: { block: FigureBlock; number: number }) {
  const id = `fig-${two(number)}`;
  const tool = block.tool ? TOOLS[block.tool.tool] : null;
  return (
    <figure id={id} className="flex scroll-mt-header flex-col gap-4 border border-hairline bg-linen-50 p-5 md:p-7" aria-labelledby={`${id}-title`}>
      <figcaption className="flex flex-col gap-1.5">
        <span className="t-eyebrow text-amber">
          Fig. {two(number)} · {block.eyebrow}
        </span>
        <span id={`${id}-title`} className="t-lead text-navy">
          {block.title}
        </span>
        <span className="t-small text-body-muted">{block.reading}</span>
      </figcaption>
      <div className="pt-1">
        <Drawing block={block} />
      </div>
      {block.note ? <p className="t-small border-t border-hairline pt-3 text-body-muted">{block.note}</p> : null}
      <div className="flex flex-col gap-3 border-t border-hairline pt-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <p className="font-mono text-[11px] leading-relaxed text-graphite-600">
          <span className="font-medium text-ink">Source: </span>
          {block.source.href ? (
            <a href={block.source.href} target="_blank" rel="noopener noreferrer" className="underline decoration-harbor-300 underline-offset-2 hover:text-navy">
              {block.source.label}
            </a>
          ) : (
            block.source.label
          )}
          {block.source.note ? ` ${block.source.note}.` : ""}
        </p>
        {tool && block.tool ? (
          <Link href={tool.href as "/"} className="link-rule shrink-0 print-hide">
            {block.tool.cta} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </figure>
  );
}

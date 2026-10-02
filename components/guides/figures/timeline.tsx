import { useId } from "react";
import type { TimelineFigure, TimelineLane } from "@/lib/guides/types";
import { FigureTable, HatchDefs, Legend, hatchUrl, seriesFill } from "./shared";

const H = 20;

/** The word for one unit on the axis, for the phone's marker list: "Day 30", "Week 8". */
const unitWord = (unit: string) => {
  const u = unit.toLowerCase();
  if (u.startsWith("day")) return "Day";
  if (u.startsWith("week")) return "Week";
  if (u.startsWith("month")) return "Month";
  if (u.startsWith("year")) return "Year";
  return unit;
};

/** One lane's track: an SVG with percentage coordinates, so the bar stretches and the text doesn't. */
function Track({ lane, id, pct, max }: { lane: TimelineLane; id: string; pct: (v: number) => number; max: number }) {
  const wide = lane.end - lane.start >= max * 0.2;
  const textStyle = wide ? { left: `calc(${pct(lane.start)}% + 8px)` } : pct(lane.end) > 70 ? { right: `calc(${100 - pct(lane.start)}% + 8px)` } : { left: `calc(${pct(lane.end)}% + 8px)` };
  return (
    <div className="relative flex h-full items-center">
      <svg width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true" className="block overflow-visible">
        <HatchDefs id={id} series={[lane.series]} />
        <rect x={pct(lane.start)} y="0" width={Math.max(pct(lane.end) - pct(lane.start), 0.6)} height={H} className={lane.hatched ? undefined : seriesFill(lane.series)} fill={lane.hatched ? hatchUrl(id, lane.series) : undefined} />
      </svg>
      {lane.text ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em] ${wide && !lane.hatched ? "text-white" : "bg-white/90 px-1 text-ink"}`}
          style={textStyle}
        >
          {lane.text}
        </span>
      ) : null}
    </div>
  );
}

function LaneLabel({ lane }: { lane: TimelineLane }) {
  return (
    <div className="flex flex-col justify-center">
      <span className="text-[14px] font-medium leading-snug text-ink">{lane.label}</span>
      {lane.sub ? <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{lane.sub}</span> : null}
    </div>
  );
}

function Axis({ figure, pct }: { figure: TimelineFigure; pct: (v: number) => number }) {
  return (
    <div className="relative h-6 border-t border-graphite-300" aria-hidden="true">
      {figure.ticks.map((t) => (
        <span key={t.at} className={`absolute top-1 font-mono text-[10px] tabular-nums text-graphite-500 ${t.at === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${pct(t.at)}%` }}>
          {t.label}
        </span>
      ))}
      <span className="absolute right-0 top-1 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">{figure.unit}</span>
    </div>
  );
}

/**
 * Lanes on one time axis. From the small breakpoint up the labels sit in a
 * column to the left and the tracks stack to the right, with the markers (a
 * signed contract, a closing) drawn as coral rules down the whole track
 * column. On phones each lane's label sits above its track and the markers
 * are listed under the axis.
 */
export function TimelineFigureView({ figure, title }: { figure: TimelineFigure; title: string }) {
  const id = useId().replace(/[:]/g, "");
  const pct = (v: number) => (v / figure.max) * 100;
  const rows = figure.lanes.length;
  return (
    <div className="flex flex-col gap-5">
      {/* Small screens and up */}
      <div className="hidden sm:grid sm:grid-cols-[190px_1fr] sm:gap-x-5">
        <div className="h-9" />
        <div className="relative h-9" aria-hidden="true">
          {figure.markers.map((m) => (
            <span key={m.label} className={`absolute top-0 max-w-[48%] whitespace-nowrap font-mono text-[10px] uppercase leading-tight tracking-[0.12em] text-graphite-600 ${pct(m.at) > 60 ? "-translate-x-full pr-2 text-right" : "pl-2"}`} style={{ left: `${pct(m.at)}%` }}>
              {m.label}
            </span>
          ))}
        </div>
        <ul className="flex flex-col">
          {figure.lanes.map((lane) => (
            <li key={lane.label} className="flex h-16 flex-col justify-center border-t border-hairline">
              <LaneLabel lane={lane} />
            </li>
          ))}
        </ul>
        <div className="relative">
          <ul className="flex flex-col">
            {figure.lanes.map((lane, i) => (
              <li key={lane.label} className="h-16 border-t border-hairline">
                <Track lane={lane} id={`${id}-d${i}`} pct={pct} max={figure.max} />
              </li>
            ))}
          </ul>
          <Axis figure={figure} pct={pct} />
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6" aria-hidden="true">
            {figure.markers.map((m) => (
              <span key={m.label} className="absolute top-0 bottom-0 w-px bg-coral" style={{ left: `${pct(m.at)}%` }} />
            ))}
          </div>
        </div>
      </div>
      {/* Phones */}
      <div className="flex flex-col gap-3 sm:hidden">
        <ul className="flex flex-col gap-3">
          {figure.lanes.map((lane, i) => (
            <li key={lane.label} className="flex flex-col gap-1.5">
              <LaneLabel lane={lane} />
              <div className="h-6">
                <Track lane={lane} id={`${id}-p${i}`} pct={pct} max={figure.max} />
              </div>
            </li>
          ))}
        </ul>
        <Axis figure={figure} pct={pct} />
        <ul className="flex flex-col gap-1" aria-label="Markers">
          {figure.markers.map((m) => (
            <li key={m.label} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-600">
              <span className="h-3 w-px bg-coral" aria-hidden="true" />
              {unitWord(figure.unit)} {m.at}: {m.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-hairline pt-3">
        <Legend id={id} items={figure.legend} />
      </div>
      <FigureTable caption={title} columns={["Lane", `Start (${figure.unit})`, `End (${figure.unit})`, "Note"]} rows={[...figure.lanes.map((l) => [l.label, l.start, l.end, l.text ?? l.sub ?? ""]), ...figure.markers.map((m) => [m.label, m.at, m.at, "Marker"])]} />
      <span className="sr-only">{rows} lanes</span>
    </div>
  );
}

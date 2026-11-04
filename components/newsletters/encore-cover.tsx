import type { Route } from "next";
import Link from "next/link";
import { CATEGORY } from "@/lib/encore/categories";
import { fill } from "@/lib/issues/copy";
import { dateLong } from "@/lib/issues/render";
import { NEWSLETTERS_COPY as C } from "@/lib/newsletters/copy";
import type { EncoreLetterCard } from "@/lib/newsletters/encore";
import type { WeekDay } from "@/lib/newsletters/weeks";
import { cn } from "@/lib/utils";
import "./newsletters.css";

/**
 * Encore's word as the lockup sets it (components/brand/emblem.tsx): the
 * display serif, a little wide, turning to the family's gold along a
 * straight line through the lower part of the letters. Stretched to the
 * width it's given, like the Tide wordmark on Tide's covers.
 */
function EncoreWordmark({ id, className }: { id: string; className?: string }) {
  const text = (fill: string) => (
    <text x="230" y="104" textAnchor="middle" fontSize="132" textLength="449" lengthAdjust="spacingAndGlyphs" fill={fill} style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}>
      Encore
    </text>
  );
  return (
    <svg viewBox="0 0 460 124" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-gold`}>
          <rect x="0" y="74" width="460" height="50" />
        </clipPath>
      </defs>
      {text("currentColor")}
      <g clipPath={`url(#${id}-gold)`}>{text("var(--color-encore)")}</g>
    </svg>
  );
}

/** The drawing's box: seven columns of 100, the marks above the baseline, the dates under it. */
const W = 700;
const H = 250;
const BASE = 214;
const TOP = 6;

/**
 * The week, drawn: a column for each day, and in it one short stroke for
 * every dated performance on the calendar that day, earliest at the foot.
 * The issue's picks are lit in their category's light (lib/encore/categories.ts
 * `art`); the rest are faint. Every mark is a performance the issue counted.
 */
function WeekMarks({ days, className }: { days: WeekDay[]; className?: string }) {
  const most = Math.max(1, ...days.map((d) => d.marks.length));
  const step = Math.min(10, (BASE - TOP) / most);
  const thick = Math.max(1.2, step * 0.56);
  const rest: string[] = [];
  const lit = new Map<string, string[]>();
  days.forEach((d, i) => {
    const x0 = i * 100 + 16;
    d.marks.forEach((m, k) => {
      const y = (BASE - step * (k + 0.5)).toFixed(1);
      if (m.pick) {
        const art = CATEGORY[m.c].art;
        lit.set(art, [...(lit.get(art) ?? []), `M${x0 - 4} ${y}H${x0 + 72}`]);
      } else rest.push(`M${x0} ${y}H${x0 + 68}`);
    });
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        {rest.length ? <path d={rest.join("")} stroke="#fff" strokeOpacity={0.2} strokeWidth={thick} /> : null}
        {[...lit].map(([color, d]) => (
          <g key={color}>
            <path d={d.join("")} stroke={color} strokeOpacity={0.3} strokeWidth={thick * 2.6} />
            <path d={d.join("")} stroke={color} strokeWidth={thick * 1.15} />
          </g>
        ))}
        <path d={`M8 ${BASE + 8}H${W - 8}`} stroke="#fff" strokeOpacity={0.3} strokeWidth={1} />
      </g>
      {days.map((d, i) => (
        <text key={d.day} x={i * 100 + 50} y={H - 4} textAnchor="middle" fontSize="20" fill="#fff" fillOpacity={0.6} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
          {Number(d.day.slice(8, 10))}
        </text>
      ))}
    </svg>
  );
}

/**
 * An Encore issue's cover, in the grammar of Tide's (components/tide/tide-cover.tsx):
 * the team and the date on the top line, the wordmark with "Arts Calendar"
 * under it, then the week drawn from the calendar, and at the foot the
 * issue's own title, what it holds and the three places. Drawn in code on
 * the family's deep ground, never a photograph. Type is sized to the
 * cover's width, so the same cover works as a tile and beside the issue.
 */
export function EncoreCover({ card, className }: { card: EncoreLetterCard; className?: string }) {
  return (
    <div className={cn("encore-cover-ground @container relative aspect-[4/5] overflow-hidden text-white", className)}>
      <div className="relative flex h-full flex-col justify-between px-[7cqw] pb-[6cqw] pt-[6.2cqw]">
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-4 font-sans text-[max(8.5px,1.9cqw)] font-medium uppercase tracking-[0.22em] text-linen-100">
            <span>JJ Premier Group</span>
            <span>{dateLong(card.monday)}</span>
          </div>
          <span className="mt-[3cqw] block h-px bg-white/35" aria-hidden="true" />
          <EncoreWordmark id={`ew-${card.monday}`} className="mt-[1.4cqw] w-full text-white" />
          <p className="-mt-[0.4cqw] font-display text-[4.4cqw] font-light italic leading-none text-linen-200">{C.coverWordmark}</p>
        </div>
        <WeekMarks days={card.days} className="card-img mx-auto mt-[4cqw] w-full" />
        <div className="flex flex-col">
          <span className="mb-[3.4cqw] mt-[4cqw] block h-[max(2px,0.38cqw)] w-[8cqw] bg-encore" aria-hidden="true" />
          <p className="max-w-[24ch] text-balance font-display text-[7.4cqw] font-light leading-[1.06] text-white">{card.title}</p>
          <p className="mt-[2.4cqw] font-sans text-[max(10px,2.7cqw)] leading-[1.42] text-linen-100/95">{encoreCardData(card)}</p>
          <span className="mt-[3.4cqw] block h-px bg-white/35" aria-hidden="true" />
          <p className="mt-[2.6cqw] font-sans text-[max(8px,1.75cqw)] font-medium uppercase tracking-[0.2em] text-linen-100/90">{C.coverPlaces}</p>
        </div>
      </div>
    </div>
  );
}

/** "12 picks from 214 performances", or what an empty week holds. */
export function encoreCardData(card: Pick<EncoreLetterCard, "picks" | "performances">): string {
  return card.picks ? fill(C.cardData, { picks: card.picks, performances: new Intl.NumberFormat("en-US").format(card.performances) }) : C.cardDataEmpty;
}

/** One Monday issue on /newsletters: its cover, then the week and what it holds. */
export function EncoreLetterTile({ card }: { card: EncoreLetterCard }) {
  const title = fill(C.cardTitle, { range: card.range });
  const data = encoreCardData(card);
  return (
    <Link href={card.href as Route} aria-label={`${title}: ${data}`} className="card group flex w-full flex-col gap-4">
      <EncoreCover card={card} />
      <div className="flex flex-col gap-1">
        <h3 className="t-h3 text-navy transition-colors group-hover:text-harbor-700">{title}</h3>
        <p className="t-small text-body-muted">{data}</p>
      </div>
    </Link>
  );
}

import type { Stat } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** The row of numbers. Mono, tabular, with the source underneath when there is one. */
export function StatBand({ stats, tone = "light", className }: { stats: Stat[]; tone?: "light" | "dark"; className?: string }) {
  const value = tone === "dark" ? "text-white" : "text-navy";
  const label = tone === "dark" ? "text-mist" : "text-linen-700";
  const source = tone === "dark" ? "text-sky-100/70" : "text-graphite-400";
  return (
    <dl className={cn("grid grid-cols-2 gap-x-8 gap-y-8 md:flex md:flex-wrap md:gap-x-16", className)}>
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <dd className={cn("t-stat order-1", value)}>{s.value}</dd>
          <dt className={cn("t-label order-2", label)}>{s.label}</dt>
          {s.source ? <dd className={cn("order-3 font-mono text-[10px] tracking-[0.06em]", source)}>{s.source}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

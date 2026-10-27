import Link from "next/link";
import { Photo } from "@/components/photo";
import { FAMILIES, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";

/**
 * A tool as a cover, a sister to Tide's and the guides': the page's own
 * photograph under a navy wash, the family on the top line, the product's
 * name at the foot in the serif, and a sky rule that runs the width on
 * hover. What it does sits under the cover. Type is sized to the card.
 */
export function ToolCard({ tool, sizes, className }: { tool: Tool; sizes: string; className?: string }) {
  const family = FAMILIES[tool.family];
  return (
    <Link href={tool.href} className={cn("card group flex w-full flex-col gap-4", className)}>
      <div className="@container relative aspect-[5/4] overflow-hidden bg-navy">
        <Photo image={tool.image} sizes={sizes} className="card-img" />
        <div className="absolute inset-0 bg-linear-to-b from-harbor-950/70 via-harbor-950/10 to-harbor-950/85" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-[6cqw]">
          <div className="flex items-baseline justify-between gap-4 font-mono text-[3cqw] uppercase tracking-[0.18em] text-linen-100">
            <span>{family.name}</span>
            <span className="text-right">JJ Premier Group</span>
          </div>
          <div className="flex flex-col gap-[3cqw]">
            <p className="text-balance font-display text-[10cqw] font-light leading-[1.02] text-white text-shadow-photo">{tool.name}</p>
            <span className="block h-[2px] w-[18%] bg-sky-300 transition-[width] duration-(--dur-card) group-hover:w-full" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="t-body max-w-[46ch] text-body">{tool.line}</p>
        <span className="t-label inline-flex items-center gap-2 text-navy">
          Open {tool.name}
          <span className="btn-dash" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

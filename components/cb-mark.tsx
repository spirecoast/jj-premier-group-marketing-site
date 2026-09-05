import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Coldwell Banker co-brand mark. Runs at equal-or-larger measure to the
 * JJ lockup, CB Blue on light grounds and white on dark, with no wording.
 * Below 200px wide the mark comes off the piece rather than shrinking, so
 * callers hide it on narrow screens instead of scaling it down.
 */
export function CbMark({
  tone = "cbblue",
  width = 220,
  className,
}: {
  tone?: "cbblue" | "white" | "navy" | "cream";
  width?: number;
  className?: string;
}) {
  const height = Math.round((width / 7.303) * 10) / 10;
  return (
    <Image
      src={`/brand/cb/coldwell-banker-horz-${tone}.svg`}
      alt="Coldwell Banker"
      width={width}
      height={height}
      className={cn("block", className)}
      style={{ width, height }}
    />
  );
}

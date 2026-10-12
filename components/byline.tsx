import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

/**
 * Who wrote it: the authors' photographs overlapping in small circles, their
 * names, and any facts after them ("JJ Premier Group", "9 min read").
 */
export function Byline({
  people,
  extras = [],
  tone = "light",
  size = "md",
  className,
}: {
  people: { name: string; headshot: ImageRef }[];
  extras?: string[];
  tone?: "light" | "dark";
  /** sm: the small mark a product's masthead carries. */
  size?: "sm" | "md";
  className?: string;
}) {
  const names = people.map((p) => p.name);
  const by = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-3" : "gap-3.5", className)}>
      <span className="flex shrink-0">
        {people.map((p, i) => (
          <span
            key={p.name}
            className={cn("relative overflow-hidden rounded-full ring-2", size === "sm" ? "size-9" : "size-11", tone === "dark" ? "ring-white/70" : "ring-paper", i > 0 && (size === "sm" ? "-ml-2.5" : "-ml-3"))}
          >
            <Photo image={{ ...p.headshot, position: "50% 22%" }} sizes="88px" />
          </span>
        ))}
      </span>
      <span className={cn("flex flex-col gap-0.5 leading-snug", size === "sm" ? "text-[13px]" : "text-[14px]", tone === "dark" ? "text-linen-100" : "text-body")}>
        <span className={tone === "dark" ? "text-white" : "text-navy"}>By {by}</span>
        {extras.length ? <span className={tone === "dark" ? "text-linen-200/85" : "text-graphite-500"}>{extras.join(" · ")}</span> : null}
      </span>
    </div>
  );
}

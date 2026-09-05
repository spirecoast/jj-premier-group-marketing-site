import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Chip = { href: string; label: string; active?: boolean };

/** Harbor 100 chips; the active one is navy. */
export function FilterChips({ chips, className, label }: { chips: Chip[]; className?: string; label: string }) {
  return (
    <nav aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((c) => (
        <Link key={c.href + c.label} href={c.href as Route} className="chip" data-active={c.active ? "true" : undefined} aria-current={c.active ? "true" : undefined}>
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

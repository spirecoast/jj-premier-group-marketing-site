import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { ToolCard } from "@/components/tools/tool-card";
import { FEATURED, tool } from "@/lib/tools";

/** Four of the tools, one for each step from choosing a place to selling, and the way to the rest. */
export function ToolsStrip() {
  return (
    <section className="bg-parchment" aria-labelledby="tools-strip-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <SectionHeading
          size="display"
          className="sr"
          title={<span id="tools-strip-title">Free tools</span>}
          aside={
            <div className="flex flex-col items-start gap-3">
              <p className="t-body max-w-[420px] text-body">Find a neighborhood, plan the move, see what’s on and know what you’d keep if you sold. No sign-up.</p>
              <Link href="/tools" className="link-rule">
                See all eight tools
              </Link>
            </div>
          }
        />
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((id, i) => (
            <li key={id} className="sr flex" style={{ ["--sr-i" as string]: i }}>
              <ToolCard tool={tool(id)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

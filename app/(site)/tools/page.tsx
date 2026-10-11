import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { ToolCard } from "@/components/tools/tool-card";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { FAMILIES, FAMILY_ORDER, TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Free tools for Lakewood Ranch, Sarasota and Bradenton",
  description:
    "Find the neighborhoods that fit, plan your move, see what's on any day, look up what sold on your street and work out what you'd keep after selling. Free, with no sign-up.",
  path: "/tools",
});

/** Every tool, by family: Atlas for where to live, Encore for what's on, Tide for the market. */
export default function ToolsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ])}
      />
      <Masthead route="/tools" title="Free tools" titleId="tools-title">
        <p className="rise d3 t-lead max-w-[600px] text-linen-100 text-shadow-soft">
          Find the neighborhoods that fit, plan the move, see what’s on and know what homes are selling for. No sign-up.
        </p>
      </Masthead>

      {FAMILY_ORDER.map((f, i) => {
        const family = FAMILIES[f];
        const tools = TOOLS.filter((t) => t.family === f);
        return (
          <section key={f} id={f} className={cn("scroll-mt-header", i % 2 === 1 && "bg-parchment")} aria-labelledby={`tools-${f}-title`}>
            <div className="container-site flex flex-col gap-12 py-section">
              <div className="sr grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
                <h2 id={`tools-${f}-title`} className="flex flex-col gap-2 text-navy">
                  <span className="font-display text-[clamp(3rem,6vw,5rem)] font-light leading-none">{family.name}</span>
                  <span className="t-h2">{family.title}</span>
                </h2>
                <p className="t-body max-w-[520px] text-body">{family.line}</p>
              </div>
              <ul className={cn("grid gap-x-6 gap-y-12 sm:grid-cols-2", tools.length === 3 ? "lg:grid-cols-3" : "lg:max-w-[66%]")}>
                {tools.map((t, j) => (
                  <li key={t.id} className="sr flex" style={{ ["--sr-i" as string]: j }}>
                    <ToolCard tool={t} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </>
  );
}

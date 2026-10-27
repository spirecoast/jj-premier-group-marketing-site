import type { Metadata } from "next";
import Link from "next/link";
import { ProductLockup } from "@/components/brand/emblem";
import { JsonLd } from "@/components/json-ld";
import { Masthead } from "@/components/masthead";
import { Photo } from "@/components/photo";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { FAMILIES, FAMILY_ORDER, IMAGES, TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Atlas, Encore and Tide: free local tools",
  description:
    "Atlas finds the neighborhoods that fit and plans your move. Encore lists the theater, music and art. Tide shows what homes sold for. Free, with no sign-up.",
  path: "/tools",
});

/**
 * Atlas, Encore and Tide, featured. Under the masthead the three sit on
 * glass across its foot; then each family has a band of its own photograph
 * in its colour, with a glass panel that names it and lists its tools.
 */
export default function ToolsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Atlas, Encore and Tide", path: "/tools" },
        ])}
      />
      <Masthead route="/tools" title="Atlas, Encore and Tide" titleId="tools-title">
        <p className="rise d3 t-lead max-w-[620px] text-linen-100 text-shadow-soft">Find the neighborhood that fits, the theater, music and art around it, and what homes there are selling for. Free, with no sign-up.</p>
      </Masthead>

      {/* The three, on glass across the masthead's foot. */}
      <nav aria-label="The three" className="container-site relative z-10 -mt-8 sm:-mt-11 lg:-mt-12">
        <ul className="grid gap-3 sm:grid-cols-3">
          {FAMILY_ORDER.map((f) => {
            const family = FAMILIES[f];
            return (
              <li key={f}>
                <a href={`#${f}`} className="tools-chip group flex h-full items-center gap-4 p-5 text-white transition-transform duration-(--dur-panel) hover:-translate-y-0.5" data-family={f}>
                  <span className="flex min-w-0 flex-col gap-2.5">
                    <ProductLockup family={f} size="bar" byline={false} decorative />
                    <span className="t-small text-white/75">
                      <span className="sr-only">{family.name}: </span>
                      {family.title}
                    </span>
                  </span>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="ml-auto shrink-0 text-white/60 transition-transform duration-(--dur-panel) group-hover:translate-y-0.5">
                    <path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-6 pt-16 pb-section sm:gap-8 lg:pt-24">
        {FAMILY_ORDER.map((f, i) => {
          const family = FAMILIES[f];
          const tools = TOOLS.filter((t) => t.family === f);
          const right = i % 2 === 1;
          return (
            <section key={f} id={f} className="scroll-mt-header" aria-labelledby={`tools-${f}-title`}>
              <div className="relative grid grid-cols-1 overflow-hidden bg-navy">
                <div className="relative col-start-1 row-start-1 min-h-[280px] lg:min-h-[640px]">
                  <Photo image={IMAGES[f]!} sizes="100vw" />
                  <div className={cn(`masthead-tint-${f} absolute inset-0`, right && "-scale-x-100")} aria-hidden="true" />
                </div>
                <div className="container-site relative col-start-1 row-start-1 flex items-end py-6 sm:py-12 lg:items-center lg:py-16">
                  <div className={cn("tools-panel w-full max-w-[600px] p-6 text-white sm:p-10", right && "lg:ml-auto")} data-family={f}>
                    <span className="pointer-events-none absolute inset-2.5 border border-white/20" aria-hidden="true" />
                    <div className="relative flex flex-col gap-6">
                      <h2 id={`tools-${f}-title`} className="flex flex-col gap-4">
                        <span className="sr-only">{family.name}: </span>
                        <ProductLockup family={f} size="md" decorative />
                        <span className="t-h3 text-white/85">{family.title}</span>
                      </h2>
                      <p className="t-body max-w-[460px] text-white/80">{family.line}</p>
                      <ul className="flex flex-col border-t border-white/15">
                        {tools.map((t) => (
                          <li key={t.id} className="border-b border-white/15">
                            <Link href={t.href} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 py-4 transition-colors hover:bg-white/[0.04]">
                              <span className="font-display text-[22px] font-light leading-tight text-white">{t.name}</span>
                              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="row-span-2 shrink-0 transition-transform duration-(--dur-panel) group-hover:translate-x-1" style={{ color: `var(--color-${f})` }}>
                                <path d="M3 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                              <span className="t-small max-w-[44ch] text-white/70">{t.line}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

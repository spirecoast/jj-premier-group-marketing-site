import Link from "next/link";
import { Photo } from "@/components/photo";
import type { ImageRef, TeamMember } from "@/lib/content/types";
import { site } from "@/lib/site";

/**
 * 01 · The hero. The photograph is the layout: type sits in the calm third of
 * the frame. Rise, draw and fade are each used once here and nowhere else on
 * the page. Below `lg` the photograph sits above the headline, as the mobile
 * design specifies. Nothing here is a figure: the listing card and the ticker
 * return with a data feed.
 */
export function Hero({ image, cameo, team }: { image: ImageRef; cameo: ImageRef; team: TeamMember[] }) {
  const names = team.map((m) => m.name).join(" & ");

  return (
    <section className="-mt-header bg-linen-200 lg:px-gutter" aria-labelledby="hero-title">
      <div className="relative overflow-hidden bg-linen-200 lg:h-[780px] lg:bg-navy">
        {/* Photograph */}
        <div className="relative aspect-[4/5] bg-navy sm:aspect-[16/10] lg:absolute lg:inset-0 lg:aspect-auto">
          <Photo image={image} priority sizes="(min-width: 1024px) 1248px, 100vw" className="hero-img" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-veil" aria-hidden="true" />

          {/* Cameo */}
          <div className="rise d2 absolute left-6 top-header flex items-center gap-4 pt-6 lg:left-14 lg:pt-7">
            <div className="cameo-orbit relative flex h-20 w-20 shrink-0 items-center justify-center lg:h-[88px] lg:w-[88px]" aria-hidden="true">
              <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-[0_0_0_2px_rgb(230_221_209/0.9),0_10px_30px_rgb(20_37_48/0.45)] lg:h-[72px] lg:w-[72px]">
                <Photo image={cameo} sizes="72px" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] font-medium text-white text-shadow-photo">{names}</p>
              <p className="font-mono text-[10px] tracking-[0.12em] text-mist">
                REALTORS® · {site.brokerage.toUpperCase().replace(" REALTY", "")}
              </p>
            </div>
          </div>

          {/* Scroll cue: desktop furniture */}
          <div
            className="scroll-cue absolute bottom-[22px] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-linen-200 text-shadow-photo lg:flex"
            aria-hidden="true"
          >
            <span>SCROLL</span>
            <span className="h-[26px] w-px bg-sky-300" />
          </div>
        </div>

        {/* Headline block */}
        <div className="relative flex flex-col gap-6 px-6 pb-12 pt-8 text-navy sm:px-10 lg:absolute lg:bottom-16 lg:left-14 lg:w-[760px] lg:p-0 lg:text-white">
          <p className="rise d1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-harbor-700 lg:text-mist lg:text-shadow-photo">
            {site.region}
          </p>
          <h1 id="hero-title" className="t-hero lg:text-shadow-photo">
            <span className="hero-line l1">
              <span>Your next home</span>
            </span>
            <span className="hero-line l2">
              <span>is on this coast.</span>
            </span>
          </h1>
          <span className="draw block h-px w-[120px] bg-navy lg:bg-sky-300" aria-hidden="true" />
          <p className="rise d3 max-w-[520px] text-[17px] font-medium leading-[1.6] text-body lg:text-white lg:text-shadow-soft">
            Tell us where you are in the move, and we will walk you through every step from here, at your
            pace and in plain language.
          </p>
          <div className="rise d4 flex flex-wrap gap-3.5">
            <Link
              href="/listings"
              className="btn border-navy bg-navy text-linen-200 hover:bg-harbor-800 lg:border-linen-200 lg:bg-linen-200 lg:text-navy lg:hover:border-linen-100 lg:hover:bg-linen-100"
            >
              Find your home
              <span className="btn-dash" aria-hidden="true" />
            </Link>
            <Link
              href="/valuation"
              className="btn border-navy bg-transparent text-navy hover:bg-navy hover:text-linen-200 lg:border-linen-200/60 lg:text-linen-200 lg:hover:border-linen-200 lg:hover:bg-linen-200/10 lg:hover:text-linen-200"
            >
              What is my home worth
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

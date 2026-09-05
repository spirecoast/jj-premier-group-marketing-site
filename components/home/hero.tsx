import Link from "next/link";
import { Photo } from "@/components/photo";
import type { ImageRef, Listing, TeamMember } from "@/lib/content/types";
import { formatPriceShort } from "@/lib/content/format";
import { site } from "@/lib/site";

/**
 * 01 · The hero. The photograph is the layout: type sits in the calm third of
 * the frame. Rise, draw and fade are each used once here and nowhere else on
 * the page. Below `lg` the photograph sits above the headline, as the mobile
 * design specifies.
 */
export function Hero({
  image,
  cameo,
  team,
  listings,
  listingCount,
}: {
  image: ImageRef;
  cameo: ImageRef;
  team: TeamMember[];
  listings: Listing[];
  listingCount: number;
}) {
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
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-[0_0_0_2px_rgb(230_221_209/0.9),0_10px_30px_rgb(20_37_48/0.45)] lg:h-[72px] lg:w-[72px]">
              <Photo image={cameo} sizes="72px" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] font-medium text-white text-shadow-photo">{names}</p>
              <p className="font-mono text-[10px] tracking-[0.12em] text-mist">
                REALTORS® · {site.brokerage.toUpperCase().replace(" REALTY", "")}
              </p>
            </div>
          </div>

          {/* Section ring and scroll cue: desktop furniture */}
          <div
            className="hero-ring fade absolute right-14 top-[110px] hidden h-[92px] w-[92px] items-center justify-center rounded-full border border-linen-200/35 lg:flex"
            aria-hidden="true"
          >
            <p className="text-center font-mono text-[9px] leading-[1.6] tracking-[0.16em] text-linen-200">
              01
              <br />/ 07
            </p>
          </div>
          <div
            className="scroll-cue absolute bottom-[22px] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-linen-200 lg:flex"
            aria-hidden="true"
          >
            <span>SCROLL</span>
            <span className="h-[26px] w-px bg-sky-300" />
          </div>
        </div>

        {/* Headline block */}
        <div className="relative flex flex-col gap-6 px-6 pb-10 pt-8 text-navy sm:px-10 lg:absolute lg:bottom-16 lg:left-14 lg:w-[720px] lg:p-0 lg:text-white">
          <p className="rise d1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-harbor-700 lg:text-mist lg:text-shadow-photo">
            {site.region}
          </p>
          <h1 id="hero-title" className="t-hero lg:text-shadow-photo">
            <span className="hero-line l1">
              <span>A move is rarely</span>
            </span>
            <span className="hero-line l2">
              <span>just a move.</span>
            </span>
          </h1>
          <span className="wipe block h-px w-[120px] bg-sky-300" aria-hidden="true" />
          <p className="rise d3 t-lead max-w-[520px] lg:text-shadow-photo">
            Two agents, one file, and the whole coast between Tampa and Venice. Tell us the timing and
            we will tell you the truth about it.
          </p>
          <div className="rise d4 flex flex-wrap gap-3.5">
            <Link
              href="/listings"
              className="btn border-navy bg-navy text-linen-200 hover:bg-harbor-800 lg:border-linen-200 lg:bg-linen-200 lg:text-navy lg:hover:border-linen-100 lg:hover:bg-linen-100"
            >
              Search homes
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

        {/* On the market card */}
        <div className="rise d5 mx-6 mb-8 flex flex-col gap-3.5 border border-hairline bg-paper/97 p-6 text-navy backdrop-blur-md sm:mx-10 lg:absolute lg:bottom-16 lg:right-14 lg:m-0 lg:w-[300px] lg:border-0 lg:px-[26px] lg:shadow-[0_24px_60px_rgb(10_20_28/0.35)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-linen-700">
            On the market · {listingCount} active
          </p>
          <ul className="flex flex-col">
            {listings.slice(0, 3).map((l, i) => (
              <li key={l.slug} className={i > 0 ? "border-t border-hairline" : undefined}>
                <Link href={`/listings/${l.slug}`} className="flex items-baseline justify-between gap-3 py-2.5 transition-colors hover:text-harbor-700">
                  <span className="font-display text-[19px] font-light leading-tight">{l.title}</span>
                  <span className="shrink-0 font-mono text-[12px] font-medium">{formatPriceShort(l.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/listings" className="t-label -my-2 inline-flex min-h-10 items-center text-harbor-700 transition-colors hover:text-navy">
            All {listingCount} listings <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

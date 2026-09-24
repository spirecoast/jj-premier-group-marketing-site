import { MARKETS } from "@/lib/content/markets";
import { PRICE_OPTIONS } from "@/lib/content/filters";
import type { ImageRef } from "@/lib/content/types";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";

/** 04 · Find your home. Two questions, and the homes worth seeing come to you. */
export function FindHome({ image }: { image: ImageRef }) {
  return (
    <section className="container-site grid items-center gap-12 pb-section pt-4 lg:grid-cols-2 lg:gap-20 lg:pt-8" aria-labelledby="find-title">
      <div className="flex flex-col gap-7">
        <SectionHeading
          number="05"
          eyebrow="Find your home"
          size="display"
          title={
            <span id="find-title">
              Tell us what you&rsquo;re looking for.
              <br className="hidden sm:block" /> We&rsquo;ll bring you the ones worth seeing.
            </span>
          }
        />
        <p className="t-body max-w-[480px] text-body">
          Start with the place and the budget. We&rsquo;ll send you the homes that fit, and we&rsquo;ll tell you which
          ones we&rsquo;d actually go and see with you.
        </p>
        <form action="/listings" method="get" className="grid gap-5 border border-hairline bg-white p-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:items-end">
          <div className="field min-w-0">
            <label htmlFor="home-search-market" className="field-label">
              Where
            </label>
            <select id="home-search-market" name="market" defaultValue="lakewood-ranch" className="field-input">
              {MARKETS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}, FL
                </option>
              ))}
              <option value="">Anywhere on the coast</option>
            </select>
          </div>
          <div className="field min-w-0">
            <label htmlFor="home-search-max" className="field-label">
              Up to
            </label>
            <select id="home-search-max" name="max" defaultValue="1500000" className="field-input">
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="">No limit</option>
            </select>
          </div>
          <button type="submit" className="btn btn-navy justify-self-start sm:col-span-2">
            Start my search
            <span className="btn-dash" aria-hidden="true" />
          </button>
        </form>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden bg-linen-100 lg:aspect-auto lg:h-[600px]">
        <Photo image={image} sizes="(min-width: 1024px) 600px, 100vw" />
      </div>
    </section>
  );
}

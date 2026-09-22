import { MARKETS } from "@/lib/content/markets";
import { PRICE_OPTIONS } from "@/lib/content/filters";
import type { ImageRef } from "@/lib/content/types";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";

/** 04 · Find your home. Two questions, and the homes worth seeing come to you. */
export function FindHome({ kitchen, second, caption }: { kitchen: ImageRef; second: ImageRef; caption: string }) {
  return (
    <section className="container-site grid items-center gap-12 py-section lg:grid-cols-2 lg:gap-20" aria-labelledby="find-title">
      <div className="flex flex-col gap-7">
        <SectionHeading
          number="04"
          eyebrow="Find your home"
          size="display"
          title={
            <span id="find-title">
              Tell us what you are looking for.
              <br className="hidden sm:block" /> We will bring you the ones worth seeing.
            </span>
          }
        />
        <p className="t-body max-w-[480px] text-body">
          Start with the place and the budget. We will send you the homes that fit, and we will say which
          ones we would actually go and see with you.
        </p>
        <form action="/listings" method="get" className="flex flex-col gap-5 border border-hairline bg-white p-6 sm:flex-row sm:items-end">
          <div className="field flex-1">
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
          <div className="field sm:w-[140px]">
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
          <button type="submit" className="btn btn-navy">
            Start my search
            <span className="btn-dash" aria-hidden="true" />
          </button>
        </form>
      </div>

      <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[620px]">
        <div className="absolute left-0 top-0 h-[78%] w-[78%] overflow-hidden bg-linen-100">
          <Photo image={kitchen} sizes="(min-width: 1024px) 480px, 78vw" />
        </div>
        <div className="absolute bottom-0 right-0 h-[52%] w-[46%] border-[12px] border-paper bg-linen-100">
          <div className="relative h-full w-full overflow-hidden">
            <Photo image={second} sizes="(min-width: 1024px) 280px, 46vw" />
          </div>
        </div>
        <p className="absolute bottom-[30px] left-0 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-linen-700 lg:block">
          {caption}
        </p>
      </div>
    </section>
  );
}

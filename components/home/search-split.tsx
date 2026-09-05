import { MARKETS } from "@/lib/content/markets";
import { PRICE_OPTIONS } from "@/lib/content/filters";
import type { ImageRef } from "@/lib/content/types";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";

/** 02 · The search. Underline fields; the focused field turns Sky 700. */
export function SearchSplit({ kitchen, bath, caption }: { kitchen: ImageRef; bath: ImageRef; caption: string }) {
  return (
    <section className="container-site grid items-center gap-12 py-section lg:grid-cols-2 lg:gap-20 lg:pb-[100px]">
      <div className="flex flex-col gap-7">
        <SectionHeading
          number="02"
          eyebrow="The search"
          size="display"
          title={
            <>
              Start with the street,
              <br className="hidden sm:block" /> not the square footage.
            </>
          }
        />
        <p className="t-body max-w-[480px] text-body">
          Every listing between Tampa and Venice, searchable by the things that actually matter: the
          flood zone, the school walk, what the last three sold for.
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
          <div className="field sm:w-[120px]">
            <label htmlFor="home-search-max" className="field-label">
              Max
            </label>
            <select id="home-search-max" name="max" defaultValue="1500000" className="field-input">
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="">No max</option>
            </select>
          </div>
          <button type="submit" className="btn btn-navy">
            Search
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
            <Photo image={bath} sizes="(min-width: 1024px) 280px, 46vw" />
          </div>
        </div>
        <p className="absolute bottom-[30px] left-0 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-linen-700 lg:block">
          {caption}
        </p>
      </div>
    </section>
  );
}

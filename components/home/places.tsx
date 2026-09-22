import Link from "next/link";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { MARKETS } from "@/lib/content/markets";

/**
 * 03 · Three places. One tall photograph per place, the name set large, and
 * the paragraph that says what living there is like. Figures arrive with the
 * data feed; until then the photograph and the words carry it.
 */
export function Places() {
  return (
    <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="places-title">
      <SectionHeading
        number="03"
        eyebrow="Three places we know by heart"
        size="display"
        title={<span id="places-title">Lakewood Ranch, Sarasota and Bradenton. Pick the one that feels like you.</span>}
        titleClassName="max-w-[860px]"
        aside={
          <p className="t-small max-w-[300px] text-body-muted md:text-right">
            Each one has its own pace, its own water and its own kind of street. We can help you tell them apart.
          </p>
        }
      />
      <ul className="grid gap-5 md:grid-cols-3">
        {MARKETS.map((m, i) => (
          <li key={m.slug} className="flex">
            <Link
              href={`/neighborhoods?market=${m.slug}`}
              className="place-card group relative flex w-full flex-col justify-end overflow-hidden bg-navy text-white"
              style={{ minHeight: i === 1 ? "580px" : "520px" }}
            >
              <div className="absolute inset-0">
                <Photo image={m.image} sizes="(min-width: 768px) 33vw, 100vw" className="place-img" />
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-harbor-950/85 via-harbor-950/25 to-transparent" aria-hidden="true" />
              <div className="relative flex flex-col gap-3 p-7 lg:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">{m.county}</p>
                <h3 className="font-display text-[clamp(2rem,3.2vw,2.75rem)] font-light leading-[1.02] text-white text-shadow-photo">
                  {m.name}
                </h3>
                <p className="place-blurb max-w-[36ch] text-[14px] leading-[1.6] text-linen-200/95 text-shadow-soft">
                  {m.blurb}
                </p>
                <span className="t-label mt-2 inline-flex items-center gap-2 text-mist">
                  Explore the neighborhoods <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

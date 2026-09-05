import Link from "next/link";
import { Photo } from "@/components/photo";
import { MARKETS } from "@/lib/content/markets";
import type { ImageRef } from "@/lib/content/types";

/** 04 · Four markets. The Skyway at sunrise, and the coast laid out beneath it. */
export function FourMarkets({ image }: { image: ImageRef }) {
  return (
    <section className="relative overflow-hidden bg-navy lg:h-[720px]" aria-labelledby="four-markets-title">
      <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
        <Photo image={image} sizes="100vw" />
        <div className="absolute inset-0 bg-linear-to-b from-harbor-950/10 via-harbor-950/5 via-36% to-harbor-950/80" aria-hidden="true" />
        <div className="absolute left-gutter top-10 flex max-w-[calc(100%-2*var(--gutter))] flex-col gap-4 border-l-2 border-navy bg-linen-200/85 p-6 backdrop-blur-md sm:p-8 lg:top-[88px] lg:max-w-[720px]">
          <p className="t-eyebrow text-amber">04 · Four markets</p>
          <h2 id="four-markets-title" className="t-display text-navy">
            The coast, from the Skyway to Venice.
          </h2>
        </div>
      </div>
      <div className="lg:absolute lg:inset-x-0 lg:bottom-0">
      <div className="container-site grid grid-cols-2 border-t border-white/35 bg-linear-to-t from-harbor-950/55 to-transparent lg:grid-cols-4">
        {MARKETS.map((m, i) => (
          <Link
            key={m.slug}
            href={`/neighborhoods?market=${m.slug}`}
            className={`card group flex flex-col gap-3.5 py-6 text-white ${i === 1 || i === 3 ? "border-l border-white/30 pl-4 lg:pl-[26px]" : ""} ${i === 2 ? "lg:border-l lg:border-white/30 lg:pl-[26px]" : ""}`}
          >
            <div className="relative h-24 overflow-hidden bg-navy lg:h-32">
              <Photo image={m.image} sizes="(min-width: 1024px) 280px, 50vw" className="card-img" />
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-[clamp(1.25rem,1.8vw,1.625rem)] font-normal text-white text-shadow-soft">{m.name}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-[11px] text-mist" title={m.statSource}>
                ${m.pricePerSf} / SF
              </span>
            </div>
            <span className="card-line bg-mist" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <p className="container-site bg-navy py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-sky-100/70 lg:bg-transparent lg:pb-3 lg:pt-0 lg:text-right">
        {MARKETS[0]?.statSource}
      </p>
      </div>
    </section>
  );
}

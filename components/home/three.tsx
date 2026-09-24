import type { Route } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { products, site } from "@/lib/site";

export type ThreeFacts = {
  atlas: { places: number; areas: number; points: [number, number][] };
  encore: { tonight: number; weekend: number; weekendLabel: string; titles: string[] };
  tide: { nextMonth: string; guides: { title: string; slug: string }[] };
};

/** The Suncoast bbox, projected into a small box the way the share images do it. */
function Constellation({ points }: { points: [number, number][] }) {
  const W = 320;
  const H = 300;
  const bbox = { w: -82.79, e: -82.24, s: 27.16, n: 27.68 };
  const cosLat = Math.cos((27.42 * Math.PI) / 180);
  const spanX = (bbox.e - bbox.w) * cosLat;
  const spanY = bbox.n - bbox.s;
  const scale = Math.min((W - 16) / spanX, (H - 16) / spanY);
  const ox = (W - spanX * scale) / 2;
  const oy = (H - spanY * scale) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[320px]" aria-hidden="true">
      {points.map(([lng, lat], i) => (
        <circle key={i} cx={(ox + (lng - bbox.w) * cosLat * scale).toFixed(1)} cy={(oy + (bbox.n - lat) * scale).toFixed(1)} r="1.4" fill="var(--color-navy)" fillOpacity="0.45" />
      ))}
    </svg>
  );
}

/**
 * 04 · The three. Atlas, Encore and Tide as one family: the name set large,
 * what it is in a line, and a live fact from each so the panel is never
 * decorative. Nothing here is typed by hand; every number comes from the
 * data behind the product.
 */
export function Three({ facts }: { facts: ThreeFacts }) {
  const [atlas, encore, tide] = products;
  return (
    <section className="bg-linen-100" aria-labelledby="three-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <SectionHeading
          number="04"
          eyebrow="Three things we built for you"
          size="display"
          title={<span id="three-title">Atlas, Encore and Tide. The map, the nights out, and the market, kept current.</span>}
          titleClassName="max-w-[900px]"
        />
        <ul className="grid gap-5 lg:grid-cols-3">
          <li className="flex">
            <Panel product={atlas} cta="Open Atlas">
              <Constellation points={facts.atlas.points} />
              <p className="t-record text-graphite-600">
                {facts.atlas.places.toLocaleString()} places · {facts.atlas.areas} areas · one map
              </p>
            </Panel>
          </li>
          <li className="flex">
            <Panel product={encore} cta="Open Encore">
              <div className="flex gap-8">
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[3rem] font-light leading-none text-navy">{facts.encore.tonight}</span>
                  <span className="t-mono-sm text-graphite-500">tonight</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[3rem] font-light leading-none text-navy">{facts.encore.weekend}</span>
                  <span className="t-mono-sm text-graphite-500">{facts.encore.weekendLabel}</span>
                </div>
              </div>
              {facts.encore.titles.length ? (
                <ul className="flex flex-col gap-1.5 border-t border-hairline pt-4">
                  {facts.encore.titles.map((t) => (
                    <li key={t} className="t-small truncate text-body">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </li>
          <li className="flex">
            <Panel product={tide} cta="Read Tide">
              <div className="flex flex-col gap-1">
                <span className="font-display text-[2.25rem] font-light leading-none text-navy">{facts.tide.nextMonth}</span>
                <span className="t-mono-sm text-graphite-500">the next report lands</span>
              </div>
              {facts.tide.guides.length ? (
                <ul className="flex flex-col gap-1.5 border-t border-hairline pt-4">
                  {facts.tide.guides.map((g) => (
                    <li key={g.slug} className="t-small truncate text-body">
                      {g.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </li>
        </ul>
        <p className="t-mono-sm text-graphite-500">
          One email, if you want it: {site.calendarShort} every Monday, {site.reportName} once a quarter. The boxes are further down.
        </p>
      </div>
    </section>
  );
}

function Panel({ product, cta, children }: { product: (typeof products)[number]; cta: string; children: React.ReactNode }) {
  return (
    <Link
      href={product.href as Route}
      className="card group flex w-full flex-col gap-5 border border-hairline bg-white p-7 transition-colors hover:border-deep-harbor"
      style={{ borderTopWidth: 3, borderTopColor: product.accent }}
    >
      <div className="flex flex-col gap-2">
        <p className="t-mono-sm text-graphite-500">{product.tag}</p>
        <h3 className="font-display text-[clamp(2.5rem,4vw,3.5rem)] font-light leading-none text-navy">{product.name}</h3>
        <p className="t-body max-w-[36ch] text-body">{product.line}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      <span className="link-rule mt-auto self-start">{cta}</span>
    </Link>
  );
}

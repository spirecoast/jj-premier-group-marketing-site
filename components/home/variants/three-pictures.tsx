import type { Route } from "next";
import Link from "next/link";
import { AtlasCard } from "@/components/art/atlas-art";
import { EncoreCard } from "@/components/art/encore-art";
import { TideCard } from "@/components/art/tide-art";
import { SectionHeading } from "@/components/section-heading";
import { products } from "@/lib/site";
import type { ThreeFacts } from "../three-facts";

/**
 * "Pictures": the three on parchment, each card opening with a portrait
 * drawn from its own data on the server (components/art), so nothing here
 * needs a license or a hand-typed figure. Atlas is every place in the index
 * as a point of light, a star chart of the coast; Encore is the season as a
 * clock, every performance a stroke at its day; Tide is a ridgeline of the
 * market's sale prices, one ridge per month. All three sit on the same deep
 * ground with the same light. The heads are 3:2, and 2:1 at the tablet
 * where the cards stack full width. The names, lines, live facts and links
 * are the Wave 0 ones, untouched.
 */
export function ThreePictures({ facts }: { facts: ThreeFacts }) {
  const [atlas, encore, tide] = products;
  return (
    <section className="bg-parchment" aria-labelledby="three-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <SectionHeading
          number="05"
          eyebrow="Three things we built for you"
          size="display"
          title={<span id="three-title">Atlas is the map, Encore is the nights out and Tide is the market, and we keep all three current.</span>}
          titleClassName="max-w-[900px]"
        />
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          <li className="flex min-w-0">
            <Panel
              product={atlas}
              cta="Open Atlas"
              also={{ href: "/neighborhoods/match", label: "Answer ten questions" }}
              head={
                <Head>
                  <AtlasCard />
                </Head>
              }
            >
              <p className="t-record text-graphite-600">
                {facts.atlas.places.toLocaleString()} places · {facts.atlas.areas} areas · one map
              </p>
            </Panel>
          </li>
          <li className="flex min-w-0">
            <Panel
              product={encore}
              cta="Open Encore"
              also={{ href: "/calendar/plan", label: "Plan a visit" }}
              head={
                <Head>
                  <EncoreCard />
                </Head>
              }
            >
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
                <ul className="flex min-w-0 flex-col gap-1.5 border-t border-hairline pt-4">
                  {facts.encore.titles.map((t) => (
                    <li key={t} className="t-small min-w-0 truncate text-body">
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </li>
          <li className="flex min-w-0">
            <Panel
              product={tide}
              cta="Read Tide"
              head={
                <Head>
                  <TideCard />
                </Head>
              }
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-[2.25rem] font-light leading-none text-navy">{facts.tide.nextMonth}</span>
                <span className="t-mono-sm text-graphite-500">next issue</span>
              </div>
              {facts.tide.guides.length ? (
                <ul className="flex min-w-0 flex-col gap-1.5 border-t border-hairline pt-4">
                  {facts.tide.guides.map((g) => (
                    <li key={g.slug} className="t-small min-w-0 truncate text-body">
                      {g.title}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Panel>
          </li>
        </ul>
      </div>
    </section>
  );
}

/** The picture box every card opens with: the portraits' deep ground, 3:2, and 2:1 where the cards stack. */
function Head({ children }: { children: React.ReactNode }) {
  return (
    <div className="art-ground relative aspect-[3/2] overflow-hidden md:aspect-[2/1] lg:aspect-[3/2]" aria-hidden="true">
      {children}
    </div>
  );
}

/**
 * One product panel: its picture, the name and the main action both opening
 * the product, and an optional second link for someone who'd rather be
 * asked than handed a map or a calendar.
 */
function Panel({
  product,
  cta,
  also,
  head,
  children,
}: {
  product: (typeof products)[number];
  cta: string;
  also?: { href: Route; label: string };
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card flex w-full min-w-0 flex-col border border-hairline bg-white" style={{ borderTop: `3px solid ${product.accent}` }}>
      {head}
      <div className="flex flex-1 flex-col gap-5 p-7">
        <div className="flex flex-col gap-2">
          <p className="t-mono-sm text-graphite-500">{product.tag}</p>
          <h3 className="font-display text-[clamp(2.5rem,4vw,3.5rem)] font-light leading-none text-navy">
            <Link href={product.href as Route} className="transition-colors hover:text-harbor-700">
              {product.name}
            </Link>
          </h3>
          <p className="t-body max-w-[36ch] text-body">{product.line}</p>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-6 gap-y-3 pt-2">
          <Link href={product.href as Route} className="link-rule">
            {cta}
          </Link>
          {also ? (
            <Link href={also.href} className="link-rule">
              {also.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

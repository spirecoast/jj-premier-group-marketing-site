import type { Route } from "next";
import Link from "next/link";
import { KeyArt } from "@/components/key-art";
import { SectionHeading } from "@/components/section-heading";
import { products, site } from "@/lib/site";
import { Constellation } from "../constellation";
import type { ThreeFacts } from "../three-facts";

/**
 * "Pictures": the three on parchment, each card opening with its own
 * picture, drawn in code so nothing here needs a license or a hand-typed
 * figure. Atlas gets the constellation of every place on linen with a
 * graticule; Encore gets the calendar's own key art; Tide gets a newsletter
 * page drawn in hairlines under its masthead rule. The heads are 3:2, and
 * 2:1 at the tablet where the cards stack full width. The names, lines,
 * live facts and links are the Wave 0 ones, untouched.
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
          title={<span id="three-title">Atlas, Encore and Tide. The map, the nights out, and the market, kept current.</span>}
          titleClassName="max-w-[900px]"
        />
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[repeat(3,minmax(0,1fr))]">
          <li className="flex min-w-0">
            <Panel
              product={atlas}
              cta="Open Atlas"
              also={{ href: "/neighborhoods/match", label: "Answer ten questions" }}
              head={
                <div className="relative aspect-[3/2] overflow-hidden bg-linen-100 md:aspect-[2/1] lg:aspect-[3/2]">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-linen-300" aria-hidden="true" />
                  <span className="absolute inset-x-0 top-1/2 h-px bg-linen-300" aria-hidden="true" />
                  <Constellation points={facts.atlas.points} className="absolute inset-0 h-full w-full p-4" opacity={0.6} />
                </div>
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
                <div className="relative aspect-[3/2] overflow-hidden bg-linen-100 md:aspect-[2/1] lg:aspect-[3/2]" aria-hidden="true">
                  <KeyArt category="theater" seed="encore-home" ratio={3 / 2} />
                </div>
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
            <Panel product={tide} cta="Read Tide" head={<Masthead dateline={tide.long.split(" · ")[1] ?? tide.tag} />}>
              <div className="flex flex-col gap-1">
                <span className="font-display text-[2.25rem] font-light leading-none text-navy">{facts.tide.nextMonth}</span>
                <span className="t-mono-sm text-graphite-500">the next report lands</span>
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
        <p className="t-mono-sm text-graphite-500">
          One email, if you want it: {site.calendarShort} every Monday, {site.reportName} once a month. The boxes are further down.
        </p>
      </div>
    </section>
  );
}

/**
 * A newsletter page drawn in hairlines: the masthead rule, the dateline, and
 * three columns of text that fill the page whatever its height (the lines
 * are spread, not stacked). Widths are per cent of the column; 0 is the
 * headline bar that opens the first column.
 */
function Masthead({ dateline }: { dateline: string }) {
  const columns = [
    [0, 100, 94, 98, 90, 100, 96, 88, 100, 92, 97, 100, 90, 72],
    [100, 92, 100, 88, 96, 100, 84, 98, 100, 90, 95, 100, 86, 60],
    [96, 100, 90, 100, 94, 86, 100, 92, 98, 100, 88, 100, 94, 48],
  ];
  return (
    <div className="relative flex aspect-[3/2] flex-col gap-4 overflow-hidden bg-parchment p-6 md:aspect-[2/1] lg:aspect-[3/2]" aria-hidden="true">
      <div className="flex flex-col gap-1 border-t-2 border-navy pt-1">
        <div className="flex items-baseline justify-between border-t border-navy pt-2">
          <span className="t-mono-sm text-navy">{dateline}</span>
          <span className="t-mono-sm hidden text-graphite-500 sm:inline">once a month</span>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
        {columns.map((col, c) => (
          <div key={c} className="flex flex-col justify-between">
            {col.map((w, i) =>
              w === 0 ? <span key={i} className="h-[5px] w-4/5 bg-navy" /> : <span key={i} className="h-px bg-linen-500/70" style={{ width: `${w}%` }} />,
            )}
          </div>
        ))}
      </div>
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

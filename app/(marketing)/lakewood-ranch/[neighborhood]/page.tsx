import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NEIGHBORHOODS,
  neighborhoodBySlug,
  neighborhoodsByArea,
} from "@/lib/neighborhoods";

export function generateStaticParams() {
  return neighborhoodsByArea("lakewood-ranch").map((n) => ({
    neighborhood: n.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ neighborhood: string }> },
): Promise<Metadata> {
  const { neighborhood } = await params;
  const n = neighborhoodBySlug("lakewood-ranch", neighborhood);
  if (!n) return { title: "Neighborhood not found" };
  return {
    title: `${n.name} homes for sale`,
    description: `${n.name} homes for sale, market activity, HOA details, and lifestyle overview — Lakewood Ranch, FL.`,
  };
}

export default async function NeighborhoodDetail({
  params,
}: {
  params: Promise<{ neighborhood: string }>;
}) {
  const { neighborhood } = await params;
  const n = neighborhoodBySlug("lakewood-ranch", neighborhood);
  if (!n) notFound();

  const siblings = NEIGHBORHOODS.filter(
    (other) => other.area === "lakewood-ranch" && other.slug !== n.slug,
  ).slice(0, 3);

  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/lakewood-ranch"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Lakewood Ranch
          </Link>
          <p className="text-eyebrow text-muted-foreground mb-3 mt-6">
            Lakewood Ranch · Manatee County, FL
          </p>
          <h1 className="text-display mb-8">{n.name}</h1>
          {n.blurb ? (
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              {n.blurb}
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-y border-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Median list", value: "[—]" },
            { label: "Days on market", value: "[—]" },
            { label: "Active", value: "[—]" },
            { label: "Sold (90d)", value: "[—]" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-section text-foreground">{stat.value}</div>
              <div className="text-eyebrow text-muted-foreground mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Active</p>
          <h2 className="text-section mb-8">Homes for sale</h2>
          <div className="bg-surface border border-border rounded-md p-12 text-center text-muted-foreground">
            Listings wire in once the Stellar MLS feed lands (Phase 3).
          </div>
        </div>
      </section>

      <section className="bg-surface-elevated px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-eyebrow text-muted-foreground mb-3">HOA</p>
            <h2 className="text-section mb-6">Community details</h2>
            <dl className="space-y-3 text-sm">
              {[
                ["Monthly HOA", "[—]"],
                ["Includes", "[—]"],
                ["Amenities", "[—]"],
                ["Pet policy", "[—]"],
                ["Rental policy", "[—]"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-[140px_1fr] gap-3 border-b border-border pb-2"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground mt-4">
              HOA data wires in via the HOA Explorer tool (Phase 10).
            </p>
          </div>

          <div>
            <p className="text-eyebrow text-muted-foreground mb-3">Schools</p>
            <h2 className="text-section mb-6">Zoned schools</h2>
            <div className="bg-surface border border-border rounded-md p-8 text-center text-muted-foreground text-sm">
              School data wires in via the GreatSchools API (Phase 4).
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Climate &amp; insurance
          </p>
          <h2 className="text-section mb-6">What to expect</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Flood zone", body: "[Flood zone data placeholder]" },
              {
                title: "Insurance estimate",
                body: "[Florida insurance modeling placeholder]",
              },
              {
                title: "Property tax",
                body: "[Property tax estimate placeholder]",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-surface border border-border rounded-md p-6"
              >
                <h3 className="text-heading mb-3">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {siblings.length > 0 ? (
        <section className="bg-surface-elevated px-6 lg:px-12 py-24">
          <div className="max-w-6xl mx-auto">
            <p className="text-eyebrow text-muted-foreground mb-3">
              Nearby
            </p>
            <h2 className="text-section mb-8">More Lakewood Ranch communities</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/lakewood-ranch/${s.slug}` as never}
                  className="block bg-surface border border-border rounded-md p-6 hover:border-border-strong transition-colors"
                >
                  <h3 className="text-heading mb-2">{s.name}</h3>
                  {s.blurb ? (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {s.blurb}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-section mb-6">
            Want a personal tour of {n.name}?
          </h2>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}

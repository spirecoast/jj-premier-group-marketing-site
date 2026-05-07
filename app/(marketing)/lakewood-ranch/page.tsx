import type { Metadata } from "next";
import Link from "next/link";
import { neighborhoodsByArea } from "@/lib/neighborhoods";

export const metadata: Metadata = {
  title: "Lakewood Ranch",
  description:
    "Lakewood Ranch homes for sale, neighborhood overviews, and market data — Manatee County, FL.",
};

export default function LakewoodRanchHub() {
  const neighborhoods = neighborhoodsByArea("lakewood-ranch");

  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Manatee County, FL
          </p>
          <h1 className="text-display mb-8">Lakewood Ranch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            [Hub introduction placeholder — geography, master-plan history, HOA
            structure overview. Strictly factual; no demographic framing.]
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Median list", value: "[—]" },
            { label: "Days on market", value: "[—]" },
            { label: "Active listings", value: "[—]" },
            { label: "YoY change", value: "[—]" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-section text-foreground">{stat.value}</div>
              <div className="text-eyebrow text-muted-foreground mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center pb-6 text-muted-foreground">
          Stats wire in once the Stellar MLS feed lands (Phase 3).
        </p>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Neighborhoods
          </p>
          <h2 className="text-section mb-12">Explore by community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoods.map((n) => (
              <Link
                key={n.slug}
                href={`/lakewood-ranch/${n.slug}` as never}
                className="block bg-surface border border-border rounded-md p-6 hover:border-border-strong transition-colors"
              >
                <h3 className="text-heading mb-2">{n.name}</h3>
                {n.blurb ? (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {n.blurb}
                  </p>
                ) : null}
                <p className="text-eyebrow text-accent mt-4">View →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

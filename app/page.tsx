import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 lg:px-12">
        <div className="max-w-6xl mx-auto py-24 md:py-32">
          <p className="text-eyebrow text-muted-foreground mb-6">
            Lakewood Ranch · Sarasota · Manatee County
          </p>
          <h1 className="text-display max-w-4xl mb-8">
            [Hero headline placeholder]
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            [Subhead placeholder — single sentence positioning the team&rsquo;s value.]
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/buy"
              className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors"
            >
              Find your home
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center px-6 py-3 border border-border-strong rounded-sm font-medium hover:bg-surface-elevated transition-colors"
            >
              What&rsquo;s my home worth?
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Avg. rating", value: "[—]" },
            { label: "Transactions closed", value: "[—]" },
            { label: "Volume sold", value: "[—]" },
            { label: "Years in market", value: "[—]" },
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

      {/* Featured listings */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Featured</p>
          <h2 className="text-section mb-12">[Featured listings placeholder]</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-surface-elevated border border-border rounded-md flex items-center justify-center text-muted-foreground"
              >
                [Listing card {i}]
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhoods */}
      <section className="bg-surface-elevated px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Neighborhoods
          </p>
          <h2 className="text-section mb-12">
            [Neighborhoods grid placeholder]
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] bg-surface border border-border rounded-md flex items-center justify-center text-muted-foreground"
              >
                [Neighborhood {i + 1}]
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">The team</p>
          <h2 className="text-section mb-12">[Team intro placeholder]</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-6">
                <div className="w-32 h-32 bg-surface-elevated border border-border rounded-md shrink-0 flex items-center justify-center text-muted-foreground">
                  [Photo {i}]
                </div>
                <div>
                  <h3 className="text-heading mb-2">[Agent {i}]</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    [Bio placeholder]
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools strip */}
      <section className="bg-surface-elevated px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Tools</p>
          <h2 className="text-section mb-12">[Tools placeholder]</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Home Value", desc: "[Phase 4]" },
              { title: "Affordability", desc: "[Phase 4]" },
              { title: "Neighborhood Match", desc: "[Phase 10]" },
            ].map((t) => (
              <div
                key={t.title}
                className="bg-surface border border-border rounded-md p-8"
              >
                <h3 className="text-heading mb-2">{t.title}</h3>
                <p className="text-muted-foreground text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-12 py-24 bg-foreground text-inverse">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-section mb-6">Let&rsquo;s talk.</h2>
          <p className="text-lg opacity-80 mb-10">[CTA copy placeholder]</p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-accent text-foreground rounded-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}

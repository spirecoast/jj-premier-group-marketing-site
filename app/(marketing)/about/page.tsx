import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "[About description placeholder]",
};

export default function About() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">About</p>
          <h1 className="text-section mb-8">[Team headline placeholder]</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Team intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-12 border-t border-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          {[1, 2].map((i) => (
            <article key={i}>
              <div className="aspect-[4/5] bg-surface-elevated border border-border rounded-md mb-6 flex items-center justify-center text-muted-foreground">
                [Agent {i} photo]
              </div>
              <h2 className="text-heading mb-2">[Agent {i} name]</h2>
              <p className="text-eyebrow text-muted-foreground mb-4">
                FL License # [PLACEHOLDER]
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                [Bio placeholder]
              </p>
              <Link
                href="/contact"
                className="text-brand hover:text-brand-hover underline"
              >
                Get in touch
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

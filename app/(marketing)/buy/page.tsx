import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy",
  description: "[Buy description placeholder]",
};

const steps = [
  { name: "Pre-approval", desc: "[Step description placeholder]" },
  { name: "Search", desc: "[Step description placeholder]" },
  { name: "Offer", desc: "[Step description placeholder]" },
  { name: "Inspection", desc: "[Step description placeholder]" },
  { name: "Close", desc: "[Step description placeholder]" },
];

export default function Buy() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Buying</p>
          <h1 className="text-section mb-6">
            [Buyer hero headline placeholder]
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Buyer intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-border bg-surface-elevated">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-md p-8">
            <h2 className="text-heading mb-3">Browse listings</h2>
            <p className="text-muted-foreground mb-6">
              [For buyers ready to look. Listings come online in Phase 3.]
            </p>
            <span className="text-muted-foreground text-sm">
              See active listings → (Phase 3)
            </span>
          </div>
          <div className="bg-surface border border-border rounded-md p-8">
            <h2 className="text-heading mb-3">Tell us what you want</h2>
            <p className="text-muted-foreground mb-6">
              [For buyers earlier in the process.]
            </p>
            <Link
              href="/contact"
              className="text-brand hover:text-brand-hover underline"
            >
              Start a conversation →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            How it works
          </p>
          <h2 className="text-section mb-12">[Process placeholder]</h2>
          <ol className="grid md:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <li key={step.name}>
                <div className="text-eyebrow text-accent mb-3">
                  Step {i + 1}
                </div>
                <h3 className="text-heading mb-2">{step.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell",
  description: "[Sell description placeholder]",
};

export default function Sell() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Selling</p>
          <h1 className="text-section mb-6">
            [Seller hero headline placeholder]
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Seller intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-border bg-surface-elevated">
        <div className="max-w-3xl mx-auto bg-surface border border-border rounded-md p-10">
          <p className="text-eyebrow text-accent mb-3">Free tool</p>
          <h2 className="text-heading mb-3">What&rsquo;s your home worth?</h2>
          <p className="text-muted-foreground mb-6">
            [Home Value tool placeholder — comes online in Phase 4.]
          </p>
          <button
            type="button"
            disabled
            className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium opacity-60 cursor-not-allowed"
          >
            Get my home value
          </button>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Why list with us
          </p>
          <h2 className="text-section mb-12">[Differentiators placeholder]</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <h3 className="text-heading mb-3">[Differentiator {i}]</h3>
                <p className="text-muted-foreground leading-relaxed">
                  [Description placeholder]
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-elevated px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Timeline</p>
          <h2 className="text-section mb-12">[Process timeline placeholder]</h2>
          <ol className="grid md:grid-cols-4 gap-8">
            {["Consultation", "Prep", "On market", "Close"].map((step, i) => (
              <li key={step}>
                <div className="text-eyebrow text-accent mb-3">
                  Step {i + 1}
                </div>
                <h3 className="text-heading mb-2">{step}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  [Step description placeholder]
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

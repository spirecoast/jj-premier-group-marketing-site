import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relocate",
  description: "[Relocate description placeholder]",
};

const topics = ["Climate", "Taxes", "Healthcare", "Recreation"];

export default function Relocate() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Relocating</p>
          <h1 className="text-section mb-6">
            [Relocator hero headline placeholder]
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Relocator intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-border bg-surface-elevated">
        <div className="max-w-3xl mx-auto bg-surface border border-border rounded-md p-10">
          <p className="text-eyebrow text-accent mb-3">Free tool</p>
          <h2 className="text-heading mb-3">Personalized relocation packet</h2>
          <p className="text-muted-foreground mb-6">
            [Relocation packet generator placeholder — comes online in Phase 10.]
          </p>
          <button
            type="button"
            disabled
            className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium opacity-60 cursor-not-allowed"
          >
            Build my packet
          </button>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            What to expect
          </p>
          <h2 className="text-section mb-12">[Lifestyle overview placeholder]</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {topics.map((topic) => (
              <div key={topic}>
                <h3 className="text-heading mb-3">{topic}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  [{topic} content placeholder]
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-elevated px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">
            Virtual tours
          </p>
          <h2 className="text-section mb-6">
            [Virtual tour offer placeholder]
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Copy placeholder describing the virtual walkthrough offer for
            out-of-area buyers.]
          </p>
        </div>
      </section>
    </>
  );
}

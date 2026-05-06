import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "[Contact description placeholder]",
};

export default function Contact() {
  return (
    <>
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-eyebrow text-muted-foreground mb-3">Contact</p>
          <h1 className="text-section mb-6">[Contact hero placeholder]</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            [Intro paragraph placeholder.]
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <form className="space-y-4" aria-label="Contact form">
            <label className="block">
              <span className="text-sm font-medium block mb-2">Name</span>
              <input
                type="text"
                name="name"
                className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">Email</span>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">Phone (optional)</span>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
                placeholder="(555) 555-5555"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium block mb-2">Message</span>
              <textarea
                name="message"
                rows={5}
                className="w-full px-4 py-3 bg-surface border border-border rounded-sm focus:border-brand focus:outline-none"
                placeholder="Tell us a bit about what you&rsquo;re looking for"
              />
            </label>
            <button
              type="button"
              disabled
              className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium opacity-60 cursor-not-allowed"
            >
              Send (wired in Phase 2)
            </button>
            <p className="text-xs text-muted-foreground">
              [Consent and privacy disclosure placeholder — added in Phase 6.]
            </p>
          </form>

          <aside className="space-y-6">
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Phone</p>
              <p className="text-lg">[Phone placeholder]</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Email</p>
              <p className="text-lg">[Email placeholder]</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Office</p>
              <p className="text-lg">[Address placeholder]</p>
              <p className="text-muted-foreground">Lakewood Ranch, FL</p>
            </div>
            <div>
              <p className="text-eyebrow text-muted-foreground mb-2">Hours</p>
              <p className="text-lg">[Office hours placeholder]</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

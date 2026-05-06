import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <section className="px-6 lg:px-12 py-24">
      <div className="max-w-lg mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">Sorry</p>
        <h1 className="text-section mb-6">Access is invite-only.</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          The portal is for the [YOUR PLACEHOLDER] team. If you think this is a
          mistake, reach out and we&rsquo;ll get you sorted.
        </p>
        <div className="flex gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Contact us
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-border-strong rounded-sm font-medium hover:bg-surface-elevated transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}

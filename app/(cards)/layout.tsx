import type { Metadata } from "next";

/**
 * The private cards link (/cards/<token>). Bare like the questionnaire: no site header or footer,
 * no analytics, no lead pixels. Kept out of search (robots, X-Robots-Tag in next.config.ts,
 * Disallow in app/robots.ts) and never sends a referrer, so the token in the address doesn't travel.
 */
export const metadata: Metadata = {
  title: { absolute: "Cards to post" },
  description: undefined,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  openGraph: null,
  twitter: null,
};

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-body">{children}</div>;
}

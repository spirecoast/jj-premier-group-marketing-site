import type { Metadata } from "next";
import { ROOM_COPY } from "@/lib/room/copy";

/**
 * The client rooms (/room/<token>). Deliberately bare, like the questionnaire:
 * no site header or footer, no analytics, no lead pixels, nothing that loads
 * from another origin. Kept out of search (robots, X-Robots-Tag in
 * next.config.ts, Disallow in app/robots.ts) and never sends a referrer, so
 * the token in the address doesn't travel. The title carries no name.
 */
export const metadata: Metadata = {
  title: { absolute: `${ROOM_COPY.title} · ${ROOM_COPY.bar}` },
  description: undefined,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
  openGraph: null,
  twitter: null,
};

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-paper text-body print:bg-white">{children}</div>;
}

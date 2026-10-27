import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Jost,
  Newsreader,
} from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

/**
 * Four voices, loaded through next/font so nothing render-blocking leaves the
 * origin. The licensed faces (IvyPresto Headline, Contralto) lead each CSS
 * stack in styles/tokens.css and take over automatically once self-hosted.
 *
 * Only what the first screen draws is preloaded: Newsreader roman (headings),
 * Jost (body and nav) and Cormorant (the wordmark in the header), about 180 KB.
 * Newsreader roman keeps its optical-size axis: at hero sizes the display cut is
 * visibly tighter and finer than the text cut, and that is the brand's look.
 * The italic is its own family, not preloaded and without the axis (at the
 * 22px it's mostly set at the two cuts can't be told apart): 65 KB fetched only
 * on a page that shows italic display type, through --font-display-italic.
 * IBM Plex Mono sets small labels and loads with the page, not ahead of it.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: "normal",
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

const newsreaderItalic = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: "italic",
  variable: "--font-newsreader-italic",
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.brokerage}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${site.name} · ${site.tagline}`,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // NEXT_PUBLIC_ROBOTS_NOINDEX=true keeps previews and the pre-launch site out of search engines.
  robots: process.env.NEXT_PUBLIC_ROBOTS_NOINDEX === "true" ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3442",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${newsreaderItalic.variable} ${cormorant.variable} ${jost.variable} ${plexMono.variable}`}
      // globals.css sets scroll-behavior: smooth for in-page anchors. This tells the
      // router, so a route change still jumps to the top at once instead of gliding
      // there through the page transition.
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

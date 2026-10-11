import type { Metadata } from "next";

/** Print documents: no header, footer or chrome, and never in search. scripts/guides-pdf.mjs prints these to PDF. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="pdf-doc">{children}</div>;
}

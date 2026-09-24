import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Nothing on that street", robots: { index: false, follow: false } };

/** notFound() inside the site route group: the layout supplies the chrome. */
export default function NotFound() {
  return <NotFoundContent />;
}

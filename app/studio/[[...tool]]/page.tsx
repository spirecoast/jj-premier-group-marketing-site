import { isSanityConfigured } from "@/sanity/env";
import { Studio } from "./studio";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

/**
 * Sanity Studio, embedded at /studio. Editors sign in with their Sanity
 * account; the Presentation tool opens the live site with click-to-edit.
 */
export default function StudioPage() {
  if (!isSanityConfigured()) {
    return (
      <main className="container-site section">
        <p className="t-eyebrow text-amber">Studio</p>
        <h1 className="t-h1 mt-4 text-navy">Sanity is not configured on this deployment.</h1>
        <p className="t-body mt-6 max-w-measure text-body">
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code>{" "}
          to enable the editor. Until then the site renders its sample content.
        </p>
      </main>
    );
  }
  return <Studio />;
}

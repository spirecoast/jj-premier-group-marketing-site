import Script from "next/script";
import { WebVitals } from "@/components/web-vitals";
import { sideEffectsAllowed } from "@/lib/deploy-env";

/**
 * Plausible, gated on a public env var and on the deployment
 * (lib/deploy-env.ts), so a preview never reports into production analytics
 * even when the variable is shared.
 *
 * Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to the site's domain as it is registered in
 * Plausible (no protocol). Custom events fire through lib/analytics.ts; the
 * goal names, their props and the funnel they answer are in
 * docs/MEASUREMENT.md, and section 3 there lists every goal to add in the
 * Plausible dashboard. The lead pipeline also sends a separate "Lead server"
 * goal from the server (lib/plausible-server.ts) as an ad-blocker backstop.
 *
 * Real visitors' Web Vitals go to the same Plausible site as the "Web Vitals"
 * goal, from a sample of page loads (components/web-vitals.tsx).
 *
 * Home Platform's lead pixel is a separate script (components/home-platform-pixel.tsx).
 */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io";
  if (!plausible || !sideEffectsAllowed()) return null;
  return (
    <>
      <Script
        defer
        data-domain={plausible}
        src={`${plausibleHost.replace(/\/$/, "")}/js/script.outbound-links.tagged-events.js`}
        strategy="afterInteractive"
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};`}
      </Script>
      <WebVitals domain={plausible} host={plausibleHost} />
    </>
  );
}

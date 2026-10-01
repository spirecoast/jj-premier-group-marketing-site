import Script from "next/script";

/**
 * Plausible, gated on a public env var so a preview deployment never reports
 * into production analytics.
 *
 * Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to the site's domain as it is registered in
 * Plausible (no protocol). Custom events fire through lib/analytics.ts; the
 * goal names, their props and the funnel they answer are in
 * docs/MEASUREMENT.md (Lead, Subscribe, Review permission, Calendar feed,
 * Phone tap, Share, Explore). Add each as a goal in the Plausible dashboard. The lead pipeline also sends a separate "Lead server"
 * goal from the server (lib/plausible-server.ts) as an ad-blocker backstop.
 *
 * There is no CRM pixel: the team's CRM is the Home Platform, reached through
 * Zapier, and nothing from it runs in the visitor's browser.
 */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io";
  if (!plausible) return null;
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
    </>
  );
}

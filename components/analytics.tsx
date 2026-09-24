import Script from "next/script";

/**
 * Plausible and the Follow Up Boss Pixel, both gated on public env vars so a
 * preview deployment never reports into production analytics.
 *
 * Plausible: set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to the site's domain as it is
 * registered in Plausible (no protocol). Custom events fire through
 * lib/analytics.ts: "Lead" on every lead form, "Subscribe" on the report
 * and Encore boxes. Add those two as goals in the Plausible dashboard.
 *
 * Follow Up Boss: the Pixel is here for activity tracking and source
 * attribution only. Form capture MUST stay off in Admin > Integrations —
 * forms post server-side through actions/submit-lead.ts, and running both
 * creates duplicate leads.
 */
export function Analytics() {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleHost = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io";
  const pixel = process.env.NEXT_PUBLIC_FUB_PIXEL_ID;
  if (!plausible && !pixel) return null;
  return (
    <>
      {plausible ? (
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
      ) : null}
      {pixel ? (
        <Script id="fub-pixel" strategy="afterInteractive">
          {`(function(w,i,d,g,e,t,s){w["WidgetTrackerObject"]=g;(w[g]=w[g]||function(){(w[g].q=w[g].q||[]).push(arguments);}),(w[g].ds=e);t=i.createElement(d);t.async=1;t.src=e;s=i.getElementsByTagName(d)[0];s.parentNode.insertBefore(t,s);})(window,document,"script","WidgetTrackerObject","https://widgetbe.com/agent");WidgetTrackerObject("init",${JSON.stringify(pixel)});`}
        </Script>
      ) : null}
    </>
  );
}

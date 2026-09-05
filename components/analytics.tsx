import Script from "next/script";

/**
 * GA4 and the Follow Up Boss Pixel, both gated on public env vars so a
 * preview deployment never reports into production analytics.
 *
 * Follow Up Boss: the Pixel is here for activity tracking and source
 * attribution only. Form capture MUST stay off in Admin > Integrations —
 * forms post server-side through actions/submit-lead.ts, and running both
 * creates duplicate leads.
 */
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixel = process.env.NEXT_PUBLIC_FUB_PIXEL_ID;
  if (!ga && !pixel) return null;
  return (
    <>
      {ga ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga)},{anonymize_ip:true});`}
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

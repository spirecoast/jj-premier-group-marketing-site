import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { Analytics } from "@/components/analytics";
import { HomePlatformPixel } from "@/components/home-platform-pixel";
import { JsonLd } from "@/components/json-ld";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { PageTransition } from "@/components/page-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UtmTracker } from "@/components/utm-tracker";
import { getSiteSettings, getTeam } from "@/lib/content";
import { organizationJsonLd } from "@/lib/seo";

/**
 * Gives every page under the site, and the server actions the forms post to,
 * 30s instead of the default: the lead pipeline waits on Postgres, the CRM
 * webhook (8s + one retry) and Resend in turn.
 */
export const maxDuration = 30;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()]);
  const { isEnabled: isDraft } = await draftMode();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>
      <UtmTracker />
      <SiteHeader
        contacts={team.map((m) => ({
          name: m.name,
          phone: m.phone,
          phoneE164: m.phoneE164,
          email: m.email,
        }))}
      />
      <main id="main">
        {/* A route change cross-fades the old page into the new one. The header,
            footer and action bar sit outside the boundary and stay put. */}
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter settings={settings} team={team} />
      <MobileActionBar phoneE164={settings.primaryPhoneE164} />
      <Analytics />
      <HomePlatformPixel />
      <JsonLd data={organizationJsonLd(settings, team)} />
      {isDraft ? (
        <>
          <VisualEditing />
          <a
            href="/api/draft-mode/disable"
            className="fixed bottom-16 right-4 z-50 bg-amber px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white md:bottom-4"
          >
            Exit preview
          </a>
        </>
      ) : null}
    </>
  );
}

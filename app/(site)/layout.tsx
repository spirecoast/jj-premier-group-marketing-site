import { VisualEditing } from "next-sanity/visual-editing";
import { draftMode } from "next/headers";
import { Analytics } from "@/components/analytics";
import { JsonLd } from "@/components/json-ld";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { UtmTracker } from "@/components/utm-tracker";
import { getSiteSettings, getTeam } from "@/lib/content";
import { organizationJsonLd } from "@/lib/seo";

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
      <main id="main">{children}</main>
      <SiteFooter settings={settings} team={team} />
      <MobileActionBar phoneE164={settings.primaryPhoneE164} />
      <Analytics />
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

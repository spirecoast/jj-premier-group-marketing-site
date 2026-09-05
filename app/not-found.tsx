import type { Metadata } from "next";
import { MobileActionBar } from "@/components/mobile-action-bar";
import { NotFoundContent } from "@/components/not-found-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings, getTeam } from "@/lib/content";

export const metadata: Metadata = { title: "Nothing on that street", robots: { index: false, follow: false } };

/**
 * URLs that match no route fall through to the root, outside the site
 * layout, so the chrome is rendered here to keep every 404 on brand.
 */
export default async function RootNotFound() {
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()]);
  return (
    <>
      <SiteHeader contacts={team.map((m) => ({ name: m.name, phone: m.phone, phoneE164: m.phoneE164, email: m.email }))} />
      <main id="main">
        <NotFoundContent />
      </main>
      <SiteFooter settings={settings} team={team} />
      <MobileActionBar phoneE164={settings.primaryPhoneE164} />
    </>
  );
}

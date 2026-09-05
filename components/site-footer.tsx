import Link from "next/link";
import type { Route } from "next";
import type { SiteSettings, TeamMember } from "@/lib/content/types";
import { footerNav, site } from "@/lib/site";
import { CbMark } from "./cb-mark";
import { EqualHousingMark } from "./equal-housing";
import { Wordmark } from "./wordmark";

function Column({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="t-eyebrow text-linen-700">{title}</p>
      <ul className="flex flex-col gap-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href as Route} className="text-navy transition-colors hover:text-harbor-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compliance is furniture. The MLS attribution, the Equal Housing mark, both
 * licenses, the office address and the brokerage mark sit in the footer of
 * every page as part of the design, not a legal line appended later.
 */
export function SiteFooter({ settings, team }: { settings: SiteSettings; team: TeamMember[] }) {
  const year = new Date().getFullYear();
  const licenses = settings.licenses
    .map((l) => `${l.name.split(" ")[0]} · FL ${l.number || "SL pending"}`)
    .join(" · ");
  const office = [settings.officeAddress.street, `${settings.officeAddress.city}, ${settings.officeAddress.state} ${settings.officeAddress.zip}`.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="bg-linen-200 pb-20 text-navy md:pb-12">
      <div className="container-site flex flex-col gap-16 pt-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Wordmark variant="waterline" tone="dark" ground="bg-linen-200" />
            <p className="t-quote text-navy">{site.tagline}</p>
          </div>
          <Column title="Search" links={footerNav.search} />
          <Column title="The team" links={footerNav.team} />
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-linen-700">Direct</p>
            <ul className="flex flex-col gap-2.5 text-[14px]">
              {team.map((m) => (
                <li key={`${m.slug}-phone`}>
                  <a href={`tel:${m.phoneE164}`} className="text-navy transition-colors hover:text-harbor-700">
                    {m.phone}
                  </a>
                  <span className="sr-only"> {m.name}</span>
                </li>
              ))}
              {team.map((m) => (
                <li key={`${m.slug}-email`}>
                  <a href={`mailto:${m.email}`} className="break-all text-navy transition-colors hover:text-harbor-700">
                    {m.email}
                  </a>
                </li>
              ))}
            </ul>
            <address className="t-small mt-2 not-italic text-linen-700">
              {settings.brokerageName}
              <br />
              {office}
            </address>
            {settings.socialLinks.length ? (
              <ul className="mt-1 flex flex-wrap gap-4 text-[14px]">
                {settings.socialLinks.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} rel="noopener noreferrer" target="_blank" className="text-navy hover:text-harbor-700">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-rule pt-7 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-[760px] font-mono text-[9px] uppercase leading-[1.8] tracking-[0.06em] text-linen-700">
            {settings.footerDisclosure} · {licenses}
          </p>
          <div className="flex items-center gap-8 text-navy">
            <EqualHousingMark />
            <CbMark tone="cbblue" width={220} className="max-w-[46vw]" />
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-4 text-[12px] text-linen-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name} · {settings.brokerageName}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href as Route} className="hover:text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={"/studio" as Route} className="hover:text-navy">
                Editor
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

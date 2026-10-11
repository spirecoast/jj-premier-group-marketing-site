import Link from "next/link";
import type { Route } from "next";
import { Briefcase, Globe, House, Mailbox, MapPin, SquarePlay, type LucideIcon } from "lucide-react";
import type { SiteSettings, TeamMember } from "@/lib/content/types";
import { allSocialLinks, footerNav, site, type SocialNetwork } from "@/lib/site";
import { FACEBOOK_PATH, INSTAGRAM_PATH } from "@/lib/brand-marks";
import { TrackedLink } from "./tracked-link";
import { CbMark } from "./cb-mark";
import { EqualHousingMark } from "./equal-housing";
import { RealtorMark } from "./realtor-mark";
import { Wordmark } from "./wordmark";

/** The three market hubs: a click on one counts as Explore {action: "hub"}. */
const HUB_PATHS = new Set(["/lakewood-ranch", "/sarasota", "/bradenton"]);

/**
 * Plausible's tagged-events classes, so the hub links stay `next/link` (client
 * navigation and prefetch). The script sees Link's preventDefault and only
 * records the goal; it never takes over the navigation.
 */
function hubGoalClasses(href: string): string | undefined {
  if (!HUB_PATHS.has(href)) return undefined;
  return `plausible-event-name=Explore plausible-event-action=hub plausible-event-where=footer plausible-event-hub=${href.slice(1)}`;
}

function Column({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="t-eyebrow text-linen-700">{title}</p>
      <ul className="flex flex-col gap-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href as Route} className={["-my-1 inline-block py-1 text-navy transition-colors hover:text-harbor-700", hubGoalClasses(l.href)].filter(Boolean).join(" ")}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Facebook and Instagram in their own glyphs (lib/brand-marks), one colour. */
function BrandGlyph({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={d} />
    </svg>
  );
}

/** lucide-react has no brand marks, so the other networks get a plain glyph and their name as the accessible label. */
const SOCIAL_ICON: Record<Exclude<SocialNetwork, "facebook" | "instagram">, LucideIcon> = {
  google: MapPin,
  youtube: SquarePlay,
  nextdoor: Mailbox,
  linkedin: Briefcase,
  zillow: House,
  other: Globe,
};

function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === "facebook") return <BrandGlyph d={FACEBOOK_PATH} className="size-[18px]" />;
  if (network === "instagram") return <BrandGlyph d={INSTAGRAM_PATH} className="size-[18px]" />;
  const Icon = SOCIAL_ICON[network];
  return <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />;
}

/**
 * Compliance is furniture. The MLS attribution, the Equal Housing mark, both
 * licenses, the office address and the brokerage mark sit in the footer of
 * every page as part of the design, not a legal line appended later.
 */
export function SiteFooter({ settings, team }: { settings: SiteSettings; team: TeamMember[] }) {
  const year = new Date().getFullYear();
  const social = allSocialLinks(settings.socialLinks);
  // Registered full name beside each confirmed number; an unconfirmed license is omitted, never guessed.
  const office = [settings.officeAddress.street, `${settings.officeAddress.city}, ${settings.officeAddress.state} ${settings.officeAddress.zip}`.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="bg-linen-200 pb-20 text-navy md:pb-12">
      <div className="container-site flex flex-col gap-16 pt-16 lg:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Wordmark variant="waterline" tone="dark" ground="bg-linen-200" />
            <p className="t-quote text-navy">{site.tagline}</p>
          </div>
          <Column title="Places" links={footerNav.places} />
          <Column title="Tools" links={footerNav.tools} />
          <Column title="The team" links={footerNav.team} />
          <div className="flex flex-col gap-3.5">
            <p className="t-eyebrow text-linen-700">Direct</p>
            <ul className="flex flex-col gap-2.5 text-[14px]">
              {/* The team line, as the revised mockup shows; each agent's direct line stays on the contact page. */}
              <li>
                <TrackedLink href={`tel:${settings.primaryPhoneE164}`} event="Phone tap" props={{ where: "footer" }} className="-my-1 inline-block py-1 text-navy transition-colors hover:text-harbor-700">
                  {settings.primaryPhoneDisplay}
                </TrackedLink>
                <span className="sr-only"> {site.name}</span>
              </li>
              {team.map((m) => (
                <li key={`${m.slug}-email`}>
                  <a href={`mailto:${m.email}`} className="-my-1 inline-block break-all py-1 text-navy transition-colors hover:text-harbor-700">
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
            {social.length ? (
              <ul className="mt-1 flex flex-wrap gap-2" aria-label="The team elsewhere">
                {social.map((s) => {
                  return (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        rel="me noopener noreferrer"
                        target="_blank"
                        aria-label={`${s.label} (opens in a new tab)`}
                        title={s.label}
                        className="flex size-11 items-center justify-center border border-rule text-navy transition-colors hover:border-navy hover:text-harbor-700"
                      >
                        <SocialIcon network={s.network} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-rule pt-7 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-[760px] font-mono text-[9px] uppercase leading-[1.8] tracking-[0.06em] text-linen-700">
            {settings.footerDisclosure}
          </p>
          {/* REALTOR® and Equal Housing in navy, square and the same size, each with NAR's clear space around it; then the brokerage. */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-6 text-navy">
            <div className="flex items-center gap-6">
              <RealtorMark size={48} />
              <EqualHousingMark size={48} />
            </div>
            <span className="hidden h-10 w-px bg-rule sm:block" aria-hidden="true" />
            <CbMark tone="cbblue" width={220} />
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-4 text-[12px] text-linen-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name} · {settings.brokerageName}. All rights reserved.
          </p>
          <ul className="flex gap-5">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href as Route} className="-my-2 inline-block py-2 hover:text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

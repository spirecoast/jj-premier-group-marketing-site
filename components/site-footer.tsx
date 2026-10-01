import Link from "next/link";
import type { Route } from "next";
import { Briefcase, Camera, Globe, House, Mailbox, MapPin, MessagesSquare, SquarePlay, type LucideIcon } from "lucide-react";
import type { SiteSettings, TeamMember } from "@/lib/content/types";
import { allSocialLinks, footerNav, site, type SocialNetwork } from "@/lib/site";
import { img } from "@/lib/content/seed/helpers";
import { Photo } from "./photo";
import { TrackedLink } from "./tracked-link";
import { CbMark } from "./cb-mark";
import { EqualHousingMark } from "./equal-housing";
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

/**
 * lucide-react has no brand marks (they were dropped from the set), so each
 * network gets a plain glyph and its name as the accessible label.
 */
const SOCIAL_ICON: Record<SocialNetwork, LucideIcon> = {
  google: MapPin,
  youtube: SquarePlay,
  instagram: Camera,
  facebook: MessagesSquare,
  nextdoor: Mailbox,
  linkedin: Briefcase,
  zillow: House,
  other: Globe,
};

const PIER = img("library/venice-pier-sunrise", "A fishing pier reaching into the Gulf at sunrise", "62% 55%");

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
      {/* The pier at sunrise closes every page: the photograph fades into the footer's ground. */}
      <div className="relative h-[300px] overflow-hidden bg-navy sm:h-[380px] lg:h-[460px]" aria-hidden="true">
        <Photo image={PIER} sizes="100vw" />
        <div className="absolute inset-0 bg-linear-to-b from-harbor-950/25 via-transparent via-45% to-linen-200" />
      </div>
      <div className="container-site flex flex-col gap-16 pt-16">
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
                  const Icon = SOCIAL_ICON[s.network];
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
                        <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
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
          <div className="flex items-center gap-8 text-navy">
            <EqualHousingMark />
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

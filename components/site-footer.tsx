import type { Route } from "next";
import { Briefcase, Globe, House, Mailbox, MapPin, SquarePlay, type LucideIcon } from "lucide-react";
import type { SiteSettings, TeamMember } from "@/lib/content/types";
import { allSocialLinks, footerNav, productFamilies, site, type SocialNetwork } from "@/lib/site";
import { FACEBOOK_PATH, INSTAGRAM_PATH } from "@/lib/brand-marks";
import { Emblem } from "./brand/emblem";
import { FooterGroup } from "./footer-group";
import { IntentLink } from "./intent-link";
import { TrackedLink } from "./tracked-link";
import { CbMark } from "./cb-mark";
import { EqualHousingMark } from "./equal-housing";
import { RealtorMark } from "./realtor-mark";
import { Wordmark } from "./wordmark";

/** The profiles the footer always shows, linked once their addresses are in lib/site.ts or the CMS. */
const PROFILES: { network: SocialNetwork; label: string }[] = [
  { network: "facebook", label: "Facebook" },
  { network: "instagram", label: "Instagram" },
];

/** The three market hubs: a click on one counts as Explore {action: "hub"}. */
const HUB_PATHS = new Set(["/lakewood-ranch", "/sarasota", "/bradenton"]);

/**
 * Plausible's tagged-events classes, so the hub links stay `next/link` (client
 * navigation, and a prefetch once the pointer or focus is on them: IntentLink).
 * The script sees Link's preventDefault and only records the goal; it never
 * takes over the navigation.
 */
function hubGoalClasses(href: string): string | undefined {
  if (!HUB_PATHS.has(href)) return undefined;
  return `plausible-event-name=Explore plausible-event-action=hub plausible-event-where=footer plausible-event-hub=${href.slice(1)}`;
}

function Column({ title, links, note, mark }: { title: string; links: readonly { href: string; label: string }[]; note?: string; mark?: React.ReactNode }) {
  return (
    <FooterGroup
      heading={
        <>
          <span className="flex items-center gap-2 font-display text-[19px] font-light leading-none text-navy">
            {title}
            {mark}
          </span>
          {note ? <span className="text-[12px] text-linen-700">{note}</span> : null}
        </>
      }
    >
      <ul className="footer-links flex flex-col gap-2.5 text-[14px]">
        {links.map((l) => (
          <li key={l.href}>
            <IntentLink href={l.href as Route} className={["footer-link -my-1 inline-block py-1 text-navy transition-colors hover:text-harbor-700", hubGoalClasses(l.href)].filter(Boolean).join(" ")}>
              {l.label}
            </IntentLink>
          </li>
        ))}
      </ul>
    </FooterGroup>
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
  if (network === "facebook") return <BrandGlyph d={FACEBOOK_PATH} className="size-[19px]" />;
  if (network === "instagram") return <BrandGlyph d={INSTAGRAM_PATH} className="size-[19px]" />;
  const Icon = SOCIAL_ICON[network];
  return <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />;
}

/**
 * Compliance is furniture. Florida's advertising rules want the brokerage's
 * licensed name on every page, next to the contact details, and never smaller
 * than the team's name (FAC 61J2-10.025 and 61J2-10.026), so "Coldwell Banker
 * Realty" sits under the wordmark in the same serif, above the phone and the
 * two addresses. The disclosure below is set to be read, not hidden: who we
 * are and through whom we work, Florida's default brokerage relationship,
 * where the figures come from, and the marks.
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
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)] lg:gap-16">
          <div className="flex flex-col items-start">
            <Wordmark variant="waterline" tone="dark" ground="bg-linen-200" />
            <p className="t-quote mt-4 max-w-[300px] text-navy">{site.tagline}</p>
            {/* The brokerage in Coldwell Banker's own dress: the CB logo in CB Blue, at the JJ wordmark's measure, with "Realty" set under the words. */}
            <p className="mt-9 flex flex-col gap-2">
              <CbMark tone="cbblue" width={220} />
              <span className="ml-[32px] font-sans text-[11px] font-semibold uppercase leading-none tracking-[0.46em] text-cb-blue">Realty</span>
            </p>
            <ul className="mt-8 flex flex-col gap-1.5 text-[14px]">
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
            <address className="t-small mt-4 not-italic text-linen-700">{office}</address>
            <ul className="mt-6 flex flex-wrap gap-2.5" aria-label="The team elsewhere">
              {social.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    rel="me noopener noreferrer"
                    target="_blank"
                    aria-label={`${s.label} (opens in a new tab)`}
                    title={s.label}
                    className="social-mark"
                  >
                    <SocialIcon network={s.network} />
                  </a>
                </li>
              ))}
              {/* Facebook and Instagram show before their addresses are in; they become links once they are. */}
              {PROFILES.filter((p) => !social.some((s) => s.network === p.network)).map((p) => (
                <li key={p.network}>
                  <span role="img" aria-label={p.label} title={p.label} className="social-mark">
                    <SocialIcon network={p.network} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-12">
            {/* The site: where, what to do, what to read, who. */}
            <div className="footer-groups grid gap-x-8 gap-y-10 sm:grid-cols-4">
              <Column title="Places" links={footerNav.places} />
              <Column title="Buy & sell" links={footerNav.buySell} />
              <Column title="Guides" links={footerNav.guides} />
              <Column title="The team" links={footerNav.team} />
            </div>
            {/* The three data products, each with everything built on it. */}
            <div className="footer-groups grid gap-x-8 gap-y-10 border-t border-rule pt-10 sm:grid-cols-4">
              {productFamilies.map((f) => (
                <Column key={f.key} title={f.name} note={f.title} links={f.items} mark={<Emblem family={f.key} ink className="size-[18px]" />} />
              ))}
              <Column title="All tools" note="Atlas, Encore and Tide" links={[{ href: "/tools", label: "See all eight" }]} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 border-t border-rule pt-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="footer-legal max-w-[860px] text-[12px] leading-[1.7] text-linen-700 lg:columns-2 lg:gap-10">
            <p>
              {site.name} is a real estate team: Joelyn Nauman and Jessica Garza, licensed Florida real estate agents with{" "}
              {settings.brokerageName}, {office}. Real estate services are provided through {settings.brokerageName}.
            </p>
            <p>
              In Florida, real estate licensees are presumed to work as transaction brokers unless a single-agent or
              no-brokerage relationship is agreed in writing (Florida Statutes §475.278). If your home is listed with
              another brokerage, this is not a solicitation of that listing.
            </p>
            <p>
              Sales figures come from the Manatee and Sarasota County Property Appraisers&rsquo; public records, not the
              MLS. Information is deemed reliable but not guaranteed and is for consumers&rsquo; personal, non-commercial
              use. Figures from the tools on this site are estimates for planning, not quotes or appraisals.
            </p>
            <p>
              Coldwell Banker&reg; and the Coldwell Banker logos are trademarks of Coldwell Banker Real Estate LLC. The
              Coldwell Banker&reg; System is comprised of company owned offices which are owned by a subsidiary of
              Anywhere Advisors LLC and franchised offices which are independently owned and operated. The Coldwell
              Banker System fully supports the principles of the Fair Housing Act and the Equal Opportunity Act.
            </p>
            <p>
              REALTOR&reg; is a federally registered collective membership mark which identifies a real estate
              professional who is a member of the National Association of REALTORS&reg; and subscribes to its strict
              Code of Ethics. Equal Housing Opportunity.
            </p>
          </div>
          {/* REALTOR® and Equal Housing in navy, square and the same size, each with NAR's clear space around it. The brokerage's logo leads the brand column above. */}
          <div className="flex shrink-0 items-center gap-6 text-navy">
            <RealtorMark size={48} />
            <EqualHousingMark size={48} />
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-4 text-[12px] text-linen-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name} · {settings.brokerageName}
          </p>
          <ul className="flex gap-5">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <IntentLink href={l.href as Route} className="-my-2 inline-block py-2 hover:text-navy">
                  {l.label}
                </IntentLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

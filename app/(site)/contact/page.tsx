import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteSettings, getTeam } from "@/lib/content";
import { isMarketSlug } from "@/lib/content/markets";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact · Tell us the timing",
  description:
    "Call, text or write to Joelyn Nauman and Jessica Garza. Two questions first: when do you need to be in, and is there a house to sell?",
  path: "/contact",
});

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim().slice(0, 1000) : undefined;
}

/**
 * Accepts `?message=`, `?place=` and `?market=` so the Atlas's "ask us about
 * it" link and any neighborhood page can hand the visitor over with the
 * place already in the box and the market attached to the lead.
 */
export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [team, settings, params] = await Promise.all([getTeam(), getSiteSettings(), searchParams]);
  const place = first(params.place);
  const defaultMessage = first(params.message) ?? (place ? `Asking about ${place}.` : undefined);
  const marketParam = first(params.market);
  const market = isMarketSlug(marketParam) ? marketParam : undefined;
  const office = [settings.officeAddress.street, `${settings.officeAddress.city}, ${settings.officeAddress.state} ${settings.officeAddress.zip}`.trim()]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.brokerageName} ${office}`)}`;

  return (
    <section className="container-site grid gap-12 py-section lg:grid-cols-[1.3fr_1fr] lg:gap-20" aria-labelledby="contact-title">
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="Contact"
          title={<span id="contact-title">Tell us the timing.</span>}
        />
        <p className="t-body max-w-measure text-body">
          Two questions before we look at anything: when do you need to be in, and is there a house to sell first? Those two answers change everything else. Put whatever you know in the box, and one of us will write or call back.
        </p>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <LeadForm form="contact" fields={["name", "email", "phone", "timing", "message"]} submitLabel="Send" defaultMessage={defaultMessage} hidden={{ market }} />
        </div>
      </div>

      <aside className="flex flex-col gap-10 lg:pt-24">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-amber">Direct</p>
          <ul className="flex flex-col gap-6">
            {team.map((m) => (
              <li key={m.slug} className="flex flex-col gap-1 border-t border-hairline pt-5">
                <p className="t-h4 text-navy">{m.name}</p>
                <p className="t-mono-sm text-graphite-500">
                  {m.title}
                </p>
                <TrackedLink href={`tel:${m.phoneE164}`} event="Phone tap" props={{ where: "contact" }} className="font-mono text-[15px] text-navy hover:text-harbor-700">
                  {m.phone}
                </TrackedLink>
                <TrackedLink href={`sms:${m.phoneE164}`} event="Phone tap" props={{ where: "contact-text" }} className="t-small text-harbor-700 hover:text-navy">
                  Text {m.name.split(" ")[0]}
                </TrackedLink>
                <a href={`mailto:${m.email}`} className="t-small break-all text-harbor-700 hover:text-navy">
                  {m.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 border-t border-hairline pt-5">
          <p className="t-eyebrow text-amber">Office</p>
          <address className="t-body not-italic text-body">
            {settings.brokerageName}
            <br />
            {office}
          </address>
          <p className="t-small text-body-muted">By appointment. We’re usually in a house, so call or text first.</p>
        </div>
        <div className="relative flex aspect-[3/2] items-center justify-center overflow-hidden border border-hairline bg-white p-6">
          <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" aria-hidden="true" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-hairline" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rule" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-3 bg-white px-6 py-4 text-center">
            <p className="t-mono-sm text-graphite-500">Map · {settings.officeAddress.city}, {settings.officeAddress.state}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link-rule">
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      </aside>
    </section>
  );
}

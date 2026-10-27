import type { Metadata } from "next";
import { UrlLeadForm } from "@/components/url-lead-form";
import { SectionHeading } from "@/components/section-heading";
import { TrackedLink } from "@/components/tracked-link";
import { getSiteSettings, getTeam } from "@/lib/content";
import { mapEmbedUrl, mapLinkUrl, mapQuery } from "@/lib/map-embed";
import { pageMetadata } from "@/lib/seo";
import { ExternalLink } from "@/components/ui/external-link";

export const metadata: Metadata = pageMetadata({
  title: "Contact · Tell us the timing",
  description:
    "Call, text or write to Joelyn Nauman and Jessica Garza. Two questions first: when do you need to be in, and is there a house to sell?",
  path: "/contact",
});

/**
 * Accepts `?message=`, `?place=` and `?market=` so the Atlas's "ask us about
 * it" link and any neighborhood page can hand the visitor over with the
 * place already in the box and the market attached to the lead. The page is
 * static; the browser puts them in the form (components/url-lead-form.tsx).
 */
export default async function ContactPage() {
  const [team, settings] = await Promise.all([getTeam(), getSiteSettings()]);
  const office = [settings.officeAddress.street, `${settings.officeAddress.city}, ${settings.officeAddress.state} ${settings.officeAddress.zip}`.trim()]
    .filter(Boolean)
    .join(", ");
  // The pin: the office address once it is filled in, else NEXT_PUBLIC_MAP_QUERY, else the brokerage in Lakewood Ranch.
  const query = mapQuery(settings);
  const mapsUrl = mapLinkUrl(query);

  return (
    <section className="container-site grid gap-12 py-section lg:grid-cols-[1.3fr_1fr] lg:gap-20" aria-labelledby="contact-title">
      <div className="flex flex-col gap-8">
        <SectionHeading
          as="h1"
          size="display"
          title={<span id="contact-title">Tell us the timing.</span>}
        />
        <p className="t-body max-w-measure text-body">
          Two questions before we look at anything: when do you need to be in, and is there a house to sell first? Those two answers change everything else. Put whatever you know in the box, and one of us will write or call back.
        </p>
        <div className="border border-hairline bg-white p-6 sm:p-8">
          <UrlLeadForm prefill="contact" form="contact" fields={["timing", "sellFirst", "name", "email", "phone", "message"]} submitLabel="Send" />
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:pt-24">
        <div className="flex flex-col gap-6">
          <p className="t-h4 text-navy">Direct</p>
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
          <p className="t-h4 text-navy">Office</p>
          <address className="t-body not-italic text-body">
            {settings.brokerageName}
            <br />
            {office}
          </address>
          <p className="t-small text-body-muted">By appointment. We’re usually in a house, so call or text first.</p>
        </div>
        {/* The map: Google's keyless embed, loaded once the frame is near the viewport, with the plain link under it for anyone whose browser blocks the frame. */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden border border-hairline bg-linen-100 sm:aspect-[3/2]">
            <iframe
              src={mapEmbedUrl(query)}
              title={`Map · ${query}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen={false}
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="t-mono-sm text-graphite-500">Map · {settings.officeAddress.city}, {settings.officeAddress.state}</p>
            <ExternalLink href={mapsUrl} className="link-rule">
              Open in Google Maps ↗
            </ExternalLink>
          </div>
        </div>
      </div>
    </section>
  );
}

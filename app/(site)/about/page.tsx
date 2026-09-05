import type { Metadata } from "next";
import { AgentCard } from "@/components/agent-card";
import { ButtonLink } from "@/components/buttons";
import { JsonLd } from "@/components/json-ld";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { StatBand } from "@/components/stat-band";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getSiteSettings, getTeam, getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About · Joelyn Nauman and Jessica Garza",
  description:
    "Two agents, one file, no handoffs. Joelyn Nauman and Jessica Garza, broker associates with Coldwell Banker Realty, on the Suncoast for nineteen years.",
  path: "/about",
});

const FRAMES = {
  duo: img("photos/duo-ultrawide", "Joelyn Nauman and Jessica Garza", "50% 30%"),
};

/** From the brand voice document: how the writing, and the work, sounds. */
const VALUES = [
  {
    title: "Specific is warm",
    body: "Nine days. Flood zone X. The good end of the street. Details prove we stood in the house, and that is the warmest thing an agent can do.",
  },
  {
    title: "We are the friend, not the brochure",
    body: "A brochure has to sell. A friend gets to tell you the truth and still be excited about it. We work from the second chair.",
  },
  {
    title: "We are allowed to have favorites",
    body: "Our favorite kitchen this year. The street we would live on. An opinion is what makes advice worth having; neutral is what everyone else sounds like.",
  },
];

export default async function AboutPage() {
  const [team, settings, testimonials] = await Promise.all([getTeam(), getSiteSettings(), getTestimonials()]);

  return (
    <>
      {team.map((m) => (
        <JsonLd key={m.slug} data={{ "@context": "https://schema.org", ...personJsonLd(m, settings) }} />
      ))}

      <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="about-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="Who you are hiring"
          title={
            <span id="about-title">
              Two agents.
              <br />
              One file.
              <br />
              No handoffs.
            </span>
          }
        />
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <p className="t-lead max-w-measure text-body">
              You will never be passed to an assistant. Joelyn and Jessica both know your timeline, both attend your showings, and either one can answer any question about your file without calling the other first.
            </p>
            <p className="t-body max-w-measure text-body">
              We are two people who have watched a thousand families do this, and we remember what we wished someone had told us the first time. So we tell you. The good part, the expensive part, the part about the water table.
            </p>
            <p className="t-body max-w-measure text-body">
              We like these houses, we like this coast, and we are not going to pretend a kitchen is stunning when what it is, is rebuilt in 2019 and full of light at four in the afternoon. Joelyn takes the long view; Jessica reads the contract and the room. Between them is the whole coast from the Skyway to Venice, under {settings.brokerageName}.
            </p>
          </div>
          <div className="relative aspect-[3/2] overflow-hidden bg-linen-100 lg:aspect-[4/5]">
            <Photo image={FRAMES.duo} priority sizes="(min-width: 1024px) 520px, 100vw" />
          </div>
        </div>
      </section>

      <section className="container-site grid gap-14 pb-section lg:grid-cols-2 lg:gap-20" aria-label="The team">
        {team.map((m) => (
          <AgentCard key={m.slug} member={m} full />
        ))}
      </section>

      <section className="bg-parchment">
        <div className="container-site flex flex-col gap-12 py-section">
          <SectionHeading eyebrow="How we work" title="Three things we will not stop saying." />
          <ol className="grid gap-px border border-hairline bg-hairline md:grid-cols-3">
            {VALUES.map((v, i) => (
              <li key={v.title} className="flex flex-col gap-4 bg-white p-7">
                <span className="t-stat text-navy" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3 text-navy">{v.title}</h3>
                <p className="t-body text-body">{v.body}</p>
              </li>
            ))}
          </ol>
          <StatBand stats={settings.stats} className="border-t border-rule pt-8" />
        </div>
      </section>

      {testimonials.length ? (
        <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading eyebrow="In their words" title="What clients say after the closing." />
          <TestimonialSlider testimonials={testimonials} />
        </section>
      ) : null}

      <section className="bg-navy text-linen-200">
        <div className="container-site flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="t-eyebrow text-mist">{site.tagline}</p>
            <h2 className="t-h1 font-light text-white">Tell us the timing.</h2>
          </div>
          <ButtonLink href="/contact" variant="linen" dash>
            Start the conversation
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

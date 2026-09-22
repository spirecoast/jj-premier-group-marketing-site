import type { Metadata } from "next";
import { AgentCard } from "@/components/agent-card";
import { ButtonLink } from "@/components/buttons";
import { CtaBand } from "@/components/cta-band";
import { JsonLd } from "@/components/json-ld";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialSlider } from "@/components/testimonial-slider";
import { getSiteSettings, getTeam, getTestimonials } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { pageMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Meet Joelyn and Jessica",
  description:
    "Joelyn Nauman and Jessica Garza, a mother and daughter team with Coldwell Banker Realty, helping people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton.",
  path: "/about",
});

const FRAMES = {
  duo: img("photos/duo-square", "Joelyn Nauman and Jessica Garza", "50% 14%"),
  coast: img("library/place-sea-oats-dusk", "Sea oats on the dunes at dusk", "50% 60%"),
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
          eyebrow="Meet Joelyn & Jessica"
          title={
            <span id="about-title">
              A mother and daughter,
              <br />
              in your corner
              <br />
              for the whole move.
            </span>
          }
        />
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <p className="t-lead max-w-measure text-body">
              We are Joelyn and Jessica, a mother and daughter team with {settings.brokerageName}. We help people buy, sell and invest across Lakewood Ranch, Sarasota and Bradenton, and we do it the way we would want it done for our own family.
            </p>
            <p className="t-body max-w-measure text-body">
              Whether you are buying your first home, selling for the best price, or building a portfolio, you get local knowledge, honest guidance, and a clear answer every time you ask. You will always know where things stand, because we will have told you.
            </p>
            <p className="t-body max-w-measure text-body">
              We like these houses and we like this coast, and we will not pretend a kitchen is stunning when what it is, is rebuilt in 2019 and full of light at four in the afternoon. Joelyn takes the long view; Jessica reads the contract and the room. Between us, you are covered from the first call to the keys.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-linen-100">
            <Photo image={FRAMES.duo} priority sizes="(min-width: 1024px) 520px, 100vw" />
          </div>
        </div>
      </section>

      <section className="container-site grid gap-14 pb-section lg:grid-cols-2 lg:gap-20" aria-label="The team">
        {team.map((m) => (
          <AgentCard key={m.slug} member={m} full as="h2" />
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
        </div>
      </section>

      {testimonials.length ? (
        <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading eyebrow="In their words" title="What clients say after the closing." />
          <TestimonialSlider testimonials={testimonials} />
        </section>
      ) : null}

      <CtaBand image={FRAMES.coast} eyebrow={site.tagline} title="Tell us the timing." body="When do you need to be in, and is there a house to sell first? Those two answers change everything else." minHeight="min-h-[440px]">
        <ButtonLink href="/contact" variant="linen" dash>
          Start the conversation
        </ButtonLink>
      </CtaBand>
    </>
  );
}

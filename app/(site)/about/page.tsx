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
  fileImage: true, // opengraph-image.tsx beside this page
});

const FRAMES = {
  duo: img("photos/duo-whitenavy-square", "Joelyn Nauman and Jessica Garza", "50% 50%"),
  coast: img("library/place-sea-oats-dusk", "Dunes and sea oats at sunrise on a Florida beach", "50% 60%"),
};

/** From the brand voice document: how the writing, and the work, sounds. */
const VALUES = [
  {
    title: "We're specific",
    body: "We tell you the flood zone, the age of the roof and which end of the street is the good one. You make decisions with details, so that's what we give you.",
  },
  {
    title: "We tell you what we think",
    body: "If a house isn't right for you, we'll say so, and why. If it is, we'll say that too.",
  },
  {
    title: "We're both on it",
    body: "Joelyn and Jessica both know your file. Call either of us and you'll get an answer, not a call back later.",
  },
];

export default async function AboutPage() {
  const [team, settings, testimonials] = await Promise.all([getTeam(), getSiteSettings(), getTestimonials()]);

  return (
    <>
      {team.map((m) => (
        <JsonLd key={m.slug} data={{ "@context": "https://schema.org", ...personJsonLd(m, settings) }} />
      ))}

      {/* The duo photograph beside the title, its top on the title's cap line and its height about the text column's. */}
      <section className="container-site py-section" aria-labelledby="about-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start lg:gap-20">
          <div className="flex flex-col gap-10">
            <SectionHeading
              as="h1"
              size="display"
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
            <div className="flex flex-col gap-6">
              <p className="t-lead max-w-measure text-body">
                We&rsquo;re Joelyn and Jessica, a mother and daughter team with {settings.brokerageName}. We help people buy, sell and invest across Lakewood Ranch, Sarasota and Bradenton, and we do it the way we&rsquo;d want it done for our own family.
              </p>
              <p className="t-body max-w-measure text-body">
                Whether you&rsquo;re buying your first home, selling for the best price, or building a portfolio, you get local knowledge, honest guidance, and a clear answer every time you ask. You&rsquo;ll always know where things stand, because we&rsquo;ll have told you.
              </p>
            </div>
          </div>
          <div className="relative aspect-square w-full overflow-hidden bg-linen-100 sm:max-w-[440px] lg:justify-self-end">
            <Photo image={FRAMES.duo} priority sizes="(min-width: 640px) 440px, 100vw" />
          </div>
        </div>
      </section>

      {/* One per row, the portrait beside the bio: the duo photograph above stays the lead. */}
      <section className="container-site flex flex-col gap-14 pb-section lg:gap-20" aria-label="The team">
        {team.map((m) => (
          <AgentCard key={m.slug} member={m} full as="h2" className="border-t border-hairline pt-10 lg:pt-14" />
        ))}
      </section>

      <section className="bg-parchment">
        <div className="container-site flex flex-col gap-12 py-section">
          <SectionHeading eyebrow="How we work" title="What working with us is like." />
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

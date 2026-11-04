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

export const metadata: Metadata = pageMetadata({
  title: "Meet Joelyn and Jessica",
  description:
    "Meet Joelyn Nauman and Jessica Garza, the mother-and-daughter team at Coldwell Banker Realty who help people buy and sell in Lakewood Ranch, Sarasota and Bradenton.",
  path: "/about",
  fileImage: true, // opengraph-image.tsx beside this page
});

const FRAMES = {
  duo: img("photos/duo-whitenavy-square", "Joelyn Nauman and Jessica Garza", "50% 50%"),
  coast: img("library/place-sea-oats-dusk", "Dunes and sea oats at sunrise on a Florida beach", "50% 60%"),
};

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
                  Two generations.
                  <br />
                  One shared commitment to you.
                </span>
              }
            />
            {/* The owners' own words (November 2026). */}
            <div className="flex flex-col gap-6">
              <p className="t-lead max-w-measure text-body">
                We are Joelyn and Jessica, a mother-daughter real estate team with {settings.brokerageName}. Together, we bring a personal approach to real estate, helping buyers, sellers, and investors throughout Lakewood Ranch, Sarasota and Bradenton.
              </p>
              <p className="t-body max-w-measure text-body">
                For us, real estate is about more than buying or selling a home. It&rsquo;s about building relationships, understanding your goals, and making sure you feel confident in every decision. We believe every client deserves the same care, honesty and attention we would give our own family.
              </p>
              <p className="t-body max-w-measure text-body">
                If you&rsquo;re searching for your dream home, preparing to sell, or exploring investment opportunities, you&rsquo;ll have both of us by your side. Our approach is built on trust, attention to detail and a commitment to delivering exceptional results.
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

      {testimonials.length ? (
        <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading title="What clients say after the closing." />
          <TestimonialSlider testimonials={testimonials} />
        </section>
      ) : null}

      <CtaBand image={FRAMES.coast} title="Let’s talk about your next move." minHeight="min-h-[440px]">
        <ButtonLink href="/contact" variant="linen" dash>
          Start the conversation
        </ButtonLink>
      </CtaBand>
    </>
  );
}

import { ButtonLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import type { ImageRef } from "@/lib/content/types";
import { site } from "@/lib/site";

/**
 * Meet Joelyn and Jessica, directly under the hero. The portrait, the three paragraphs the team
 * wrote about working together, and two buttons. No figures and no proof slot: what
 * the team does for a client is section 04.
 */
export function Meet({ duo }: { duo: ImageRef }) {
  return (
    <section className="bg-paper" aria-labelledby="meet-title">
      <div className="container-site grid items-center gap-12 py-section md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div className="sr-img relative aspect-[4/5] w-full overflow-hidden bg-linen-100 md:max-h-[560px] lg:max-h-[600px]">
          <Photo image={duo} sizes="(min-width: 1024px) 460px, 100vw" />
        </div>

        <div className="sr flex flex-col gap-8">
          <SectionHeading
            size="display"
            title={<span id="meet-title">Two agents. One team. Fully focused on you.</span>}
          />
          {/* The owners' own words (November 2026). */}
          <div className="flex flex-col gap-5">
            <p className="t-lead max-w-[560px] text-body">
              As a mother-daughter real estate team with {site.brokerage}, we share more than a family connection.
              We share a genuine passion for helping people and a commitment to providing excellent service built on
              trust and integrity.
            </p>
            <p className="t-body max-w-[560px] text-body">
              We believe every real estate journey is personal. When you&rsquo;re finding a place to call home, moving
              on to your next chapter, or making a smart investment, we take the time to listen, understand what matters
              most to you, and create a plan that fits your needs.
            </p>
            <p className="t-body max-w-[560px] text-body">
              With two dedicated agents by your side, you&rsquo;ll benefit from local market knowledge, personalized
              attention, and honest guidance. We work together to provide thoughtful strategies, strong negotiation, and
              clear communication throughout the entire process.
            </p>
          </div>
          <div className="btn-row gap-3.5">
            <ButtonLink href="/about" dash>
              Meet Joelyn and Jessica
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" dash>
              Start a conversation
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

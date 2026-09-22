import { ButtonLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { TestimonialSlider } from "@/components/testimonial-slider";
import type { ImageRef, Testimonial } from "@/lib/content/types";
import { site } from "@/lib/site";

/**
 * 02 · Meet Joelyn and Jessica. The portrait, a client's sentence, and the
 * paragraph the team wrote about what they do. No figures.
 */
export function Meet({ duo, testimonials }: { duo: ImageRef; testimonials: Testimonial[] }) {
  return (
    <section className="bg-parchment" aria-labelledby="meet-title">
      <div className="container-site grid items-center gap-14 py-section lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div className="relative flex flex-col lg:block lg:h-[640px]">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-linen-100 lg:absolute lg:left-0 lg:top-0 lg:h-[88%] lg:w-[82%]">
            <Photo image={duo} sizes="(min-width: 1024px) 460px, 100vw" />
          </div>
          {testimonials.length ? (
            <div className="relative z-10 -mt-10 ml-auto w-[88%] bg-navy p-7 sm:w-[70%] lg:absolute lg:bottom-0 lg:right-0 lg:m-0 lg:w-[52%]">
              <TestimonialSlider testimonials={testimonials} tone="dark" size="compact" />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-8">
          <SectionHeading
            number="02"
            eyebrow="Meet Joelyn & Jessica"
            size="display"
            title={<span id="meet-title">From the first call to the keys, you get both of us.</span>}
          />
          <div className="flex flex-col gap-5">
            <p className="t-lead max-w-[560px] text-body">
              We are Joelyn and Jessica, a mother and daughter team with {site.brokerage}, and we help
              people buy, sell and invest across Lakewood Ranch, Sarasota and Bradenton.
            </p>
            <p className="t-body max-w-[560px] text-body">
              Whether you are buying your first home, selling for the best price, or building a portfolio,
              you get the same thing from us: local knowledge, honest guidance, and someone in your corner
              at every step. Luxury homes and new construction in Lakewood Ranch, the water in Sarasota,
              the established streets of Bradenton. Wherever your move takes you, we know the terrain, we
              negotiate hard, and we tell you what is happening while it is happening.
            </p>
          </div>
          <div className="flex flex-wrap gap-3.5">
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

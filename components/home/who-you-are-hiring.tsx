import { ButtonLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { StatBand } from "@/components/stat-band";
import { TestimonialSlider } from "@/components/testimonial-slider";
import type { ImageRef, Stat, Testimonial } from "@/lib/content/types";

/** 05 · Who you are hiring. The duo, a client's sentence, and three numbers. */
export function WhoYouAreHiring({ duo, stats, testimonials }: { duo: ImageRef; stats: Stat[]; testimonials: Testimonial[] }) {
  return (
    <section className="bg-parchment">
      <div className="container-site grid items-center gap-14 py-section lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div className="relative flex flex-col lg:block lg:h-[640px]">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-linen-100 lg:absolute lg:left-0 lg:top-0 lg:h-[88%] lg:w-[82%]">
            <Photo image={duo} sizes="(min-width: 1024px) 460px, 100vw" />
          </div>
          <div className="relative z-10 -mt-10 ml-auto w-[88%] bg-navy p-7 sm:w-[70%] lg:absolute lg:bottom-0 lg:right-0 lg:m-0 lg:w-[52%]">
            <TestimonialSlider testimonials={testimonials} tone="dark" size="compact" />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <SectionHeading
            number="05"
            eyebrow="Who you are hiring"
            size="display"
            title={
              <>
                Two agents.
                <br />
                One file.
                <br />
                No handoffs.
              </>
            }
          />
          <p className="t-body max-w-[520px] text-body">
            You will never be passed to an assistant. Joelyn and Jessica both know your timeline, both
            attend your showings, and either one can answer any question about your file without
            calling the other first.
          </p>
          <StatBand stats={stats} className="border-t border-rule pt-6" />
          <div className="flex flex-wrap gap-3.5">
            <ButtonLink href="/about" dash>
              Meet Joelyn and Jessica
            </ButtonLink>
            <ButtonLink href="/blog" variant="outline" dash>
              Read the letter
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

import { ButtonLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import type { ImageRef } from "@/lib/content/types";
import { site } from "@/lib/site";

/**
 * 06 · Meet Joelyn and Jessica. The portrait, the paragraph the team wrote
 * about what they do, and two buttons. No figures and no proof slot: what
 * the team does for a client is section 03.
 */
export function Meet({ duo }: { duo: ImageRef }) {
  return (
    <section className="bg-parchment" aria-labelledby="meet-title">
      <div className="container-site grid items-center gap-12 py-section md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-linen-100 md:max-h-[560px] lg:max-h-[600px]">
          <Photo image={duo} sizes="(min-width: 1024px) 460px, 100vw" />
        </div>

        <div className="flex flex-col gap-8">
          <SectionHeading
            number="06"
            eyebrow="Meet Joelyn & Jessica"
            size="display"
            title={<span id="meet-title">Two agents. One team. Fully focused on you.</span>}
          />
          <div className="flex flex-col gap-5">
            <p className="t-lead max-w-[560px] text-body">
              We&rsquo;re Joelyn and Jessica, a mother and daughter team with {site.brokerage}, and we help
              people buy, sell and invest across Lakewood Ranch, Sarasota and Bradenton.
            </p>
            <p className="t-body max-w-[560px] text-body">
              Whether you&rsquo;re buying your first home, selling for the best price, or building a portfolio,
              you get the same thing from us: local knowledge, honest guidance, and a strategy tailored to
              your goals. Wherever your move takes you, we know the market, negotiate with purpose, and keep
              you informed every step of the way.
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

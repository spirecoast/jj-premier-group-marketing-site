import { ButtonLink } from "@/components/buttons";
import { Photo } from "@/components/photo";
import { TrackedLink } from "@/components/tracked-link";
import { img } from "@/lib/content/seed/helpers";

/**
 * Joelyn in white and Jessica in navy against the studio backdrop, the two of
 * them in the left half of the frame. Positioned near the top so their heads
 * stay in on a wide, short band.
 */
const DUO = img("photos/duo-whitenavy-wide", "Joelyn Nauman and Jessica Garza", "22% 8%");

/**
 * Work with Joelyn and Jessica: the two of them on the left, and to their
 * right the promise, the name, one line on what they do and two ways in: the
 * contact page, or the phone. The band is Linen 200, in the palette; the
 * portrait's studio grey runs into it through a long gradient on the right,
 * where the words sit, and at the photograph's foot on a phone, where the
 * words sit under it. No literal colour.
 */
export function WorkWith({
  phoneDisplay,
  phoneE164,
  where = "home-work-with",
}: {
  phoneDisplay: string;
  phoneE164: string;
  /** Where the phone tap came from, for the analytics event. */
  where?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-linen-200" aria-labelledby="work-with-title">
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
        <Photo image={DUO} sizes="100vw" />
        {/* The studio grey gives way to the band: along the foot under lg, across the right half from lg. */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-linen-200 to-transparent lg:hidden" aria-hidden="true" />
        <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-linear-to-r from-transparent via-linen-200/85 to-linen-200 lg:block" aria-hidden="true" />
      </div>
      <div className="container-site relative flex pt-12 pb-16 lg:min-h-[640px] lg:items-center lg:justify-end lg:py-24 xl:min-h-[720px]">
        <div className="sr flex max-w-[520px] flex-col items-start gap-6 lg:w-[42%]">
          <h2 id="work-with-title" className="t-display text-balance text-navy">
            Work with Joelyn and Jessica
          </h2>
          <p className="font-display text-[clamp(1.25rem,1.6vw,1.5rem)] font-light italic text-navy">Your home. Your future. Our commitment.</p>
          <span className="block h-px w-[96px] bg-navy/40" aria-hidden="true" />
          <p className="t-body max-w-[460px] text-navy">
            Get assistance in determining current property value, crafting a competitive offer, writing and negotiating a
            contract, and much more. Contact us today.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ButtonLink href="/contact" dash>
              Contact us now
            </ButtonLink>
            <span className="text-[13px] text-navy">or</span>
            <TrackedLink
              href={`tel:${phoneE164}`}
              event="Phone tap"
              props={{ where }}
              className="t-label inline-flex items-center gap-2 py-2 text-navy underline decoration-navy/30 underline-offset-4 transition-colors hover:text-harbor-700"
            >
              Call us at {phoneDisplay}
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

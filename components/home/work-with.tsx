import Link from "next/link";
import { Photo } from "@/components/photo";
import { TrackedLink } from "@/components/tracked-link";
import type { ImageRef } from "@/lib/content/types";

/**
 * Work with Joelyn and Jessica: a full-width interior under the harbor wash,
 * and in the middle the promise, the name, one line on what they do and two
 * ways in: the contact page, or the phone. The photograph is a stand-in until
 * the blue-and-white portrait of the two of them is cropped for it.
 */
export function WorkWith({
  image,
  phoneDisplay,
  phoneE164,
  where = "home-work-with",
}: {
  image: ImageRef;
  phoneDisplay: string;
  phoneE164: string;
  /** Where the phone tap came from, for the analytics event. */
  where?: string;
}) {
  return (
    <section className="relative min-h-[600px] overflow-hidden bg-navy lg:min-h-[680px]" aria-labelledby="work-with-title">
      <Photo image={image} sizes="100vw" />
      <div className="absolute inset-0 bg-linear-to-b from-harbor-950/62 via-harbor-950/55 to-harbor-950/70" aria-hidden="true" />
      <div className="container-site relative flex min-h-[inherit] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="t-eyebrow text-mist text-shadow-soft">Your home. Your future. Our commitment.</p>
        <span className="block h-px w-[96px] bg-sky-300" aria-hidden="true" />
        <h2 id="work-with-title" className="t-display max-w-[900px] text-balance font-light text-white text-shadow-photo">
          Work with Joelyn and Jessica
        </h2>
        <p className="t-body max-w-[620px] font-medium text-white text-shadow-soft">
          Get assistance in determining current property value, crafting a competitive offer, writing and negotiating a
          contract, and much more. Contact us today.
        </p>
        <Link
          href="/contact"
          className="btn mt-4 border-linen-200 bg-linen-200 text-navy hover:border-linen-100 hover:bg-linen-100"
        >
          Contact us now
          <span className="btn-dash" aria-hidden="true" />
        </Link>
        <div className="flex w-full max-w-[280px] items-center gap-4 text-[13px] text-linen-200/85" aria-hidden="true">
          <span className="h-px flex-1 bg-linen-200/40" />
          or
          <span className="h-px flex-1 bg-linen-200/40" />
        </div>
        <TrackedLink
          href={`tel:${phoneE164}`}
          event="Phone tap"
          props={{ where }}
          className="t-label inline-flex items-center gap-2 py-2 text-white text-shadow-soft transition-colors hover:text-sky-300"
        >
          <span className="sr-only">or </span>Call us at {phoneDisplay}
        </TrackedLink>
      </div>
    </section>
  );
}

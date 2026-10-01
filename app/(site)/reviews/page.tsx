import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { pageMetadata } from "@/lib/seo";
import { REVIEWS } from "@/lib/reviews/copy";

export const metadata: Metadata = pageMetadata({
  title: REVIEWS.title,
  description: REVIEWS.description,
  path: "/reviews",
});

/** The Google Business Profile review link (Business Profile → Get more reviews). Empty until the profile is live. */
function googleReviewUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * /reviews — the ask, never the display. The Google link renders only when
 * NEXT_PUBLIC_GOOGLE_REVIEW_URL is set. The `review-permission` form stores
 * the words like any lead (tagged consent:review) and nothing from it is shown
 * here or anywhere else on the site: a quote goes up only when a person enters
 * it in Sanity with the permission on file.
 */
export default function ReviewsPage() {
  const google = googleReviewUrl();
  return (
    <section className="container-site flex flex-col gap-14 py-section" aria-labelledby="reviews-title">
      <div className="flex flex-col gap-8">
        <SectionHeading as="h1" size="display" eyebrow={REVIEWS.eyebrow} title={<span id="reviews-title">{REVIEWS.heading}</span>} />
        <p className="t-lead max-w-measure text-body">{REVIEWS.lead}</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div className="relative flex flex-col gap-4 self-start border-t border-rule pt-7">
          <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
          <h2 className="t-h2 text-navy">{REVIEWS.google.title}</h2>
          <p className="t-body max-w-[44ch] text-body">{REVIEWS.google.body}</p>
          {google ? (
            <a href={google} target="_blank" rel="noopener noreferrer" className="btn btn-navy self-start">
              {REVIEWS.google.label} ↗
            </a>
          ) : (
            <p className="t-small max-w-[44ch] text-graphite-500">{REVIEWS.google.soon}</p>
          )}
        </div>

        <div className="relative flex flex-col gap-6 border-t border-rule pt-7">
          <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
          <h2 className="t-h2 text-navy">{REVIEWS.permission.title}</h2>
          <p className="t-body max-w-measure text-body">{REVIEWS.permission.body}</p>
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm
              form="review-permission"
              fields={["name", "email", "message", "reviewConsent"]}
              labels={{ message: REVIEWS.form.message }}
              placeholderMessage={REVIEWS.form.placeholder}
              messageRequired
              marketingConsent={false}
              submitLabel={REVIEWS.form.submit}
            />
          </div>
          <p className="t-small text-graphite-500">{REVIEWS.note}</p>
        </div>
      </div>
    </section>
  );
}

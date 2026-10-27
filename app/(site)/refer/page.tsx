import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { Steps } from "@/components/steps";
import { REFER } from "@/lib/refer/copy";
import { pageMetadata } from "@/lib/seo";
import { products } from "@/lib/site";

const atlas = products.find((p) => p.key === "atlas")!;

export const metadata: Metadata = pageMetadata({
  title: REFER.title,
  description: REFER.description,
  path: "/refer",
});

/**
 * /refer — for past clients and friends of the team. The form is the
 * `referral` kind (lib/leads/constants.ts) in two groups: about you (the referrer's
 * name, email and phone) and about them (the person moving: name, an email
 * or a phone, what they're planning, a note), plus the required box saying
 * they know their details are being passed along. The team writes back to
 * the referrer first.
 */
export default function ReferPage() {
  return (
    <>
      <section className="container-site grid gap-12 py-section lg:grid-cols-[1fr_1.1fr] lg:gap-20" aria-labelledby="refer-title">
        <div className="flex flex-col gap-8">
          <SectionHeading as="h1" size="display" title={<span id="refer-title">{REFER.heading}</span>} />
          <p className="t-lead max-w-measure text-navy">{REFER.lead}</p>
          <p className="t-body max-w-measure text-body">{REFER.body}</p>
          {/* The other past-client page, one quiet line. */}
          <p className="t-body border-t border-hairline pt-6 text-body">
            {REFER.reviews.line}{" "}
            <Link href="/reviews" className="link-rule">
              {REFER.reviews.label}
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:pt-6">
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm
              form="referral"
              fields={["name", "email", "phone", "referredName", "referredLastName", "referredEmail", "referredPhone", "referredPlan", "message", "referralConsent"]}
              labels={{ name: REFER.form.name, lastName: REFER.form.lastName, email: REFER.form.email, phone: REFER.form.phone, message: REFER.form.message }}
              placeholderMessage={REFER.form.placeholder}
              submitLabel={REFER.form.submit}
              marketingConsent={false}
            />
          </div>
          <p className="t-small text-graphite-500">{REFER.privacy}</p>
          {/* For anyone who'd rather not hand over a friend's details: send them Atlas instead. */}
          <ShareButton title={atlas.name} url={atlas.href} label="Rather send them a link" what="refer-link" className="self-start" />
        </div>
      </section>
      <section className="bg-linen-200" aria-label="How a referral works">
        <div className="container-site py-section">
          <Steps items={REFER.steps.map((s) => ({ ...s }))} columns={3} />
        </div>
      </section>
    </>
  );
}

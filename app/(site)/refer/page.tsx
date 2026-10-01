import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { Steps } from "@/components/steps";
import { REFER } from "@/lib/refer/copy";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: REFER.title,
  description: REFER.description,
  path: "/refer",
});

/**
 * /refer — for past clients and friends of the team. The form is the
 * `referral` kind (lib/leads.ts) in two groups: about you (the referrer's
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
          <SectionHeading as="h1" size="display" eyebrow={REFER.eyebrow} title={<span id="refer-title">{REFER.heading}</span>} />
          <p className="t-lead max-w-measure text-navy">{REFER.lead}</p>
          <p className="t-body max-w-measure text-body">{REFER.body}</p>
        </div>
        <div className="flex flex-col gap-4 lg:pt-6">
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm
              form="referral"
              fields={["name", "email", "phone", "referredName", "referredLastName", "referredEmail", "referredPhone", "referredPlan", "message", "referralConsent"]}
              labels={{ name: REFER.form.name, lastName: REFER.form.lastName, email: REFER.form.email, phone: REFER.form.phone, message: REFER.form.message }}
              placeholderMessage={REFER.form.placeholder}
              submitLabel={REFER.form.submit}
            />
          </div>
          <p className="t-small text-graphite-500">{REFER.privacy}</p>
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

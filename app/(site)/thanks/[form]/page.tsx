import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink, RuleLink } from "@/components/buttons";
import { ThanksGoal } from "@/components/thanks-goal";
import { TrackedLink } from "@/components/tracked-link";
import { getTeam } from "@/lib/content";
import { LEAD_FORMS, LEAD_GOAL, type LeadForm } from "@/lib/leads";
import { newsletterConfig } from "@/lib/newsletter/config";
import { SIGNUP_COPY } from "@/lib/newsletter/copy";
import { REFER } from "@/lib/refer/copy";
import { REVIEWS } from "@/lib/reviews/copy";
import { pageMetadata } from "@/lib/seo";
import { products } from "@/lib/site";

/**
 * /thanks/[form] — where every form lands after a successful send. What
 * happens next, in plain words; the two direct numbers; a booking link when
 * NEXT_PUBLIC_BOOKING_URL is set; and one useful thing to do in the meantime.
 * The page fires the analytics goal (the form itself does not). Kept out of
 * search engines: there is nothing here for anyone who has not sent a form.
 */

type Next = { eyebrow: string; title: string; body: string; line: string; href: string; label: string };

const atlas = products.find((p) => p.key === "atlas")!;
const tide = products.find((p) => p.key === "tide")!;
const encore = products.find((p) => p.key === "encore")!;

const COPY: Record<LeadForm, Next> = {
  buy: {
    eyebrow: "Received",
    title: "Got it.",
    body: "One of us will call or write back with the two questions that change everything else: your timing, and whether there’s a house to sell first. After that we’ll talk about where.",
    line: "While you wait, open Atlas. Every neighborhood in Lakewood Ranch, Sarasota and Bradenton is on one map, with the facts behind each one.",
    href: atlas.href,
    label: "Open Atlas",
  },
  listing: {
    eyebrow: "Received",
    title: "Got it.",
    body: "We’ll confirm the showing with you by phone or email. If the timing changes, tell us and we’ll move it.",
    line: "In the meantime, Atlas has the neighborhood this house sits in, and the ones next to it.",
    href: atlas.href,
    label: "Open Atlas",
  },
  sell: {
    eyebrow: "Received",
    title: "Got it.",
    body: "We’ll pull the comparable sales, drive the street, and come back with a number and the reason for it. No listing agreement attached; the number is yours either way.",
    line: "If you want to see how we think about pricing before the call, the Tide archive is the place: it says what the three markets did each month, in plain language.",
    href: tide.href,
    label: "Read Tide",
  },
  valuation: {
    eyebrow: "Received",
    title: "Got it.",
    body: "A real comp-based answer from Joelyn or Jessica within a day. No algorithm guess. We’ll call with the number, the four addresses behind it, and what we’d change before the photos.",
    line: "Until then, the Tide archive shows how we read the three markets: what sold, what it went for, and what it means for you.",
    href: tide.href,
    label: "Read Tide",
  },
  contact: {
    eyebrow: "Received",
    title: "Got it.",
    body: "One of us will call or write back. Two questions first: when do you need to be in, and is there a house to sell? Everything else follows from those.",
    line: "While you wait, Atlas has every place we work on one map, with the facts behind each one.",
    href: atlas.href,
    label: "Open Atlas",
  },
  letter: {
    eyebrow: "You’re on the list",
    title: "Tide is on its way.",
    body: "Tide goes out once a month. It’s one short page on how home sales went in Lakewood Ranch, Sarasota and Bradenton, and what that means if you’re buying or selling. We don’t share your address, and you can stop any time.",
    line: "In the meantime, Encore has what’s on tonight, this weekend and all season, at every stage, hall and gallery near you.",
    href: encore.href,
    label: "Open the Encore calendar",
  },
  referral: {
    eyebrow: "Received",
    ...REFER.thanks,
    href: atlas.href,
    label: "Open Atlas",
  },
  "review-permission": {
    eyebrow: "Received",
    ...REVIEWS.thanks,
    href: encore.href,
    label: "Open the Encore calendar",
  },
  calendar: {
    eyebrow: "You’re on the list",
    title: "Encore comes out every Monday.",
    body: "The full week of shows, concerts and openings comes in one email. We don’t share your address, and you can stop any time.",
    line: "No need to wait for Monday. The whole season is on the calendar now, and you can narrow it to a venue or a category.",
    href: encore.href,
    label: "Open the Encore calendar",
  },
};

function isLeadForm(value: string): value is LeadForm {
  return (LEAD_FORMS as readonly string[]).includes(value);
}

/** Only the lead forms exist; anything else is a 404 at the router, before the page streams. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LEAD_FORMS.map((form) => ({ form }));
}

export async function generateMetadata({ params }: { params: Promise<{ form: string }> }): Promise<Metadata> {
  const { form } = await params;
  if (!isLeadForm(form)) return {};
  return pageMetadata({
    title: COPY[form].title,
    description: COPY[form].body,
    path: `/thanks/${form}`,
    noIndex: true,
  });
}

export default async function ThanksPage({ params }: { params: Promise<{ form: string }> }) {
  const { form } = await params;
  if (!isLeadForm(form)) notFound();
  const copy = COPY[form];
  // The Tide and Encore pages, when the site sends a confirmation email (read at build: the page is static).
  const confirming = (form === "letter" || form === "calendar") && newsletterConfig().enabled;
  const team = await getTeam();
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

  return (
    <section className="container-site grid gap-12 py-section lg:grid-cols-[1.3fr_1fr] lg:gap-20" aria-labelledby="thanks-title">
      <Suspense fallback={null}>
        <ThanksGoal event={LEAD_GOAL[form]} form={form} />
      </Suspense>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3.5">
          <p className="t-eyebrow text-amber">{confirming ? SIGNUP_COPY.thanksEyebrow : copy.eyebrow}</p>
          <h1 id="thanks-title" className="t-display max-w-[640px] text-navy">
            {copy.title}
          </h1>
        </div>
        {confirming ? <p className="t-lead max-w-[560px] text-navy">{form === "letter" ? SIGNUP_COPY.thanksTide : SIGNUP_COPY.thanksEncore}</p> : null}
        <p className="t-lead max-w-[560px] text-body">{copy.body}</p>
        <div className="flex flex-col gap-5 border-t border-hairline pt-6">
          <p className="t-eyebrow text-amber">In the meantime</p>
          <p className="t-body max-w-[520px] text-body">{copy.line}</p>
          <div className="flex flex-wrap items-center gap-6">
            <ButtonLink href={copy.href} dash>
              {copy.label}
            </ButtonLink>
            <RuleLink href="/">Back to the front page</RuleLink>
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-10 lg:pt-24">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-amber">Rather talk now?</p>
          <p className="t-body max-w-[380px] text-body">Call or text either of us directly. We’re usually in a house, so a text gets the quickest answer.</p>
          <ul className="flex flex-col gap-6">
            {team.map((m) => (
              <li key={m.slug} className="flex flex-col gap-1 border-t border-hairline pt-5">
                <p className="t-h4 text-navy">{m.name}</p>
                <TrackedLink href={`tel:${m.phoneE164}`} event="Phone tap" props={{ where: "thanks" }} className="font-mono text-[15px] text-navy hover:text-harbor-700">
                  {m.phone}
                </TrackedLink>
                <TrackedLink href={`sms:${m.phoneE164}`} event="Phone tap" props={{ where: "thanks-text" }} className="t-small text-harbor-700 hover:text-navy">
                  Text {m.name.split(" ")[0]}
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>
        {bookingUrl ? (
          <div className="flex flex-col gap-3 border-t border-hairline pt-5">
            <p className="t-eyebrow text-amber">Or pick a time</p>
            <p className="t-body max-w-[380px] text-body">It’s fifteen minutes on the phone, at a time that suits you.</p>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="link-rule self-start">
              Book 15 minutes ↗
            </a>
          </div>
        ) : null}
      </aside>
    </section>
  );
}

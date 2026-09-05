import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description: `The terms that apply to your use of ${site.domain}, including listing data, the calendar, and the limits of what a website can promise.`,
  path: "/terms",
});

const UPDATED = "September 5, 2026";

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return (
    <section className="container-site flex flex-col gap-10 py-section">
      <header className="flex max-w-measure flex-col gap-4">
        <p className="t-eyebrow text-amber">Terms</p>
        <h1 className="t-display text-navy">Terms of use</h1>
        <p className="t-record text-graphite-600">Last updated {UPDATED} · draft for legal review</p>
      </header>
      <div className="prose-jj">
        <p>
          By using {site.domain} you agree to these terms. The site is operated by {site.name}, a team of licensed Florida real estate REALTORS® affiliated with {settings.brokerageName}. If you do not agree, please do not use the site.
        </p>

        <h2>What the site is for</h2>
        <p>
          The site describes homes for sale and recently sold on Florida’s Suncoast, the neighborhoods they sit in, and cultural events in the area, and it lets you contact us. It is for your personal, non-commercial use. You may not copy, scrape, resell or republish its content, including photographs and listing data, without written permission.
        </p>

        <h2>Listing information</h2>
        <p>
          Listing information is provided by Stellar MLS and by the listing brokerages, and is deemed reliable but not guaranteed. Square footage, lot size, taxes, flood-zone designations and similar figures come from public records and third parties; verify anything that matters to you independently before relying on it. Listings change quickly and a home shown as available may already be under contract or sold. Where a listing belongs to another brokerage, that brokerage is identified on the page.
        </p>

        <h2>Not advice</h2>
        <p>
          Nothing on this site is legal, tax, lending, insurance or engineering advice. Valuations we provide on request are comparative market analyses from a licensed REALTOR®, not appraisals. Any mortgage figure on this site is an estimate, not a quote. Past sale results, including days on market and percentage of list price, describe specific homes and do not predict future prices or returns.
        </p>

        <h2>The calendar</h2>
        <p>
          Events on the Suncoast Calendar are listed as a service. Dates, times, prices and availability belong to the venues and can change; confirm with the venue before you go. Listing an event does not imply any sponsorship, partnership or affiliation between {site.name} and the venue or organiser.
        </p>

        <h2>Fair housing</h2>
        <p>
          We do business in accordance with the federal Fair Housing Act and Florida law. Descriptions on this site are about properties and places, never about the people who might live in them.
        </p>

        <h2>Your submissions</h2>
        <p>
          When you send us a form you confirm that the information is yours and accurate. Consent to receive calls or text messages is optional and can be withdrawn at any time; see the privacy policy for how we handle phone numbers.
        </p>

        <h2>Limits of liability</h2>
        <p>
          The site is provided as is. To the fullest extent Florida law allows, {site.name} and {settings.brokerageName} are not liable for losses arising from your use of the site or reliance on its content, including inaccurate listing data, third-party links, or interruptions in service.
        </p>

        <h2>Links</h2>
        <p>Links to venues, ticket sellers, maps and other sites are provided for convenience. We do not control those sites and are not responsible for their content or their privacy practices.</p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of Florida. Any dispute will be heard in the courts of Manatee County or Sarasota County, Florida.</p>

        <h2>Changes</h2>
        <p>We may update these terms; the date at the top tells you when. Continued use of the site after a change means you accept it.</p>

        <h2>Contact</h2>
        <p>
          {site.name} · {settings.brokerageName} · {[settings.officeAddress.street, settings.officeAddress.city, settings.officeAddress.state, settings.officeAddress.zip].filter(Boolean).join(", ")}
        </p>
      </div>
    </section>
  );
}

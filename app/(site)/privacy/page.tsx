import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and protects the information you share on this website, including phone numbers and text-message consent.`,
  path: "/privacy",
});

const UPDATED = "September 5, 2026";

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  return (
    <section className="container-site flex flex-col gap-10 py-section">
      <header className="flex max-w-measure flex-col gap-4">
        <p className="t-eyebrow text-amber">Privacy</p>
        <h1 className="t-display text-navy">Privacy policy</h1>
        <p className="t-record text-graphite-600">Last updated {UPDATED} · draft for legal review</p>
      </header>
      <div className="prose-jj">
        <p>
          This policy explains what {site.name} (“we”, “us”), a team of licensed Florida real estate REALTORS® with {settings.brokerageName}, collects when you use {site.domain}, why we collect it, and the choices you have. We keep it short on purpose; if anything here is unclear, write to us at the address at the foot of this page.
        </p>

        <h2>What we collect</h2>
        <p>
          <strong>What you give us.</strong> When you send a form on this site we collect what you type: your name, email address, phone number, the address of a home you want valued, a listing you asked about, when you are thinking of moving, and your message. When you subscribe to the Tide newsletter or the Encore Arts Calendar email, we collect your email address.
        </p>
        <p>
          <strong>What your browser sends.</strong> Like most websites, our hosting provider records the pages you visit, the time, your IP address, the browser you use and the page that referred you. If you arrive from an advertisement or an email, the campaign tags in the link are stored for the length of your visit so we know what brought you here.
        </p>
        <p>
          <strong>Analytics and the CRM pixel.</strong> We use Google Analytics 4 to understand which pages are read, with IP addresses anonymised. We also load a tracking script from our customer relationship system, Follow Up Boss, which records the listings and pages viewed by a visitor who has already identified themselves through a form, so the agent who calls you back knows what you have looked at. Neither tool captures form contents; forms are sent to us directly by this site.
        </p>

        <h2>How we use it</h2>
        <p>
          To answer the enquiry you sent, to show you homes and prepare valuations you asked for, to send you the Tide newsletter or the weekly Encore Arts Calendar email if you subscribed, to keep our records of the work we do for you as Florida law requires, and to improve this website. We do not sell personal information, and we do not use it for anything unrelated to real estate.
        </p>

        <h2>Phone numbers and text messages</h2>
        <p>
          Phone numbers collected through this website are used only to respond to your enquiry and, where you have consented, to send you calls or text messages. We do not share or sell phone numbers for marketing purposes. Text-message consent is a separate, unchecked box on our forms; it is never required to submit a form or to work with us. Message and data rates may apply. Reply STOP at any time to opt out, and HELP for help. We record the date and time of your consent with your enquiry.
        </p>

        <h2>Who sees it</h2>
        <p>
          Joelyn and Jessica and, where necessary, {settings.brokerageName} as the brokerage of record. The service providers that run this website on our behalf process data under contract: our web host, our content management system, our database host, the automation service that schedules our emails, our email delivery service, Google Analytics, and Follow Up Boss, the CRM that stores enquiries. We do not give your information to other businesses for their own marketing. We may disclose information if the law requires it or to protect our rights.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Enquiries stay in our CRM while we work with you and for as long as Florida brokerage record-keeping rules require afterwards, currently five years for transaction records. You can ask us to delete an enquiry that never became a transaction at any time.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Every marketing email carries an unsubscribe link, and it works with one click.</li>
          <li>Reply STOP to any text message to stop receiving them.</li>
          <li>Write to us to see, correct or delete the personal information we hold about you.</li>
          <li>Your browser lets you refuse cookies; the site works without them.</li>
        </ul>

        <h2>Children</h2>
        <p>This website is not directed at children under sixteen and we do not knowingly collect information from them.</p>

        <h2>Changes</h2>
        <p>If this policy changes we will update the date at the top. Material changes to how we use phone numbers or email addresses will be announced to subscribers before they take effect.</p>

        <h2>Contact</h2>
        <p>
          {site.name} · {settings.brokerageName}
          <br />
          {[settings.officeAddress.street, settings.officeAddress.city, settings.officeAddress.state, settings.officeAddress.zip].filter(Boolean).join(", ")}
          <br />
          <a href="mailto:joelyn.nauman@cbrealty.com">joelyn.nauman@cbrealty.com</a> · <a href="mailto:jessica.garza@cbrealty.com">jessica.garza@cbrealty.com</a>
        </p>
      </div>
    </section>
  );
}

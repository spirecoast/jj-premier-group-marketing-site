import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { MAP_PROVIDER } from "@/lib/neighborhoods/map-style";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and protects the information you share on this website, including phone numbers and text-message consent.`,
  path: "/privacy",
});

const UPDATED = "October 1, 2026";

/** Named from the same switch the explorer uses, so the page is true under either configuration. */
const MAP_PROVIDER_NAME = MAP_PROVIDER === "maptiler" ? "MapTiler" : "OpenFreeMap";

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
          <strong>What you give us.</strong> When you send a form on this site we collect what you type: your name, email address, phone number, the address of a home you want valued, a listing you asked about, when you are thinking of moving, and your message. If you tell us about someone who is moving here, we collect only their first name and your note, and we contact them only after you have told them we will. If you send us words about working with us, we keep them with the permission you gave, and nothing appears on the site until we have checked it with you. When you subscribe to the Tide newsletter or the Encore Arts Calendar email, we collect your email address and, where our systems record it, the date and time you gave consent to receive it.
        </p>
        <p>
          <strong>What your browser sends.</strong> Like most websites, our hosting provider, Vercel, records the pages you visit, the time, your IP address, the browser you use and the page that referred you. When you first arrive we store, in your browser for up to 90 days, the page you landed on, the site or social profile that sent you and any campaign tags in the link; they travel with any form you send.
        </p>
        <p>
          <strong>Maps.</strong> The Atlas neighborhood explorer draws its map from tiles served by {MAP_PROVIDER_NAME}. Your browser fetches those tiles directly, so {MAP_PROVIDER_NAME} sees your IP address in the same way any website you visit does. It does not receive your name or anything you type here.
        </p>
        <p>
          <strong>Analytics.</strong> We use Plausible to count which pages are read. Plausible is designed to work without cookies or stored IP addresses, which is why we do not show a consent banner. Forms are not sent to Plausible; they are sent to us directly by this site.
        </p>

        <h2>How we use it</h2>
        <p>
          To answer the enquiry you sent, to show you homes and prepare valuations you asked for, to keep our records of the work we do for you as Florida law requires, and to improve this website. If you subscribed, your email address is used to send you the Tide newsletter, once a month, and the Encore Arts Calendar email, once a week on Mondays, when those begin. This website does not itself send email to visitors; the only email it sends is a notification to the two of us when a form arrives. We do not sell personal information, and we do not use it for anything unrelated to real estate.
        </p>

        <h2>Phone numbers and text messages</h2>
        <p>
          Phone numbers collected through this website are used only to respond to your enquiry and, where you have consented, to send you calls or text messages. We do not share or sell phone numbers for marketing purposes. Text-message consent is a separate, unchecked box on our forms; it is never required to submit a form or to work with us. Message and data rates may apply. Reply STOP at any time to opt out, and HELP for help. We record the date and time of your consent with your enquiry.
        </p>

        <h2>Who sees it</h2>
        <p>
          Joelyn and Jessica and, where necessary, {settings.brokerageName} as the brokerage of record. The service providers that run this website on our behalf process data under contract: Vercel, which hosts the site; Supabase, which hosts the site database where form submissions are stored; the customer relationship system our brokerage provides, where we work on each enquiry, delivered to it through Zapier or a direct connection; Resend, which delivers the notification email to our team when a form arrives; Plausible, for the page counts described above; and {MAP_PROVIDER_NAME}, for the map. We do not give your information to other businesses for their own marketing. We may disclose information if the law requires it or to protect our rights.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Enquiries stay in the site database and in the brokerage’s customer relationship system while we work with you and for as long as Florida brokerage record-keeping rules require afterwards; we currently expect that to be about five years for transaction records, and counsel will confirm the period. You can ask us to delete an enquiry that never became a transaction at any time.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Every Tide and Encore email carries an unsubscribe link, and it works with one click. You can also email either of us at the addresses below and we will take you off the list.</li>
          <li>Reply STOP to any text message to stop receiving them.</li>
          <li>To see, correct or delete the personal information we hold about you, email either of us at the addresses below. We will confirm when it is done.</li>
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

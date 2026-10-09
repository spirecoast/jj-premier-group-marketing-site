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

const UPDATED = "October 9, 2026";

/** Named from the same switch the explorer uses, so the page is true under either configuration. */
// MapTiler when a key is set, with OpenFreeMap as the fallback (components/map-runtime.ts); OpenFreeMap alone otherwise.
const MAP_PROVIDER_NAME = MAP_PROVIDER === "maptiler" ? "MapTiler, with OpenFreeMap as a backup," : "OpenFreeMap";

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
          <strong>What you give us.</strong> When you send a form on this site we collect what you type: your name, email address, phone number, the address of a home you want valued, a listing you asked about, when you are thinking of moving, and your message. If you tell us about someone who is moving here, we collect their name, their email or phone, what they’re planning and your note, together with your confirmation that they know you’re passing their details along. We use their details only to get in touch with them about the move. If you send us words about working with us, we keep them with the permission you gave, and nothing appears on the site until we have checked it with you. When you subscribe to the Tide newsletter or the Encore Arts Calendar email, or tick the box that says we can email you, we collect your email address, the date and time you asked, and the date and time you confirmed it from the email we send you. We also keep a record of each newsletter we send you and whether it was delivered, so nobody gets an issue twice.
        </p>
        <p>
          <strong>What your browser sends.</strong> Like most websites, our hosting provider, Vercel, records the pages you visit, the time, your IP address, the browser you use and the page that referred you. When you first arrive we store, in your browser for up to 90 days, the page you landed on, the site or social profile that sent you and any campaign tags in the link; they travel with any form you send.
        </p>
        <p>
          <strong>Our customer relationship system.</strong> We work on every enquiry in Home Platform, the system Compass runs for {settings.brokerageName}. Its script runs on the pages of this site. It gives your browser a random ID, kept in a cookie and in your browser’s storage, and records the pages you read here. Once you’ve entered an email address or phone number in one of our forms, it sends what you’ve typed in that form to Home Platform, even if you don’t press send. It leaves out passwords, payment details and hidden fields. It doesn’t run if your browser sends a Global Privacy Control or Do Not Track signal; your form then comes to us from this site in the usual way.
        </p>
        <p>
          <strong>Maps.</strong> The Atlas neighborhood explorer draws its map from tiles served by {MAP_PROVIDER_NAME}. Your browser fetches those tiles directly, so {MAP_PROVIDER_NAME} sees your IP address in the same way any website you visit does. It does not receive your name or anything you type here.
        </p>
        <p>
          <strong>Analytics.</strong> We use Plausible to count which pages are read. Plausible is designed to work without cookies or stored IP addresses. Forms are not sent to Plausible.
        </p>

        <h2>How we use it</h2>
        <p>
          To answer the enquiry you sent, to show you homes and prepare valuations you asked for, to keep our records of the work we do for you as Florida law requires, and to improve this website. If you subscribe, or tick the email box on another form, this website sends you one email asking you to confirm your address, and nothing else until you do. Once you confirm, it sends you a short welcome and then what you signed up for: the Tide newsletter in the first days of each month, and the Encore Arts Calendar email on Monday mornings. The email box on our other forms is for Tide. Replies to an enquiry come from our own mailboxes. The website also emails the two of us when a form arrives. We do not sell personal information, and we do not use it for anything unrelated to real estate.
        </p>

        <h2>Phone numbers and text messages</h2>
        <p>
          Phone numbers collected through this website are used only to respond to your enquiry and, where you have consented, to send you calls or text messages. We do not share or sell phone numbers for marketing purposes. Text-message consent is a separate, unchecked box on our forms; it is never required to submit a form or to work with us. Message and data rates may apply. Reply STOP at any time to opt out, and HELP for help. We record the date and time of your consent with your enquiry.
        </p>

        <h2>Who sees it</h2>
        <p>
          Joelyn and Jessica and, where necessary, {settings.brokerageName} as the brokerage of record. The service providers that run this website on our behalf process data under contract: Vercel, which hosts the site; Supabase, which hosts the site database where form submissions are stored; Home Platform, the customer relationship system Compass runs for our brokerage, where we work on each enquiry (it receives your form from its script on this site, or from this site directly); Resend, which delivers the newsletters and the email confirming your subscription, and the notification email to our team when a form arrives (it receives your email address and records whether each email was delivered); Plausible, for the page counts described above; and {MAP_PROVIDER_NAME}, for the map. We do not give your information to other businesses for their own marketing. We may disclose information if the law requires it or to protect our rights.
        </p>

        <h2>How long we keep it</h2>
        <p>
          The site database clears your name, message and address two years after you last contacted us, and keeps only your email or phone number with the record of what you agreed to, so we can show when you gave or withdrew consent. Five years after your last contact, that record is deleted too. If you unsubscribed or asked us not to call, we keep your email or phone number on a do-not-contact list for as long as we send email or texts, so you aren’t contacted again. Records of how each form was delivered are deleted after 90 days. Enquiries passed to the brokerage’s customer relationship system are kept there under the brokerage’s own policy. You can ask us to delete your information at any time.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Every Tide and Encore email has unsubscribe links at the bottom: one stops that newsletter, the other stops all email from us. Each opens a page where one click does it. Mail apps that show an Unsubscribe button next to the sender, such as Gmail and Apple Mail, stop that newsletter with one click too. You can also reply ‘stop’ to any of them, or email either of us at the addresses below, and we will take you off the list.</li>
          <li>Reply STOP to any text message to stop receiving them.</li>
          <li>To see, correct or delete the personal information we hold about you, email either of us at the addresses below. We will confirm when it is done.</li>
          <li>Turn on Global Privacy Control or Do Not Track in your browser and the Home Platform script stays off; your forms still reach us.</li>
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

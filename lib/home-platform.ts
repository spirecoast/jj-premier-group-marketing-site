/**
 * Home Platform (Compass's platform at Coldwell Banker Realty) and its lead
 * pixel, the script Home Platform's Lead Flows gives an agent to put on their
 * own website. Read from the script itself (https://www.homeplatform.com/cxlp/a.min.js,
 * "lead-pixel" v1, last modified 2026-08-19), because Compass's help pages sit
 * behind a login:
 *
 * - It finds `<script id="cxlp-ajs" data-client-id="…">` and starts on the
 *   window `load` event, so the tag has to be in the page's HTML, not injected
 *   after load.
 * - It sets a random `cxlp_anonymous_id` (first-party cookie and localStorage),
 *   records each page (path, title, referrer, UTM tags) to `/cxlp/p`, and
 *   follows client-side navigation by wrapping pushState and replaceState.
 * - It watches every form. When a valid email or a 10-digit phone is entered
 *   it sends the form's fields to `/cxlp/i` (identify), before the visitor
 *   presses send; on submit it sends them to `/cxlp/t` (formSubmitted).
 * - Fields it skips: type hidden, password and number, and anything named like
 *   a card number, password, token, birth date or SSN. Every other named field
 *   is sent with its value, which for a checkbox is its `value` whether or not
 *   it is ticked. So consent boxes on our forms carry no name; a hidden input
 *   beside each carries the real state to our server (components/lead-form.tsx).
 * - It does nothing when the browser sends Global Privacy Control, and sends
 *   nothing when Do Not Track is on or Web Crypto is missing.
 *
 * The pixel is the primary path into Lead Flows. A visitor it can't capture
 * (privacy signals, a blocked script) still reaches us through the site's own
 * pipeline (lib/lead-pipeline.ts), and each lead records whether the pixel
 * should have captured it (`source.homePlatformPixel`), so a server-side path
 * into Home Platform can skip the ones the pixel already delivered.
 */

import type { CrmLead } from "@/lib/crm";

export const HOME_PLATFORM_ORIGIN = "https://www.homeplatform.com";
export const HOME_PLATFORM_PIXEL_SRC = `${HOME_PLATFORM_ORIGIN}/cxlp/a.min.js`;
/** The id the pixel looks for; it reads `data-client-id` from this element. */
export const HOME_PLATFORM_PIXEL_ELEMENT_ID = "cxlp-ajs";
/** The cookie (and localStorage key) the pixel sets on its first run. */
export const HOME_PLATFORM_PIXEL_COOKIE = "cxlp_anonymous_id";

/** The team's Lead Flows client id, from the pixel code Home Platform issued (public: it appears in every page's HTML). */
const TEAM_CLIENT_ID = "bsw9jbac2nu2";

type Env = Record<string, string | undefined>;

/**
 * The client id to load the pixel with, or null to leave it off. Production
 * only: preview builds and local runs would put test visits and test leads into
 * the team's CRM. `NEXT_PUBLIC_HOME_PLATFORM_PIXEL_ID` overrides the id, and
 * `off` turns the pixel off everywhere; `HOME_PLATFORM_PIXEL_EVERYWHERE=true`
 * loads it outside production (for a deliberate end-to-end test).
 */
export function homePlatformPixelId(env: Env = process.env): string | null {
  const configured = env.NEXT_PUBLIC_HOME_PLATFORM_PIXEL_ID?.trim();
  if (configured === "off") return null;
  const id = configured || TEAM_CLIENT_ID;
  if (!/^[a-z0-9]{6,40}$/i.test(id)) return null;
  const production = (env.VERCEL_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV) === "production";
  return production || env.HOME_PLATFORM_PIXEL_EVERYWHERE === "true" ? id : null;
}

export type PixelSignals = {
  /** The pixel's script tag is on the page. */
  tag: boolean;
  /** `navigator.globalPrivacyControl`. */
  gpc: unknown;
  /** `window.doNotTrack || navigator.doNotTrack || navigator.msDoNotTrack`, as the pixel reads it. */
  dnt: unknown;
  /** `crypto.subtle` with digest and encrypt (the pixel's own check). */
  webCrypto: boolean;
  /** `document.cookie`, to see whether the pixel started and set its id. */
  cookie: string;
};

/** The pixel's own Do Not Track test: on for true, 1, "yes" and any string starting with "1". */
export function doNotTrackOn(dnt: unknown): boolean {
  return dnt === true || dnt === 1 || dnt === "yes" || (typeof dnt === "string" && dnt.charAt(0) === "1");
}

/**
 * Whether the pixel will have sent this visitor's form to Home Platform: its
 * tag is here, it started (its cookie is set), and none of the conditions under
 * which it stays silent hold.
 */
export function pixelWouldCapture(s: PixelSignals): boolean {
  if (!s.tag || Boolean(s.gpc) || doNotTrackOn(s.dnt) || !s.webCrypto) return false;
  return new RegExp(`(?:^|;\\s*)${HOME_PLATFORM_PIXEL_COOKIE}=[^;]+`).test(s.cookie);
}

type NoteLead = Pick<CrmLead, "firstName" | "lastName" | "referral" | "test"> & { source: Pick<CrmLead["source"], "homePlatformPixel"> };

/**
 * What Home Platform has of a lead, for the team email (lib/lead-alert.ts): a
 * sentence, and whether someone has to add the lead by hand. A lead from the
 * pixel arrives as a contact with name, email and phone, source "Pixel", in the
 * Leads group with status New, assigned to the account's owner, and its
 * activity shows "Submitted form on <page title>" and the pages they read
 * (checked with three test enquiries on 2026-10-09). The message, timing,
 * address and the boxes they ticked aren't kept, so the email carries them.
 */
export function homePlatformNote(lead: NoteLead, opts: { pixelOnSite: boolean; crmDelivered: boolean }): { line: string; addByHand: boolean } {
  const name = (first: string, last: string | null) => [first, last].filter(Boolean).join(" ").trim();
  const sender = name(lead.firstName, lead.lastName) || "the sender";
  const moving = lead.referral ? name(lead.referral.firstName, lead.referral.lastName) : null;
  const caught = opts.pixelOnSite && lead.source.homePlatformPixel;
  if (lead.test) return { line: "A test lead, so not one for Home Platform.", addByHand: false };
  if (opts.crmDelivered) {
    // The webhook path made the contact Home Platform needs; say only what the pixel added.
    return { line: caught ? `Home Platform should also have ${moving ? sender : "this contact"} from its Pixel lead flow.` : "", addByHand: false };
  }
  if (!opts.pixelOnSite) {
    return { line: "Home Platform's Pixel isn't on this deployment, so Home Platform doesn't have this one. Add it by hand if it's a real enquiry.", addByHand: true };
  }
  if (caught && !moving) {
    return { line: "Home Platform should already have this contact from its Pixel lead flow. It keeps only the name, email and phone, so the rest of the form is below.", addByHand: false };
  }
  if (caught && moving) {
    return { line: `Home Platform should have ${sender} from its Pixel lead flow, but not ${moving}, the person who's moving. Add ${moving} by hand.`, addByHand: true };
  }
  return {
    line: moving
      ? `Not in Home Platform: the Pixel didn't run in ${sender}'s browser. Add ${moving}, who's moving, and ${sender}, who referred them, by hand.`
      : "Not in Home Platform: the Pixel didn't run in their browser. Add them by hand.",
    addByHand: true,
  };
}

/** Read the signals in the browser; false on the server. */
export function pixelCapturingHere(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const win = window as Window & { doNotTrack?: string };
  const subtle = window.crypto?.subtle;
  return pixelWouldCapture({
    tag: Boolean(document.getElementById(HOME_PLATFORM_PIXEL_ELEMENT_ID)),
    gpc: nav.globalPrivacyControl,
    dnt: win.doNotTrack || nav.doNotTrack || nav.msDoNotTrack,
    webCrypto: Boolean(subtle && typeof subtle.digest === "function" && typeof subtle.encrypt === "function"),
    cookie: document.cookie,
  });
}

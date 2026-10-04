/**
 * Every sentence the subscriber emails and their pages say: the
 * confirmation, the welcome, the footer's unsubscribe line, the
 * /subscribe/confirm and /unsubscribe pages, the hold and send page the team
 * reaches from its email, and the lines added to the team email. No imports,
 * so scripts/check-copy.mjs runs the Fair Housing checker, the issue rules
 * and the voice rules over all of it at build time.
 *
 * The owner's rules: plain, direct and warm, with contractions. Short
 * sentences, never a stack of fragments. Nothing cute. Places, never people.
 * No license numbers. "Comes out", never "lands". Tokens in {braces} are
 * filled by lib/issues/copy.ts `fill`.
 */

export const CONFIRM_EMAIL_COPY = {
  subject: "Please confirm your {product} subscription",
  preheader: "Press the button in this email to start getting {product}.",
  title: "Please confirm your address",
  /** The Tide and Encore boxes. */
  introSignup: "Thanks for signing up for {product} at {domain}. Before we send anything, please confirm this is your email address.",
  /** Any other form with the email box ticked. */
  introConsent:
    "When you wrote to us at {domain}, you said we could email you. Our monthly email is Tide, on home sales in Lakewood Ranch, Sarasota and Bradenton. Before we send it, please confirm this is your email address.",
  button: "Yes, send me {product}",
  expiry: "The button works for {days} days. If you didn’t sign up, ignore this email and you won’t hear from us again.",
  fallback: "If the button doesn’t work, copy this link into your browser:",
  why: "You’re getting this one email because this address was entered on a form at {domain}.",
} as const;

export const WELCOME_COPY = {
  tide: {
    subject: "Welcome to Tide",
    preheader: "Tide comes out in the first days of each month.",
    title: "You’re subscribed",
    body: "Thanks for confirming. Tide comes out in the first days of each month. Each letter covers home sales in Lakewood Ranch, Sarasota and Bradenton, with every number from the county’s public record.",
    next: "The latest letter is on the site now.",
    button: "Read the latest Tide",
  },
  encore: {
    subject: "Welcome to Encore",
    preheader: "Encore comes out on Monday mornings.",
    title: "You’re subscribed",
    body: "Thanks for confirming. Encore comes out on Monday mornings with the week’s arts events in Lakewood Ranch, Sarasota and Bradenton.",
    next: "This week’s events are on the calendar now.",
    button: "Open the calendar",
  },
} as const;

/** The footer line in every email sent to a subscriber, with the two links. */
export const SUBSCRIBER_FOOTER_COPY = {
  label: "To unsubscribe:",
  list: "Stop {product}",
  all: "stop all email from us",
  /** "{list} or {all}. You can also reply ‘stop’." */
  line: "{list} or {all}. You can also reply ‘stop’.",
} as const;

/** /subscribe/confirm */
export const CONFIRM_PAGE_COPY = {
  eyebrow: "Subscribe",
  title: "Confirm your subscription",
  body: "Press the button and {product} starts with the next issue.",
  button: "Yes, send me {product}",
  pending: "Confirming…",
  doneTitle: "You’re subscribed.",
  doneTide: "Tide comes out in the first days of each month. We’ve sent you a short welcome email with a link to the latest letter.",
  doneEncore: "Encore comes out on Monday mornings. We’ve sent you a short welcome email with a link to the calendar.",
  alreadyTitle: "You’re already subscribed.",
  alreadyBody: "This address already gets {product}. There’s nothing more to do.",
  unsubscribedTitle: "Nothing has changed.",
  unsubscribedBody: "This address stopped {product} after this link was sent. If you’d like it back, sign up again on the site.",
  invalidTitle: "This link doesn’t work.",
  invalidBody: "It may have expired, or part of it may be missing. Sign up again on the site and we’ll send you a new one.",
  error: "We couldn’t confirm that just now. Please try again in a minute.",
  home: "Back to the front page",
} as const;

/** /unsubscribe */
export const UNSUBSCRIBE_PAGE_COPY = {
  eyebrow: "Unsubscribe",
  title: "Stop our email",
  bodyList: "Choose what to stop. It takes effect right away.",
  bodyAll: "Press the button and we’ll stop sending email to this address.",
  buttonList: "Stop {product}",
  buttonAll: "Stop all email from us",
  pending: "Unsubscribing…",
  doneListTitle: "You’re unsubscribed from {product}.",
  doneListBody: "You won’t get another issue. Anything else you get from us keeps coming until you stop it too.",
  doneAllTitle: "You’re unsubscribed.",
  doneAllBody: "We won’t send any more email to this address. If you write to us, we’ll still answer you.",
  invalidTitle: "This link doesn’t work.",
  invalidBody: "Part of it may be missing. Reply ‘stop’ to any of our emails and we’ll take you off the list by hand.",
  invalid: "This unsubscribe link doesn’t work.",
  error: "We couldn’t do that just now. Please try again in a minute.",
  home: "Back to the front page",
} as const;

/** The one-click unsubscribe endpoint's plain-text answer (RFC 8058); mail apps rarely show it. */
export const ONE_CLICK_COPY = {
  done: "You’re unsubscribed from {product}.",
  invalid: "This unsubscribe link doesn’t work.",
} as const;

/** The lines the team email gets when the site sends to subscribers (lib/issues/handoff.ts). */
export const TEAM_SEND_COPY = {
  scheduled: "It goes to {count} confirmed {subscribers} on {when}, unless you hold it.",
  scheduledNone: "It goes to confirmed subscribers on {when}, unless you hold it. There aren’t any yet.",
  tideBoxes: "Subscribers get it without the dashed boxes and the facts list. A story or a note that’s written and deployed before then goes in.",
  held: "This issue is on hold. It won’t go to subscribers until someone presses “Send it now”.",
  heldBySystem: "This issue is on hold because {reason}. It won’t go to subscribers until someone presses “Send it now”.",
  heldFairHousing: "It won’t go to subscribers while the Fair Housing checker flags it.",
  sent: "This issue already went to subscribers on {when}. It won’t be sent again.",
  sending: "This issue is going out to subscribers now.",
  expired: "This issue’s send window has passed, so it won’t go to subscribers.",
  address: "It can’t go to subscribers until the office street address and ZIP are in settings. CAN-SPAM needs a postal address in every send.",
  sendLabel: "Send it now",
  holdLabel: "Hold this issue",
  linksNote: "Each button opens a page on the site where you confirm.",
  failed: "The subscriber send couldn’t be set up: {error}. Nothing will go out on its own; check the logs.",
} as const;

/** The page the team's "Send it now" and "Hold this issue" links open. */
export const ISSUE_ACTION_COPY = {
  holdTitle: "Hold this issue",
  holdBody: "{issue} won’t go to subscribers until someone presses “Send it now” in the team email.",
  holdButton: "Hold it",
  sendTitle: "Send this issue now",
  sendBody: "{issue} goes to {count} confirmed {subscribers} when you press the button. If today’s sending limit runs out, the rest go out the next day.",
  sendButton: "Send it now",
  heldDone: "It’s on hold. Nothing goes to subscribers until someone presses “Send it now”.",
  sentDone: "It went to {sent} {subscribers}.",
  sentPartial: "It went to {sent} {subscribers}. The other {left} go out the next day, when the daily limit resets.",
  alreadySent: "This issue already went to subscribers on {when}.",
  expired: "This issue’s send window has passed. Nothing was sent.",
  refused: "It wasn’t sent: {reason}.",
  invalid: "This link has expired or doesn’t work. The next team email has new links.",
  off: "Sending to subscribers isn’t switched on for this site, so nothing was sent.",
  missing: "There’s no send on record for this issue.",
  pending: "Working…",
} as const;

/** What the lead form and the thank-you page say once a confirmation email is on its way. */
export const SIGNUP_COPY = {
  inlineTide: "Check your inbox. We’ve sent you an email to confirm your address, and Tide starts once you do.",
  inlineEncore: "Check your inbox. We’ve sent you an email to confirm your address, and Encore starts once you do.",
  thanksEyebrow: "Check your inbox",
  thanksTide: "We’ve sent you an email to confirm your address. Tide starts once you press the button in it.",
  thanksEncore: "We’ve sent you an email to confirm your address. Encore starts once you press the button in it.",
} as const;

/** Every string above, with where it lives, for scripts/check-copy.mjs and the tests. */
export function newsletterStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const groups = {
    CONFIRM_EMAIL_COPY,
    "WELCOME_COPY.tide": WELCOME_COPY.tide,
    "WELCOME_COPY.encore": WELCOME_COPY.encore,
    SUBSCRIBER_FOOTER_COPY,
    CONFIRM_PAGE_COPY,
    UNSUBSCRIBE_PAGE_COPY,
    ONE_CLICK_COPY,
    TEAM_SEND_COPY,
    ISSUE_ACTION_COPY,
    SIGNUP_COPY,
  };
  for (const [group, obj] of Object.entries(groups)) {
    for (const [k, v] of Object.entries(obj)) out.push({ where: `lib/newsletter/copy.ts ${group}.${k}`, text: v });
  }
  return out;
}

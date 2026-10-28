/**
 * Every sentence Street Watch says: the button and its box, the
 * confirmation and the weekly digest, the confirm and unsubscribe pages,
 * and the line in the team's lead email. No imports, so scripts/check-copy.mjs
 * runs the Fair Housing checker and the voice rules over all of it.
 *
 * The owner's rules: plain and warm, contractions, nothing cute. Places and
 * sales, never people. Every figure in the digest is computed from the
 * county record; this file holds none. Tokens in {braces} are filled by
 * lib/issues/copy.ts `fill`.
 */

export const WATCH_BUTTON_COPY = {
  street: "Watch this street",
  place: "Watch this place",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  note: "You can stop any time, and we never share the list.",
  pending: "Looking…",
  /** The box replaced by this once the server has it. */
  done: "We’ll email you when the county records a sale here.",
  doneConfirm: "Check your inbox first: Street Watch starts once you press the button in our email.",
  /** With subscriber email off (a preview, or before launch): the team has the request and will follow up by hand. */
  doneManual: "Thanks. We have your request and we’ll be in touch.",
  closeLabel: "Close",
} as const;

export const WATCH_CONFIRM_EMAIL_COPY = {
  subject: "Please confirm: Street Watch for {label}",
  preheader: "Press the button and we’ll email you when the county records a sale on {label}.",
  eyebrow: "Street Watch · From the county record",
  title: "Please confirm your address",
  intro: "You asked us at {domain} to watch {label}. When the county records a sale there, we’ll send you the address, the date and the price, at most once a week. Before we send anything, please confirm this is your email address.",
  button: "Yes, watch {label}",
  expiry: "The button works for {days} days. If you didn’t ask for this, ignore this email and you won’t hear from us again.",
  fallback: "If the button doesn’t work, copy this link into your browser:",
  why: "You’re getting this one email because this address was entered on a form at {domain}.",
} as const;

export const WATCH_DIGEST_COPY = {
  subjectOne: "New on the record: {label}",
  subjectMany: "New on the record: {label} and {more} more",
  preheader: "{count} {sales} the county recorded since the last update.",
  eyebrow: "Street Watch · From the county record",
  title: "New on the record",
  intro: "Here’s what the county recorded since our last update, at most once a week. Every figure is from the county’s public record.",
  sectionStreet: "{label}",
  sectionPlace: "{label}",
  /** One sale: "14447 Lilac Sky Ter · sold Aug 28, 2026 · $275,000 · $214 per sq ft". */
  perSqft: "{value} per sq ft",
  newBuild: "new build or lot",
  sold: "sold {date}",
  more: "And {count} more on Tide Street.",
  medianStreet: "Median resale on this street over the last 12 months: {value} ({count} {sales}).",
  medianPlace: "Median resale here over the last 12 months: {value} ({count} {sales}).",
  medianNone: "Too few resales in the last 12 months for a median.",
  basisZip: "Sales in the {zips} ZIP area, since the county files none of {label}’s subdivisions by name.",
  open: "See it on Tide Street",
  stop: "Stop watching {label}",
  through: "{county} records through {date}.",
  lag: "The county records a sale a few weeks after it closes.",
  homeValue: "For a number on your own home, ask us. We’ll walk it and call you with the reason for it.",
  homeValueButton: "Ask for your home’s value",
  why: "You’re getting this because you asked us to watch {labels} at {domain}.",
  stopAll: "Stop every Street Watch",
  stopEverything: "stop all email from us",
  /** "{watches} or {all}. You can also reply ‘stop’." */
  stopLine: "{watches} or {all}. You can also reply ‘stop’.",
} as const;

/** /watch/confirm */
export const WATCH_CONFIRM_PAGE_COPY = {
  title: "Confirm your Street Watch",
  body: "Press the button and we’ll email you when the county records a sale on {label}, at most once a week.",
  button: "Yes, watch {label}",
  pending: "Confirming…",
  doneTitle: "You’re watching {label}.",
  doneBody: "When the county records a sale there, we’ll email you the address, the date and the price. The county records sales a few weeks after they close.",
  doneLink: "See it on Tide Street",
  alreadyTitle: "You’re already watching {label}.",
  alreadyBody: "There’s nothing more to do.",
  unsubscribedTitle: "Nothing has changed.",
  unsubscribedBody: "This address stopped this Street Watch after the link was sent. If you’d like it back, press Watch on the site again.",
  invalidTitle: "This link doesn’t work.",
  invalidBody: "It may have expired, or part of it may be missing. Press Watch on the site again and we’ll send you a new one.",
  error: "We couldn’t confirm that just now. Please try again in a minute.",
  home: "Back to the front page",
} as const;

/** The /unsubscribe page and the one-click answer, for a Street Watch link. */
export const WATCH_UNSUBSCRIBE_COPY = {
  button: "Stop watching {label}",
  buttonAll: "Stop every Street Watch",
  doneTitle: "You’re no longer watching {label}.",
  doneAllTitle: "Street Watch is off.",
  doneBody: "You won’t get another Street Watch email for it. Anything else you get from us keeps coming until you stop it too.",
  doneAllBody: "You won’t get another Street Watch email. Anything else you get from us keeps coming until you stop it too.",
  oneClick: "You’re unsubscribed from Street Watch.",
  fallbackLabel: "this street",
} as const;

/** The line in the team's lead email and the CRM note. */
export const WATCH_TEAM_COPY = {
  label: "Watching",
  line: "{label} (Street Watch: an email when the county records a sale there; a warm signal, they’re following the market here)",
} as const;

/** Every string above, with where it lives, for scripts/check-copy.mjs. */
export function watchStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const groups = { WATCH_BUTTON_COPY, WATCH_CONFIRM_EMAIL_COPY, WATCH_DIGEST_COPY, WATCH_CONFIRM_PAGE_COPY, WATCH_UNSUBSCRIBE_COPY, WATCH_TEAM_COPY };
  for (const [group, obj] of Object.entries(groups)) {
    for (const [k, v] of Object.entries(obj)) out.push({ where: `lib/watch/copy.ts ${group}.${k}`, text: v });
  }
  return out;
}

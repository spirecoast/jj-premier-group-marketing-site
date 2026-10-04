import { FOOTER_COPY, TEAM_NAMES, fill } from "../issues/copy";
import {
  C,
  SANS,
  SERIF,
  absolute,
  addressLine,
  column,
  documentHtml,
  esc,
  footer,
  header,
  para,
  small,
  spacer,
  tagged,
  wrap,
  type FooterInput,
} from "../issues/render";
import { CONFIRM_EMAIL_COPY, WELCOME_COPY } from "./copy";
import type { UnsubscribeLinks } from "./headers";
import { LIST_NAME, type NewsletterList } from "./lists";

/**
 * The two emails a new subscriber gets before the first issue, and the
 * per-recipient step for the issues. Pure: built from the same pieces as the
 * issues (lib/issues/render.ts: tables, inline styles, a 600px column, the
 * brand colors as hex) and every sentence from lib/newsletter/copy.ts.
 *
 * - The confirmation: one short note and one button. It isn't a newsletter
 *   and the reader isn't on a list yet, so its footer says why they have it
 *   instead of how to stop.
 * - The welcome, once confirmed: two short paragraphs and a button to the
 *   latest Tide or to the calendar, with the full footer and the
 *   subscriber's unsubscribe links.
 */

export type EmailContent = { subject: string; preheader: string; html: string; text: string };
export type FooterFacts = Omit<FooterInput, "product" | "unsubscribe">;

const EYEBROW: Record<NewsletterList, string> = {
  tide: "Tide · The Coast real estate newsletter",
  encore: "Encore Arts Calendar · Every Monday",
};

/** A button that works in Outlook too: a table cell with the color, the link inside it. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px 0;"><tr><td style="background-color:${C.navy};border-radius:2px;"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:16px;line-height:1.2;color:${C.white};text-decoration:none;font-weight:bold;">${esc(label)}</a></td></tr></table>`;
}

/** The confirmation's footer: who sent it, the postal address and why the reader has it. */
function confirmFooter(f: FooterFacts): { html: string; text: string } {
  const sentBy = fill(FOOTER_COPY.sentBy, { names: TEAM_NAMES, team: f.teamName, brokerage: f.brokerageName });
  const address = addressLine(f.officeAddress);
  const why = fill(CONFIRM_EMAIL_COPY.why, { domain: f.domain });
  const line = (s: string) => `<p style="margin:0 0 8px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};">${esc(s)}</p>`;
  const parts = [sentBy, address || null, f.phoneDisplay ? `${FOOTER_COPY.phoneLabel} ${f.phoneDisplay}` : null, why, FOOTER_COPY.equalHousing].filter((l): l is string => Boolean(l));
  return {
    html: `<tr><td style="padding:24px 32px 28px 32px;background-color:${C.linen};border-top:1px solid ${C.rule};">\n${parts.map(line).join("\n")}\n</td></tr>`,
    text: ["--", ...parts].join("\n"),
  };
}

export function confirmationEmail(input: {
  list: NewsletterList;
  /** "signup" for the Tide and Encore boxes, "consent" for the email box on another form. */
  origin: "signup" | "consent";
  confirmUrl: string;
  footer: FooterFacts;
  ttlDays: number;
}): EmailContent {
  const product = LIST_NAME[input.list];
  const vars = { product, domain: input.footer.domain, days: input.ttlDays };
  const subject = fill(CONFIRM_EMAIL_COPY.subject, vars);
  const preheader = fill(CONFIRM_EMAIL_COPY.preheader, vars);
  const intro = fill(input.origin === "consent" && input.list === "tide" ? CONFIRM_EMAIL_COPY.introConsent : CONFIRM_EMAIL_COPY.introSignup, vars);
  const label = fill(CONFIRM_EMAIL_COPY.button, vars);
  const expiry = fill(CONFIRM_EMAIL_COPY.expiry, vars);
  const foot = confirmFooter(input.footer);
  const home = absolute(input.footer.siteUrl, "/");
  const rows = [
    header({ eyebrow: EYEBROW[input.list], wordmark: product, title: CONFIRM_EMAIL_COPY.title, homeHref: home }),
    spacer(24),
    `<tr><td style="padding:0 32px 8px 32px;background-color:${C.paper};">${para(esc(intro))}${button(input.confirmUrl, label)}${para(esc(expiry), "font-size:15px;")}${small(`${esc(CONFIRM_EMAIL_COPY.fallback)}<br><a href="${esc(input.confirmUrl)}" style="color:${C.link};word-break:break-all;">${esc(input.confirmUrl)}</a>`)}</td></tr>`,
    spacer(8),
    foot.html,
  ];
  const html = documentHtml({ title: subject, preheader, body: column(rows.join("\n")) });
  const text = wrap([product.toUpperCase(), "", intro, "", `${label}:`, input.confirmUrl, "", expiry, "", foot.text].join("\n"));
  return { subject, preheader, html, text };
}

export function welcomeEmail(input: {
  list: NewsletterList;
  footer: FooterFacts;
  /** The newest Tide issue page (/tide/<issue>); Encore's welcome links the calendar. */
  latestTidePath: string;
  unsubscribe: Pick<UnsubscribeLinks, "list" | "all">;
}): EmailContent {
  const copy = WELCOME_COPY[input.list];
  const product = LIST_NAME[input.list];
  const campaign = "welcome";
  const path = input.list === "tide" ? input.latestTidePath : "/calendar";
  const href = tagged(absolute(input.footer.siteUrl, path), input.list, campaign);
  const foot = footer({ ...input.footer, product, unsubscribe: { list: input.unsubscribe.list, all: input.unsubscribe.all } }, input.list, campaign);
  const rows = [
    header({ eyebrow: EYEBROW[input.list], wordmark: product, title: copy.title, homeHref: tagged(absolute(input.footer.siteUrl, input.list === "tide" ? "/tide" : "/calendar"), input.list, campaign) }),
    spacer(24),
    `<tr><td style="padding:0 32px 8px 32px;background-color:${C.paper};">${para(esc(copy.body))}${para(esc(copy.next), `font-family:${SERIF};font-size:19px;line-height:1.45;color:${C.navy};`)}${button(href, copy.button)}</td></tr>`,
    spacer(8),
    foot.html,
  ];
  const html = documentHtml({ title: copy.subject, preheader: copy.preheader, body: column(rows.join("\n")) });
  const text = wrap([product.toUpperCase(), "", copy.body, "", copy.next, `${copy.button}: ${href}`, "", foot.text].join("\n"));
  return { subject: copy.subject, preheader: copy.preheader, html, text };
}

/**
 * Placeholders the subscriber copy of an issue is built with, one per
 * unsubscribe link. Built once per send; each recipient's links go in with
 * `personalize`, so the issue (and its Tide figures) isn't rebuilt per person.
 */
export const UNSUBSCRIBE_PLACEHOLDERS = { list: "%%UNSUBSCRIBE_LIST_URL%%", all: "%%UNSUBSCRIBE_ALL_URL%%" } as const;

export function personalize(content: { html: string; text: string }, links: Pick<UnsubscribeLinks, "list" | "all">): { html: string; text: string } {
  return {
    html: content.html.replaceAll(UNSUBSCRIBE_PLACEHOLDERS.list, esc(links.list)).replaceAll(UNSUBSCRIBE_PLACEHOLDERS.all, esc(links.all)),
    text: content.text.replaceAll(UNSUBSCRIBE_PLACEHOLDERS.list, links.list).replaceAll(UNSUBSCRIBE_PLACEHOLDERS.all, links.all),
  };
}

/** True when a built issue still has a placeholder or the team's dashed boxes in it: it must never go to a subscriber like that. */
export function unsentable(content: { html: string; text: string }): string | null {
  if (/%%UNSUBSCRIBE_[A-Z]+_URL%%/.test(content.html + content.text)) return "an unsubscribe placeholder wasn't filled in";
  if (/border:2px dashed/.test(content.html)) return "a dashed box for the team is still in it";
  return null;
}

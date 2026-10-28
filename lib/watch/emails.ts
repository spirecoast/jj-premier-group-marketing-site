import { FOOTER_COPY, TEAM_NAMES, fill } from "../issues/copy";
import { C, SANS, SERIF, absolute, addressLine, column, dateLong, documentHtml, esc, header, link, para, small, spacer, wrap } from "../issues/render";
import type { EmailContent, FooterFacts } from "../newsletter/emails";
import { SUBSCRIBER_FOOTER_COPY } from "../newsletter/copy";
import { WATCH_CONFIRM_EMAIL_COPY as CONFIRM, WATCH_DIGEST_COPY as D } from "./copy";

/**
 * Street Watch's two emails, built from the same pieces as Tide and Encore
 * (lib/issues/render.ts) and every sentence from lib/watch/copy.ts. Pure.
 *
 * - The confirmation: one short note and one button (double opt-in, as the
 *   newsletter). Its footer says why the reader has it, not how to stop.
 * - The digest: one section per watched street or place with the sales the
 *   county recorded since the last update, the 12-month median resale for
 *   it, how far each county's record reaches, the way to ask for a home's
 *   value, and a stop link per watch plus "stop every Street Watch" and
 *   "stop all email from us".
 */

export const WORDMARK = "Street Watch";
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** utm tags so a visit from the email shows up as one, and rides into the CRM. */
export function watchTagged(url: string, campaign: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "street-watch");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px 0;"><tr><td style="background-color:${C.navy};border-radius:2px;"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:16px;line-height:1.2;color:${C.white};text-decoration:none;font-weight:bold;">${esc(label)}</a></td></tr></table>`;
}

const footLine = (s: string) => `<p style="margin:0 0 8px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};">${s}</p>`;

function footerRows(f: FooterFacts, why: string, stop: { html: string; text: string } | null): { html: string; text: string } {
  const sentBy = fill(FOOTER_COPY.sentBy, { names: TEAM_NAMES, team: f.teamName, brokerage: f.brokerageName });
  const address = addressLine(f.officeAddress);
  const plain = [sentBy, address || null, f.phoneDisplay ? `${FOOTER_COPY.phoneLabel} ${f.phoneDisplay}` : null, why].filter((l): l is string => Boolean(l));
  return {
    html: `<tr><td style="padding:24px 32px 28px 32px;background-color:${C.linen};border-top:1px solid ${C.rule};">\n${plain.map((l) => footLine(esc(l))).join("\n")}\n${stop ? footLine(stop.html) : ""}\n${footLine(esc(FOOTER_COPY.equalHousing))}\n</td></tr>`,
    text: ["--", ...plain, ...(stop ? [stop.text] : []), FOOTER_COPY.equalHousing].join("\n"),
  };
}

export function watchConfirmationEmail(input: { label: string; confirmUrl: string; footer: FooterFacts; ttlDays: number }): EmailContent {
  const vars = { label: input.label, domain: input.footer.domain, days: input.ttlDays };
  const subject = fill(CONFIRM.subject, vars);
  const preheader = fill(CONFIRM.preheader, vars);
  const intro = fill(CONFIRM.intro, vars);
  const label = fill(CONFIRM.button, vars);
  const expiry = fill(CONFIRM.expiry, vars);
  const foot = footerRows(input.footer, fill(CONFIRM.why, vars), null);
  const rows = [
    header({ eyebrow: CONFIRM.eyebrow, wordmark: WORDMARK, title: CONFIRM.title, homeHref: absolute(input.footer.siteUrl, "/") }),
    spacer(24),
    `<tr><td style="padding:0 32px 8px 32px;background-color:${C.paper};">${para(esc(intro))}${button(input.confirmUrl, label)}${para(esc(expiry), "font-size:15px;")}${small(`${esc(CONFIRM.fallback)}<br><a href="${esc(input.confirmUrl)}" style="color:${C.link};word-break:break-all;">${esc(input.confirmUrl)}</a>`)}</td></tr>`,
    spacer(8),
    foot.html,
  ];
  const html = documentHtml({ title: subject, preheader, body: column(rows.join("\n")) });
  const text = wrap([WORDMARK.toUpperCase(), "", intro, "", `${label}:`, input.confirmUrl, "", expiry, "", foot.text].join("\n"));
  return { subject, preheader, html, text };
}

export type DigestSale = { address: string; saleDate: string; salePrice: number; pricePerSqft: number | null; newBuild: boolean };

export type DigestSection = {
  label: string;
  kind: "street" | "place";
  /** The newest few, already cut; `more` says how many were left off. */
  sales: DigestSale[];
  more: number;
  /** The 12-month median resale for the street or place, over `count` resales; null with too few. */
  median: { value: number; count: number } | null;
  /** Set when a place's sales are its ZIP area's, not its own subdivisions'. */
  zipBasis: string[] | null;
  openUrl: string;
  stopUrl: string;
};

/** "14447 Lilac Sky Ter · sold Aug 28, 2026 · $275,000 · $214 per sq ft" */
export function saleLine(s: DigestSale): string {
  const [y, m, d] = s.saleDate.split("-").map(Number) as [number, number, number];
  const date = `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}, ${y}`;
  return [s.address, fill(D.sold, { date }), usd.format(s.salePrice), s.newBuild ? D.newBuild : s.pricePerSqft ? fill(D.perSqft, { value: usd.format(s.pricePerSqft) }) : null].filter(Boolean).join(" · ");
}

export function digestEmail(input: {
  sections: DigestSection[];
  /** How far each county's record reaches, for the counties in the digest. */
  through: { county: string; to: string }[];
  footer: FooterFacts;
  links: { watches: string; all: string };
  campaign: string;
}): EmailContent {
  const { sections } = input;
  const count = sections.reduce((n, s) => n + s.sales.length + s.more, 0);
  const salesWord = (n: number) => (n === 1 ? "sale" : "sales");
  const first = sections[0]!;
  const subject = sections.length === 1 ? fill(D.subjectOne, { label: first.label }) : fill(D.subjectMany, { label: first.label, more: sections.length - 1 });
  const preheader = fill(D.preheader, { count, sales: salesWord(count) });
  const site = input.footer.siteUrl;
  const homeValue = watchTagged(absolute(site, "/sell/home-value#ask"), input.campaign);

  const blocks: string[] = [];
  const textBlocks: string[] = [];
  for (const s of sections) {
    const open = watchTagged(s.openUrl, input.campaign);
    const lines = s.sales.map(saleLine);
    const medianLine = s.median
      ? fill(s.kind === "street" ? D.medianStreet : D.medianPlace, { value: usd.format(s.median.value), count: s.median.count, sales: s.median.count === 1 ? "sale" : "sales" })
      : D.medianNone;
    const basis = s.zipBasis ? fill(D.basisZip, { zips: s.zipBasis.join(", "), label: s.label }) : null;
    blocks.push(
      `<tr><td style="padding:0 32px 8px 32px;background-color:${C.paper};">` +
        `<h2 style="margin:12px 0 12px 0;font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:normal;color:${C.navy};">${esc(s.label)}</h2>` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px 0;">${lines
          .map((l) => `<tr><td style="padding:9px 0;border-top:1px solid ${C.rule};font-family:${SANS};font-size:15px;line-height:1.45;color:${C.ink};">${esc(l)}</td></tr>`)
          .join("")}</table>` +
        (s.more ? para(esc(fill(D.more, { count: s.more })), "font-size:15px;") : "") +
        para(esc(medianLine), "font-size:15px;") +
        (basis ? small(esc(basis)) : "") +
        `<p style="margin:0 0 18px 0;font-family:${SANS};font-size:15px;line-height:1.5;">${link(open, D.open)} &middot; ${link(s.stopUrl, fill(D.stop, { label: s.label }), `color:${C.muted};`)}</p>` +
        `</td></tr>`,
    );
    textBlocks.push([s.label.toUpperCase(), ...lines.map((l) => `- ${l}`), ...(s.more ? [fill(D.more, { count: s.more })] : []), medianLine, ...(basis ? [basis] : []), `${D.open}: ${open}`, `${fill(D.stop, { label: s.label })}: ${s.stopUrl}`].join("\n"));
  }

  const throughLines = input.through.map((t) => fill(D.through, { county: t.county, date: dateLong(t.to) }));
  const labels = sections.map((s) => s.label);
  const why = fill(D.why, { labels: labels.length === 1 ? labels[0]! : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`, domain: input.footer.domain });
  const stopStrong = `<strong style="color:${C.ink};">${esc(SUBSCRIBER_FOOTER_COPY.label)}</strong>`;
  const stop = {
    html: `${stopStrong} ${fill(esc(D.stopLine), { watches: link(input.links.watches, D.stopAll), all: link(input.links.all, D.stopEverything) })}`,
    text: `${SUBSCRIBER_FOOTER_COPY.label} ${fill(D.stopLine, { watches: `${D.stopAll} (${input.links.watches})`, all: `${D.stopEverything} (${input.links.all})` })}`,
  };
  const foot = footerRows(input.footer, why, stop);

  const rows = [
    header({ eyebrow: D.eyebrow, wordmark: WORDMARK, title: D.title, homeHref: watchTagged(absolute(site, "/sell/sold"), input.campaign) }),
    spacer(24),
    `<tr><td style="padding:0 32px 4px 32px;background-color:${C.paper};">${para(esc(D.intro))}</td></tr>`,
    ...blocks,
    `<tr><td style="padding:0 32px 8px 32px;background-color:${C.paper};">${throughLines.map((l) => small(esc(l))).join("")}${small(esc(D.lag))}</td></tr>`,
    `<tr><td style="padding:8px 32px 8px 32px;background-color:${C.paper};">${para(esc(D.homeValue), `font-family:${SERIF};font-size:19px;line-height:1.45;color:${C.navy};`)}${button(homeValue, D.homeValueButton)}</td></tr>`,
    foot.html,
  ];
  const html = documentHtml({ title: subject, preheader, body: column(rows.join("\n")) });
  const text = wrap([WORDMARK.toUpperCase(), "", D.intro, "", ...textBlocks.flatMap((b) => [b, ""]), ...throughLines, D.lag, "", D.homeValue, `${D.homeValueButton}: ${homeValue}`, "", foot.text].join("\n"));
  return { subject, preheader, html, text };
}

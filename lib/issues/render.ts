import { SUBSCRIBER_FOOTER_COPY } from "../newsletter/copy";
import { FOOTER_COPY, TEAM_NAMES, fill } from "./copy";

/**
 * The email building blocks both issues share: escaping, the document
 * shell, the header band, headings, the footer, and plain-text helpers.
 *
 * Email clients are not browsers: everything here is tables, inline styles,
 * a 600px column, system fonts and the brand colors written out as hex (the
 * site's CSS variables do not exist in an inbox). No external CSS, no
 * scripts, no web fonts; images only from the site's own absolute URLs.
 */

export type MarketSlug = "lakewood-ranch" | "sarasota" | "bradenton";

export const MARKET_NAMES: Record<MarketSlug, string> = {
  "lakewood-ranch": "Lakewood Ranch",
  sarasota: "Sarasota",
  bradenton: "Bradenton",
};
export const MARKET_ORDER: MarketSlug[] = ["lakewood-ranch", "sarasota", "bradenton"];

/** From app/globals.css, written out for the inbox. */
export const C = {
  paper: "#faf8f5",
  linen: "#f3eee6",
  rule: "#e6ddd1",
  ink: "#2b2d30",
  muted: "#63666a",
  navy: "#2e4a5c",
  deepHarbor: "#1e3442",
  amber: "#96702a",
  link: "#2c6e7e",
  mist: "#c7e7ef",
  white: "#ffffff",
} as const;

export const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', Times, serif";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c] ?? c);

export type IssueKind = "encore" | "tide";

export type Issue = {
  kind: IssueKind;
  /** The subject line for subscribers. The team email has its own (teamSubject). */
  subject: string;
  /** The hidden preview line most inboxes show after the subject. */
  preheader: string;
  period: { from: string; to: string; label: string };
  /** The whole document, ready to paste into a send tool. */
  html: string;
  /** Just the 600px column, for wrapping (the team email puts a note above it). */
  bodyHtml: string;
  text: string;
  /** True when the issue has a section a person must write before it goes out (Tide). */
  needsEdit: boolean;
  /** The exact placeholder text to replace, when needsEdit. */
  placeholder?: string;
  /** Things the team should know before sending: a missing address, a partial month, a thin week. */
  warnings: string[];
  /** Set when the issue must not reach the Zap (a Tide month that isn't complete): the team gets an alert instead. */
  hold?: string;
};

export type Address = { street: string; city: string; state: string; zip: string };

export type FooterInput = {
  siteUrl: string;
  domain: string;
  teamName: string;
  brokerageName: string;
  officeAddress: Address;
  phoneDisplay?: string;
  /** The product the reader signed up for, in the "why you got this" line. */
  product: string;
  /**
   * The subscriber's own unsubscribe links, when the site sends the email
   * itself (lib/newsletter). Without them the footer says to reply 'stop' or
   * use the send tool's link, as the team's copy always has.
   */
  unsubscribe?: { list: string; all: string };
};

/** "1 Main St, Lakewood Ranch, FL 34202", leaving out what settings doesn't have. */
export function addressLine(a: Address): string {
  const cityState = [a.city, [a.state, a.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.street, cityState].filter(Boolean).join(", ");
}

/** CAN-SPAM needs a valid postal address in every commercial email. */
export function addressWarnings(a: Address): string[] {
  if (a.street && a.zip) return [];
  return [
    "The office street address and ZIP are empty in settings (docs/LAUNCH.md 1.1), so the footer shows only the city. CAN-SPAM needs a valid postal address in every send: add it in settings, or in the send tool's footer, before this goes out.",
  ];
}

export function absolute(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

/** Campaign tags so a visit from the issue shows up as one in analytics and rides into the CRM. */
export function tagged(url: string, kind: IssueKind, campaign: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", kind);
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

export function link(href: string, label: string, style = ""): string {
  return `<a href="${esc(href)}" style="color:${C.link};text-decoration:underline;${style}">${esc(label)}</a>`;
}

/** A padded row of the main column. */
export function row(inner: string, pad = "0 32px 24px 32px", bg: string = C.paper): string {
  return `<tr><td style="padding:${pad};background-color:${bg};">${inner}</td></tr>`;
}

export function para(html: string, style = ""): string {
  return `<p style="margin:0 0 14px 0;font-family:${SANS};font-size:16px;line-height:1.55;color:${C.ink};${style}">${html}</p>`;
}

export function small(html: string, style = ""): string {
  return `<p style="margin:0 0 10px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};${style}">${html}</p>`;
}

export function heading(text: string): string {
  return `<h2 style="margin:8px 0 14px 0;font-family:${SERIF};font-size:24px;line-height:1.25;font-weight:normal;color:${C.navy};">${esc(text)}</h2>`;
}

export function rule(): string {
  return `<tr><td style="padding:0 32px;background-color:${C.paper};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.rule};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table></td></tr>`;
}

export function spacer(h = 16): string {
  return `<tr><td style="height:${h}px;font-size:0;line-height:0;background-color:${C.paper};">&nbsp;</td></tr>`;
}

/** The navy band at the top: eyebrow, the product's name, the issue's title. */
export function header({ eyebrow, wordmark, title, homeHref }: { eyebrow: string; wordmark: string; title: string; homeHref: string }): string {
  return `<tr><td style="padding:28px 32px 26px 32px;background-color:${C.navy};">
<p style="margin:0 0 10px 0;font-family:${SANS};font-size:12px;line-height:1.4;letter-spacing:1.5px;text-transform:uppercase;color:${C.mist};">${esc(eyebrow)}</p>
<p style="margin:0 0 6px 0;font-family:${SERIF};font-size:40px;line-height:1.1;color:${C.white};"><a href="${esc(homeHref)}" style="color:${C.white};text-decoration:none;">${esc(wordmark)}</a></p>
<p style="margin:0;font-family:${SERIF};font-size:20px;line-height:1.35;font-style:italic;color:${C.white};">${esc(title)}</p>
</td></tr>`;
}

/** The shell: doctype, a hidden preheader, the linen ground and the 600px column. */
export function documentHtml({ title, preheader, body }: { title: string; preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.linen};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.linen};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.linen};">
<tr><td align="center" style="padding:24px 8px;">
${body}
</td></tr>
</table>
</body>
</html>
`;
}

/** The 600px column that holds the rows. */
export function column(rows: string): string {
  return `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${C.paper};border:1px solid ${C.rule};">
${rows}
</table>`;
}

/** The unsubscribe line: the subscriber's two links when the site sends, else the send tool's. */
function unsubscribeLine(f: FooterInput): { html: string; text: string } {
  const label = f.unsubscribe ? SUBSCRIBER_FOOTER_COPY.label : FOOTER_COPY.unsubscribeLabel;
  const strong = `<strong style="color:${C.ink};">${esc(label)}</strong>`;
  if (!f.unsubscribe) return { html: `${strong} ${esc(FOOTER_COPY.unsubscribe)}`, text: `${label} ${FOOTER_COPY.unsubscribe}` };
  const listLabel = fill(SUBSCRIBER_FOOTER_COPY.list, { product: f.product });
  const html = fill(esc(SUBSCRIBER_FOOTER_COPY.line), { list: link(f.unsubscribe.list, listLabel), all: link(f.unsubscribe.all, SUBSCRIBER_FOOTER_COPY.all) });
  const text = fill(SUBSCRIBER_FOOTER_COPY.line, { list: `${listLabel} (${f.unsubscribe.list})`, all: `${SUBSCRIBER_FOOTER_COPY.all} (${f.unsubscribe.all})` });
  return { html: `${strong} ${html}`, text: `${label} ${text}` };
}

/**
 * The footer every issue carries: who sent it, the postal address, the
 * calendar and its feed, why the reader has it, and how to stop. When the
 * site sends to a subscriber the stop line carries their own links;
 * otherwise the link is the send tool's to add (docs/ISSUES.md).
 */
export function footer(f: FooterInput, kind: IssueKind, campaign: string): { html: string; text: string } {
  const calendar = tagged(absolute(f.siteUrl, "/calendar"), kind, campaign);
  const ics = absolute(f.siteUrl, "/api/calendar.ics");
  const sentBy = fill(FOOTER_COPY.sentBy, { names: TEAM_NAMES, team: f.teamName, brokerage: f.brokerageName });
  const address = addressLine(f.officeAddress);
  const why = fill(FOOTER_COPY.why, { product: f.product, domain: f.domain });
  const stop = unsubscribeLine(f);
  const lines = (s: string) => `<p style="margin:0 0 8px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muted};">${s}</p>`;
  const html = `<tr><td style="padding:24px 32px 28px 32px;background-color:${C.linen};border-top:1px solid ${C.rule};">
${lines(`${link(calendar, FOOTER_COPY.calendarLabel)} &middot; ${link(ics, FOOTER_COPY.icsLabel)}`)}
${lines(esc(sentBy))}
${address ? lines(esc(address)) : ""}
${f.phoneDisplay ? lines(`${esc(FOOTER_COPY.phoneLabel)} ${esc(f.phoneDisplay)}`) : ""}
${lines(esc(why))}
${lines(stop.html)}
${lines(esc(FOOTER_COPY.equalHousing))}
</td></tr>`;
  const text = [
    "--",
    `${FOOTER_COPY.calendarLabel}: ${calendar}`,
    `${FOOTER_COPY.icsLabel}: ${ics}`,
    "",
    sentBy,
    address || null,
    f.phoneDisplay ? `${FOOTER_COPY.phoneLabel} ${f.phoneDisplay}` : null,
    why,
    stop.text,
    FOOTER_COPY.equalHousing,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
  return { html, text };
}

/**
 * Wrap one line at `width` columns, leaving URLs and other long words whole.
 * Continuation lines start with `hang`; by default, as many spaces as the
 * line's own indent (and its "- " bullet).
 */
export function wrapLine(line: string, width = 72, hang?: string): string {
  if (line.length <= width) return line;
  const indent = line.match(/^\s*(- )?/)?.[0] ?? "";
  const cont = hang ?? " ".repeat(indent.length);
  const words = line.slice(indent.length).split(" ");
  const out: string[] = [];
  let cur = indent;
  let base = indent;
  for (const w of words) {
    if (cur.length > base.length && cur.length + 1 + w.length > width) {
      out.push(cur);
      cur = cont + w;
      base = cont;
    } else {
      cur = cur.length > base.length ? `${cur} ${w}` : `${cur}${w}`;
    }
  }
  out.push(cur);
  return out.join("\n");
}

/** Wrap plain text at 72 columns, line by line, leaving URLs whole. */
export function wrap(text: string, width = 72): string {
  return text
    .split("\n")
    .map((line) => wrapLine(line, width))
    .join("\n");
}

/** "SECTION" with an underline, for the plain-text version. */
export function textHeading(s: string): string {
  return `${s}\n${"-".repeat(Math.min(s.length, 72))}`;
}

/* ---- Dates on YYYY-MM-DD strings, no timezone involved ---------------------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const parts = (day: string) => day.split("-").map(Number) as [number, number, number];

export function weekdayOf(day: string): number {
  const [y, m, d] = parts(day);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
export function addDays(day: string, n: number): string {
  const [y, m, d] = parts(day);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** "Tuesday, October 6" */
export function dayLong(day: string): string {
  const [, m, d] = parts(day);
  return `${DAYS[weekdayOf(day)]}, ${MONTHS[m - 1]} ${d}`;
}
/** "Tue" */
export function dayShort(day: string): string {
  return DAYS[weekdayOf(day)]!.slice(0, 3);
}
/** "October 6, 2026" */
export function dateLong(day: string): string {
  const [y, m, d] = parts(day);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
/** "Oct 31" */
export function dateShort(day: string): string {
  const [, m, d] = parts(day);
  return `${MONTHS[m - 1]!.slice(0, 3)} ${d}`;
}
/** "October 5 to 11", "September 28 to October 4", "December 28, 2026 to January 3, 2027" */
export function rangeLabel(from: string, to: string): string {
  const [fy, fm, fd] = parts(from);
  const [ty, tm, td] = parts(to);
  if (fy !== ty) return `${dateLong(from)} to ${dateLong(to)}`;
  if (fm === tm) return `${MONTHS[fm - 1]} ${fd} to ${td}`;
  return `${MONTHS[fm - 1]} ${fd} to ${MONTHS[tm - 1]} ${td}`;
}
/** "September 2026" from "2026-09" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${MONTHS[m - 1]} ${y}`;
}
/** "7:30 PM" from "19:30" */
export function clock(t: string): string {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`;
}
/** The local calendar day in America/New_York for an instant. */
export function easternDay(d: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
export const isDay = (s: string | null | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s);

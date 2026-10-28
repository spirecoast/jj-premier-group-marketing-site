/**
 * "Email me this": the one email, built here and sent by app/api/keep.
 * The link to the visitor's own result on this site, a line on how to print
 * it, the team's signature, and a line for anyone who didn't ask for it.
 * Nothing else: no offer, no list, no tracking pixel. Pure.
 */

import { KEEP_TOOLS, type KeepToolId } from "./tools";

export type Signer = { name: string; phone: string };

const escapeMap: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => escapeMap[c] ?? c);

const NAVY = "#1e3442";
const INK = "#2b2d30";
const MUTED = "#63666a";
const RULE = "#e3ddd3";

export function keepEmail(opts: { tool: KeepToolId; link: string; siteName: string; siteHost: string; brokerage: string; team: Signer[]; replyable: boolean }): { subject: string; html: string } {
  const t = KEEP_TOOLS[opts.tool];
  const names = opts.team.map((m) => m.name.split(" ")[0]).join(" & ");
  const font = `font-family:Georgia,'Times New Roman',serif`;
  const sans = `font-family:Helvetica,Arial,sans-serif`;
  const p = (text: string, style = "") => `<p style="margin:0 0 16px;${sans};font-size:15px;line-height:1.6;color:${INK};${style}">${text}</p>`;
  const phones = opts.team.map((m) => `${esc(m.name)} · ${esc(m.phone)}`).join("<br>");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.subject)}</title></head>
<body style="margin:0;padding:0;background:#f7f3ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${RULE};">
<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0 0 20px;${font};font-weight:normal;font-size:26px;line-height:1.2;color:${NAVY};">Here&rsquo;s ${esc(t.noun)}.</h1>
${p(`It opens just as you left it, from any device. To print it or save it as a PDF, open it and choose Print.`)}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="background:${NAVY};">
<a href="${esc(opts.link)}" style="display:inline-block;padding:14px 22px;${sans};font-size:13px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff;text-decoration:none;">Open it</a>
</td></tr></table>
${p(`<a href="${esc(opts.link)}" style="color:#2c6e7e;word-break:break-all;">${esc(opts.link)}</a>`, `font-size:13px;`)}
${opts.replyable ? p(`If anything in it raises a question, reply to this email and one of us will answer.`) : ""}
</td></tr>
<tr><td style="padding:8px 32px 28px;border-top:1px solid ${RULE};">
<p style="margin:16px 0 4px;${font};font-size:17px;color:${NAVY};">${esc(names)}</p>
<p style="margin:0;${sans};font-size:13px;line-height:1.6;color:${INK};">${phones}</p>
<p style="margin:8px 0 0;${sans};font-size:12px;line-height:1.6;color:${MUTED};">${t.product ? `${esc(t.product)} · ` : ""}${esc(opts.siteName)} · ${esc(opts.brokerage)} · ${esc(opts.siteHost)}</p>
</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;${sans};font-size:12px;line-height:1.6;color:${MUTED};">Someone asked ${esc(opts.siteHost)} to send this to this address. If it wasn&rsquo;t you, there&rsquo;s nothing to do: this is the only email, and the address isn&rsquo;t kept.</p>
</td></tr></table>
</body></html>`;

  return { subject: t.subject, html };
}

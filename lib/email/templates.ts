import { escapeHtml } from "./index";

const BRAND = "[YOUR PLACEHOLDER]";

const wrap = (body: string) => `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#fafaf7;font-family:-apple-system,system-ui,Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.5;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ececec;border-radius:8px;padding:32px;">
      ${body}
    </div>
    <p style="max-width:560px;margin:16px auto 0;font-size:11px;color:#888;text-align:center;">
      ${BRAND} · Lakewood Ranch · Sarasota · Manatee County, FL
    </p>
  </body>
</html>`;

export function leadConfirmationEmail(args: {
  name: string;
}): { subject: string; html: string } {
  return {
    subject: `Thanks for reaching out, ${args.name.split(" ")[0] ?? args.name}`,
    html: wrap(`
      <p style="font-size:16px;margin:0 0 16px;">Hi ${escapeHtml(args.name)},</p>
      <p style="margin:0 0 16px;">
        Thanks for getting in touch. Your message landed — one of us will follow
        up shortly.
      </p>
      <p style="margin:0 0 16px;">
        In the meantime, feel free to reply to this email if anything else comes
        to mind.
      </p>
      <p style="margin:0;">— ${BRAND}</p>
    `),
  };
}

export function leadInternalNotifyEmail(args: {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  consentEmail: boolean;
  contactId: string;
  siteUrl: string;
}): { subject: string; html: string } {
  const consentBadge = args.consentEmail
    ? `<span style="background:#e7f5ec;color:#1d6f3a;padding:2px 8px;border-radius:4px;font-size:11px;">consent: yes</span>`
    : `<span style="background:#fde9e9;color:#a13030;padding:2px 8px;border-radius:4px;font-size:11px;">consent: no</span>`;

  return {
    subject: `New lead: ${args.name}`,
    html: wrap(`
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#888;">New lead · contact form</p>
      <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(args.name)} ${consentBadge}</h1>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <tr>
          <td style="padding:6px 0;color:#666;width:80px;">Email</td>
          <td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color:#1a1a1a;">${escapeHtml(args.email)}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;">Phone</td>
          <td style="padding:6px 0;">${args.phone ? escapeHtml(args.phone) : "—"}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;vertical-align:top;">Message</td>
          <td style="padding:6px 0;white-space:pre-wrap;">${escapeHtml(args.message)}</td>
        </tr>
      </table>
      <p style="margin:0;font-size:12px;color:#666;">
        Contact ID: <code style="background:#f4f4f4;padding:2px 6px;border-radius:3px;">${escapeHtml(args.contactId)}</code>
        <br />
        CRM view ships in Phase 5 — for now, query Supabase directly.
      </p>
    `),
  };
}

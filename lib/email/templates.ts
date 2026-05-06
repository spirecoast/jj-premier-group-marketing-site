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

/**
 * Welcome series — 5 transactional/marketing emails over 2 weeks.
 *
 * Per ARCHITECTURE.md §17, every piece of marketing content goes through Fair
 * Housing review before send. The copy here is intentionally minimal/structural
 * (placeholders) so the FH-sensitive editorial pass happens in a follow-up slice
 * with explicit human review.
 */
export function welcomeSeriesEmail(
  step: 1 | 2 | 3 | 4 | 5,
  args: { name: string | null },
): { subject: string; html: string } {
  const greeting = args.name ? `Hi ${escapeHtml(args.name.split(" ")[0])},` : "Hi,";
  const sign = `<p style="margin:0;">— ${BRAND}</p>`;

  switch (step) {
    case 1:
      return {
        subject: `Welcome — here's what to expect`,
        html: wrap(`
          <p>${greeting}</p>
          <p>Thanks for joining the ${BRAND} list. Over the next two weeks
          we&rsquo;ll send a handful of short notes — how we work, what&rsquo;s
          going on in the local market, and the tools we&rsquo;ve built that
          you can use whenever you want.</p>
          <p>[Welcome paragraph placeholder.]</p>
          ${sign}
        `),
      };
    case 2:
      return {
        subject: `How we work`,
        html: wrap(`
          <p>${greeting}</p>
          <p>[How-we-work paragraph placeholder — covers the team, brokerage,
          and the way we run buying and selling engagements.]</p>
          <p>[Process placeholder.]</p>
          ${sign}
        `),
      };
    case 3:
      return {
        subject: `This month in Lakewood Ranch`,
        html: wrap(`
          <p>${greeting}</p>
          <p>[Market snapshot placeholder — median price, days on market,
          inventory, year-over-year change. Pulled from MLS data once Phase 3
          ships; for now this is a manual paragraph reviewed before send.]</p>
          ${sign}
        `),
      };
    case 4:
      return {
        subject: `Tools you can use`,
        html: wrap(`
          <p>${greeting}</p>
          <p>[Tools paragraph placeholder — Home Value, Affordability,
          Neighborhood Match. Linked once Phase 4 ships.]</p>
          ${sign}
        `),
      };
    case 5:
      return {
        subject: `Anything else?`,
        html: wrap(`
          <p>${greeting}</p>
          <p>[Wrap-up paragraph placeholder — invite a reply with questions,
          and explain that we&rsquo;ll shift to the monthly cadence from here.]</p>
          ${sign}
        `),
      };
  }
}

export function newsletterConfirmationEmail(args: {
  email: string;
}): { subject: string; html: string } {
  return {
    subject: `You're on the list`,
    html: wrap(`
      <p style="font-size:16px;margin:0 0 16px;">Welcome.</p>
      <p style="margin:0 0 16px;">
        ${escapeHtml(args.email)} is now subscribed to the ${BRAND} list.
        Expect a market update once a month, plus the occasional new-listing
        spotlight.
      </p>
      <p style="margin:0 0 16px;">
        Not what you signed up for? Reply to this email and we&rsquo;ll take you
        off immediately.
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

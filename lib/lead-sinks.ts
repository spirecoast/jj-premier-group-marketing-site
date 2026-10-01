/**
 * Which lead sinks this deployment has configured. Booleans and names only,
 * never values: /api/health returns this verbatim and the boot warning logs it.
 *
 * Kept free of imports so instrumentation.ts and the edge runtime can load it.
 */

export type CrmProvider = "webhook" | "fub" | "none";

export function getCrmProvider(): CrmProvider {
  const explicit = (process.env.CRM_PROVIDER || "").trim().toLowerCase();
  if (explicit === "webhook" || explicit === "fub" || explicit === "none") return explicit;
  if (explicit) console.warn(`[crm] unknown CRM_PROVIDER "${explicit}"; falling back to auto-detect`);
  return process.env.CRM_WEBHOOK_URL ? "webhook" : "none";
}

export type LeadSinks = {
  /** The Postgres mirror of record (DATABASE_URL). */
  postgres: boolean;
  /** The CRM path: Zapier catch hook or Follow Up Boss. */
  crm: { provider: CrmProvider; configured: boolean };
  /** The Resend team notification (RESEND_API_KEY + RESEND_FROM_EMAIL + TEAM_NOTIFY_EMAIL). */
  teamEmail: boolean;
  /** Where CRM failure alerts go (LEAD_ALERT_EMAIL, falling back to TEAM_NOTIFY_EMAIL). */
  alerts: boolean;
  /** Server-side conversion events (NEXT_PUBLIC_PLAUSIBLE_DOMAIN). */
  plausible: boolean;
  /** The "book 15 minutes" link on the thank-you pages (NEXT_PUBLIC_BOOKING_URL). */
  booking: boolean;
};

export function getLeadSinks(): LeadSinks {
  const provider = getCrmProvider();
  const crmConfigured =
    provider === "webhook"
      ? Boolean(process.env.CRM_WEBHOOK_URL)
      : provider === "fub"
        ? Boolean(process.env.FUB_API_KEY && process.env.FUB_SYSTEM && process.env.FUB_SYSTEM_KEY)
        : false;
  return {
    postgres: Boolean(process.env.DATABASE_URL),
    crm: { provider, configured: crmConfigured },
    teamEmail: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.TEAM_NOTIFY_EMAIL),
    alerts: Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && (process.env.LEAD_ALERT_EMAIL || process.env.TEAM_NOTIFY_EMAIL),
    ),
    plausible: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
    booking: Boolean(process.env.NEXT_PUBLIC_BOOKING_URL),
  };
}

/** True when at least one place will keep a lead. */
export function hasLeadSink(sinks: LeadSinks = getLeadSinks()): boolean {
  return sinks.postgres || sinks.crm.configured || sinks.teamEmail;
}

/**
 * Boot-time check, called from instrumentation.ts. In production a site with
 * no sink would accept forms and keep nothing, so it shouts; elsewhere it
 * just says what is on.
 */
export function warnIfNoLeadSink(): void {
  const sinks = getLeadSinks();
  const summary = `postgres=${sinks.postgres} crm=${sinks.crm.provider}${sinks.crm.configured ? "" : "(not configured)"} teamEmail=${sinks.teamEmail} plausible=${sinks.plausible}`;
  if (hasLeadSink(sinks)) {
    console.info(`[leads] sinks: ${summary}`);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    console.error(
      `[leads] NO LEAD SINK CONFIGURED. Forms will accept submissions and keep nothing. Set CRM_WEBHOOK_URL (Zapier), DATABASE_URL or RESEND_API_KEY+RESEND_FROM_EMAIL+TEAM_NOTIFY_EMAIL. (${summary})`,
    );
  } else {
    console.warn(`[leads] no lead sink configured; submissions are logged only. (${summary})`);
  }
}

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
  /**
   * A sink that puts the lead in front of a person: the CRM or the team email.
   * The database alone keeps a lead where nobody looks, so a production
   * deployment without one of these reports itself unhealthy.
   */
  humanSink: boolean;
};

export function getLeadSinks(): LeadSinks {
  const provider = getCrmProvider();
  const crmConfigured =
    provider === "webhook"
      ? Boolean(process.env.CRM_WEBHOOK_URL)
      : provider === "fub"
        ? Boolean(process.env.FUB_API_KEY && process.env.FUB_SYSTEM && process.env.FUB_SYSTEM_KEY)
        : false;
  const teamEmail = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.TEAM_NOTIFY_EMAIL);
  return {
    postgres: Boolean(process.env.DATABASE_URL),
    crm: { provider, configured: crmConfigured },
    teamEmail,
    alerts: Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && (process.env.LEAD_ALERT_EMAIL || process.env.TEAM_NOTIFY_EMAIL),
    ),
    plausible: Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
    booking: Boolean(process.env.NEXT_PUBLIC_BOOKING_URL),
    humanSink: crmConfigured || teamEmail,
  };
}

/** The live site: Vercel's production environment, or a production build run anywhere that isn't Vercel. */
function isProductionSite(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV === "production";
  return env.NODE_ENV === "production";
}

/**
 * What's wrong with this deployment's lead sinks, or null when nothing is.
 * "no-sink": a form would be accepted and kept nowhere. "no-human-sink": the
 * live site keeps leads only in the database, where nobody is told about
 * them (no CRM and no team email). Previews and local builds only need a sink.
 */
export function leadSinkProblem(sinks: LeadSinks = getLeadSinks(), env: Record<string, string | undefined> = process.env): "no-sink" | "no-human-sink" | null {
  if (!(sinks.postgres || sinks.crm.configured || sinks.teamEmail)) return "no-sink";
  if (isProductionSite(env) && !sinks.humanSink) return "no-human-sink";
  return null;
}

/**
 * True when this deployment's leads reach somewhere they'll be seen:
 * GET /api/health answers 200 on true and 503 on false.
 */
export function hasLeadSink(sinks: LeadSinks = getLeadSinks()): boolean {
  return leadSinkProblem(sinks) === null;
}

/**
 * Boot-time check, called from instrumentation.ts. In production a site with
 * no sink would accept forms and keep nothing, so it shouts; elsewhere it
 * just says what is on.
 */
export function warnIfNoLeadSink(): void {
  const sinks = getLeadSinks();
  const summary = `postgres=${sinks.postgres} crm=${sinks.crm.provider}${sinks.crm.configured ? "" : "(not configured)"} teamEmail=${sinks.teamEmail} plausible=${sinks.plausible}`;
  const problem = leadSinkProblem(sinks);
  if (!problem) {
    console.info(`[leads] sinks: ${summary}`);
    return;
  }
  if (problem === "no-human-sink") {
    console.error(
      `[leads] NO HUMAN SINK. Leads are saved to the database only and nobody is told. Set TEAM_NOTIFY_EMAIL with RESEND_API_KEY and RESEND_FROM_EMAIL, or CRM_WEBHOOK_URL. /api/health answers 503 until then. (${summary})`,
    );
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

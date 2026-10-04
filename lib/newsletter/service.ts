import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contacts, events, issueSends, newsletterDeliveries, newsletterSubscriptions, type IssueSend } from "@/lib/db/schema";
import { loadEncoreSnapshot } from "@/lib/encore/live";
import { checkFairHousing } from "@/lib/fair-housing";
import { fill } from "@/lib/issues/copy";
import { footerFacts, issueToday, latestTidePath, loadEncoreIssue, loadTideIssue } from "@/lib/issues/load";
import type { Issue } from "@/lib/issues/render";
import type { LeadForm } from "@/lib/leads";
import { site } from "@/lib/site";
import { signUnsubscribe, verifyUnsubscribe } from "@/lib/unsubscribe";
import { BATCH_GAP_MS, BATCH_SIZE, MAX_ATTEMPTS, batchIdempotencyKey, failureStatus, pendingRecipients, remainingToday, utcDayStart, type DeliveryRecord, type Recipient } from "./batch";
import { disabledLine, newsletterConfig, type NewsletterConfig } from "./config";
import { ISSUE_ACTION_COPY } from "./copy";
import { UNSUBSCRIBE_PLACEHOLDERS, confirmationEmail, personalize, unsentable, welcomeEmail, type FooterFacts } from "./emails";
import { listUnsubscribeHeaders, subscriptionSigningId, unsubscribeLinks } from "./headers";
import { LIST_NAME, listsForLead, type NewsletterList } from "./lists";
import { sendBatch, sendOne, type OutgoingEmail } from "./resend";
import { holdDecision, initialHold, scheduledSendTime, sendDecision, sendExpiry, type IssueKindName, type IssueSendStatus } from "./schedule";
import { transition, type SubscriptionState, type SubscriptionStatus } from "./state";
import { CONFIRM_TTL_SECONDS, ISSUE_ACTION_TTL_SECONDS, signToken, verifyToken, type ConfirmPayload, type IssueActionPayload } from "./token";

/**
 * The server half of subscriber email (docs/ISSUES.md): subscriptions with
 * double opt-in, unsubscribes, and sending each issue to the confirmed
 * subscribers in batches under the daily cap. The decisions are the pure
 * modules' (state, schedule, batch); this file reads and writes Postgres
 * and calls Resend.
 *
 * Nothing here throws to a caller that serves a visitor: a form submission
 * never fails because an email didn't go, and every outcome is logged.
 */

const log = (...a: unknown[]) => console.info("[newsletter]", ...a);
const warn = (...a: unknown[]) => console.error("[newsletter]", ...a);

let disabledLogged = false;
/** The config, logging one line the first time it's off in this instance. */
export function activeConfig(where: string): NewsletterConfig | null {
  const config = newsletterConfig();
  if (config.enabled) return config;
  if (!disabledLogged) {
    console.info(disabledLine(config, where));
    disabledLogged = true;
  }
  return null;
}

/** True when this deployment sends to subscribers. Read at build time by the thank-you pages. */
export function subscriberEmailOn(): boolean {
  return newsletterConfig().enabled;
}

const lower = (e: string) => e.trim().toLowerCase();

/** contacts.unsubscribed_email on any row for the address. */
async function isSuppressed(email: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(sql`lower(${contacts.email}) = ${lower(email)}`, eq(contacts.unsubscribedEmail, true)))
    .limit(1);
  return rows.length > 0;
}

async function logEvent(eventType: string, contactId: string | null, payload: Record<string, unknown>): Promise<void> {
  try {
    await getDb().insert(events).values({ eventType, contactId, payload });
  } catch (err) {
    warn(`couldn't record ${eventType}`, err instanceof Error ? err.message : err);
  }
}

function stateOf(row: { status: string; confirmationSentAt: Date | null; welcomeSentAt: Date | null } | undefined): SubscriptionState {
  return row ? { status: row.status as SubscriptionStatus, confirmationSentAt: row.confirmationSentAt, welcomeSentAt: row.welcomeSentAt } : null;
}

/** Today's subscriber emails so far (UTC day): anything sent, claimed or of unknown outcome. */
async function usedToday(now: Date): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(newsletterDeliveries)
    .where(and(sql`coalesce(${newsletterDeliveries.sentAt}, ${newsletterDeliveries.createdAt}) >= ${utcDayStart(now).toISOString()}`, sql`${newsletterDeliveries.status} in ('sent', 'claimed', 'unknown')`));
  return row?.n ?? 0;
}

async function recordSingle(kind: "confirmation" | "welcome", list: NewsletterList, subscriptionId: string, email: string, res: Awaited<ReturnType<typeof sendOne>>): Promise<void> {
  try {
    await getDb()
      .insert(newsletterDeliveries)
      .values({
        kind,
        list,
        subscriptionId,
        email,
        status: res.ok ? "sent" : failureStatus(res.httpStatus),
        attempts: Math.max(1, res.attempts),
        resendId: res.ok ? (res.ids[0] ?? null) : null,
        error: res.ok ? null : res.error.slice(0, 1000),
        sentAt: res.ok ? new Date() : null,
      });
  } catch (err) {
    warn(`couldn't record the ${kind} delivery`, err instanceof Error ? err.message : err);
  }
}

function linksFor(subscriptionId: string, list: NewsletterList) {
  return unsubscribeLinks(site.url, subscriptionId, signUnsubscribe(subscriptionSigningId(subscriptionId)), list);
}

function tags(list: NewsletterList, kind: string, campaign?: string): { name: string; value: string }[] {
  return [{ name: "list", value: list }, { name: "kind", value: kind }, ...(campaign ? [{ name: "campaign", value: campaign }] : [])];
}

async function footerForEmail(): Promise<FooterFacts> {
  const f = await footerFacts();
  return { siteUrl: f.siteUrl, domain: f.domain, teamName: f.teamName, brokerageName: f.brokerageName, officeAddress: f.officeAddress, phoneDisplay: f.phoneDisplay };
}

/* ---- Subscribing ------------------------------------------------------------ */

export type SubscribeOutcome = { list: NewsletterList; outcome: string; confirmationSent: boolean };

/**
 * After a form is captured (lib/lead-pipeline.ts): for each list the form
 * asks for, move the subscription along and send the confirmation when the
 * state machine says to. Never throws.
 */
export async function requestSubscriptions(lead: { contactId: string | null; email: string; form: LeadForm; consentEmail: boolean; test?: boolean }): Promise<SubscribeOutcome[]> {
  const lists = listsForLead(lead.form, lead.consentEmail);
  if (!lists.length || lead.test) return [];
  const config = activeConfig("subscribe");
  if (!config) return [];
  const email = lower(lead.email);
  const out: SubscribeOutcome[] = [];
  try {
    const db = getDb();
    const suppressed = await isSuppressed(email);
    const footer = await footerForEmail();
    for (const list of lists) {
      const now = new Date();
      const [existing] = await db.select().from(newsletterSubscriptions).where(and(eq(newsletterSubscriptions.email, email), eq(newsletterSubscriptions.list, list))).limit(1);
      const t = transition(stateOf(existing), "request", { suppressed, now });
      let id = existing?.id ?? null;
      if (t.next) {
        const [row] = await db
          .insert(newsletterSubscriptions)
          .values({ contactId: lead.contactId, email, list, status: t.next, source: `${lead.form}_form`, requestedAt: now })
          .onConflictDoUpdate({
            target: [newsletterSubscriptions.email, newsletterSubscriptions.list],
            set: {
              contactId: lead.contactId ?? sql`${newsletterSubscriptions.contactId}`,
              status: t.next,
              source: `${lead.form}_form`,
              requestedAt: now,
              updatedAt: now,
              // Coming back after an unsubscribe starts over: a new confirmation, then a new welcome.
              ...(existing?.status === "unsubscribed" ? { confirmedAt: null, welcomeSentAt: null, unsubscribedAt: null, unsubscribeMethod: null } : {}),
            },
          })
          .returning({ id: newsletterSubscriptions.id });
        id = row?.id ?? id;
      }
      let sent = false;
      if (t.send === "confirmation" && id) {
        const token = signToken({ p: "confirm", s: id }, config.secret, CONFIRM_TTL_SECONDS, now);
        const content = confirmationEmail({
          list,
          origin: lead.form === "letter" || lead.form === "calendar" ? "signup" : "consent",
          confirmUrl: `${site.url}/subscribe/confirm?t=${token}`,
          footer,
          ttlDays: Math.round(CONFIRM_TTL_SECONDS / 86_400),
        });
        const res = await sendOne(
          { from: config.from, to: email, subject: content.subject, html: content.html, text: content.text, replyTo: config.replyTo, tags: tags(list, "confirmation") },
          { apiKey: config.apiKey, idempotencyKey: `confirm-${id}-${now.getTime()}` },
        );
        await recordSingle("confirmation", list, id, email, res);
        if (res.ok) {
          sent = true;
          await db.update(newsletterSubscriptions).set({ confirmationSentAt: now, updatedAt: now }).where(eq(newsletterSubscriptions.id, id));
        } else warn(`confirmation to ${list} not sent (${res.httpStatus ?? "no answer"}): ${res.error}`);
      }
      await logEvent("newsletter_requested", lead.contactId, { list, form: lead.form, outcome: t.outcome, confirmation_sent: sent });
      log(`${list}: ${t.outcome}${sent ? ", confirmation sent" : ""}`);
      out.push({ list, outcome: t.outcome, confirmationSent: sent });
    }
  } catch (err) {
    warn("subscribe failed (the lead itself is kept)", err instanceof Error ? err.message : err);
  }
  return out;
}

export type ConfirmView =
  | { state: "ready"; list: NewsletterList }
  | { state: "already"; list: NewsletterList }
  | { state: "unsubscribed"; list: NewsletterList }
  | { state: "invalid" }
  | { state: "off" };

async function subscriptionForToken(token: string | null | undefined, config: NewsletterConfig) {
  const v = verifyToken<ConfirmPayload>(token, config.secret, "confirm");
  if (!v.ok || !/^[0-9a-f-]{36}$/i.test(v.data.s)) return null;
  const [row] = await getDb().select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, v.data.s)).limit(1);
  return row ?? null;
}

/** What /subscribe/confirm shows before the button is pressed. */
export async function viewConfirm(token: string | null | undefined): Promise<ConfirmView> {
  const config = activeConfig("confirm page");
  if (!config) return { state: "off" };
  try {
    const row = await subscriptionForToken(token, config);
    if (!row) return { state: "invalid" };
    const list = row.list as NewsletterList;
    if (await isSuppressed(row.email)) return { state: "unsubscribed", list };
    if (row.status === "confirmed") return { state: "already", list };
    if (row.status === "unsubscribed") return { state: "unsubscribed", list };
    return { state: "ready", list };
  } catch (err) {
    warn("confirm view failed", err instanceof Error ? err.message : err);
    return { state: "invalid" };
  }
}

export type ConfirmResult = { ok: true; state: "confirmed" | "already" | "unsubscribed"; list: NewsletterList } | { ok: false; state: "invalid" | "off" | "error" };

/** The confirm button: records the opt-in time and sends the welcome once. */
export async function confirmSubscription(token: string | null | undefined): Promise<ConfirmResult> {
  const config = activeConfig("confirm");
  if (!config) return { ok: false, state: "off" };
  try {
    const row = await subscriptionForToken(token, config);
    if (!row) return { ok: false, state: "invalid" };
    const list = row.list as NewsletterList;
    const now = new Date();
    const t = transition(stateOf(row), "confirm", { suppressed: await isSuppressed(row.email), now });
    if (t.outcome === "suppressed" || t.outcome === "not_pending") return { ok: true, state: "unsubscribed", list };
    const db = getDb();
    if (t.next === "confirmed") {
      // Only a pending row turns confirmed, so two presses can't both record it.
      const updated = await db
        .update(newsletterSubscriptions)
        .set({ status: "confirmed", confirmedAt: now, updatedAt: now })
        .where(and(eq(newsletterSubscriptions.id, row.id), eq(newsletterSubscriptions.status, "pending")))
        .returning({ id: newsletterSubscriptions.id });
      if (updated.length) await logEvent("newsletter_confirmed", row.contactId, { list, confirmed_at: now.toISOString(), method: "double_opt_in" });
    }
    if (t.send === "welcome") {
      // Claim the welcome first so a double press sends one.
      const claimed = await db
        .update(newsletterSubscriptions)
        .set({ welcomeSentAt: now, updatedAt: now })
        .where(and(eq(newsletterSubscriptions.id, row.id), sql`${newsletterSubscriptions.welcomeSentAt} is null`))
        .returning({ id: newsletterSubscriptions.id });
      if (claimed.length) {
        const links = linksFor(row.id, list);
        const content = welcomeEmail({ list, footer: await footerForEmail(), latestTidePath: latestTidePath(), unsubscribe: links });
        const res = await sendOne(
          {
            from: config.from,
            to: row.email,
            subject: content.subject,
            html: content.html,
            text: content.text,
            replyTo: config.replyTo,
            headers: listUnsubscribeHeaders(links.oneClick, config.replyTo),
            tags: tags(list, "welcome"),
          },
          { apiKey: config.apiKey, idempotencyKey: `welcome-${row.id}` },
        );
        await recordSingle("welcome", list, row.id, row.email, res);
        if (!res.ok) {
          warn(`welcome to ${list} not sent (${res.httpStatus ?? "no answer"}): ${res.error}`);
          // Let a second press try again when Resend said no for certain.
          if (failureStatus(res.httpStatus) === "failed") await db.update(newsletterSubscriptions).set({ welcomeSentAt: null }).where(eq(newsletterSubscriptions.id, row.id));
        }
      }
    }
    return { ok: true, state: t.next === "confirmed" ? "confirmed" : "already", list };
  } catch (err) {
    warn("confirm failed", err instanceof Error ? err.message : err);
    return { ok: false, state: "error" };
  }
}

/* ---- Unsubscribing ---------------------------------------------------------- */

export type UnsubscribeTarget = { kind: "subscription"; id: string; sig: string } | { kind: "contact"; id: string; sig: string };

export function verifyUnsubscribeTarget(t: UnsubscribeTarget): boolean {
  return verifyUnsubscribe(t.kind === "subscription" ? subscriptionSigningId(t.id) : t.id, t.sig);
}

/**
 * Stop one list or everything. `scope: "all"` also sets
 * contacts.unsubscribed_email on every row for the address, the record that
 * nothing more goes to it. Unknown ids succeed quietly (never confirm or deny
 * an address). Throws on a database error, for the caller to report.
 */
export async function applyUnsubscribe(target: UnsubscribeTarget, scope: NewsletterList | "all", method: "link" | "one-click"): Promise<{ list: NewsletterList | "all" }> {
  const db = getDb();
  const now = new Date();
  let email: string | null = null;
  let contactId: string | null = null;
  if (target.kind === "subscription") {
    const [row] = await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, target.id)).limit(1);
    email = row?.email ?? null;
    contactId = row?.contactId ?? null;
  } else {
    const [row] = await db.select({ email: contacts.email }).from(contacts).where(eq(contacts.id, target.id)).limit(1);
    email = row?.email ? lower(row.email) : null;
    contactId = target.id;
    // The old contact links stop everything, as they always did.
    scope = "all";
  }
  if (!email) {
    if (target.kind === "contact") {
      // A contact row without an email: flag the row itself, as before.
      await db.update(contacts).set({ unsubscribedEmail: true, consentEmail: false, lastTouchAt: now }).where(eq(contacts.id, target.id));
    }
    return { list: scope };
  }
  const setUnsub = { status: "unsubscribed", unsubscribedAt: now, unsubscribeMethod: scope === "all" ? "all" : method, updatedAt: now };
  if (scope === "all") {
    await db.update(newsletterSubscriptions).set(setUnsub).where(and(eq(newsletterSubscriptions.email, email), sql`${newsletterSubscriptions.status} <> 'unsubscribed'`));
    await db.update(contacts).set({ unsubscribedEmail: true, consentEmail: false, lastTouchAt: now }).where(sql`lower(${contacts.email}) = ${email}`);
    await logEvent("unsubscribed_email", contactId, { method, scope: "all" });
  } else {
    await db.update(newsletterSubscriptions).set(setUnsub).where(and(eq(newsletterSubscriptions.email, email), eq(newsletterSubscriptions.list, scope), sql`${newsletterSubscriptions.status} <> 'unsubscribed'`));
    await logEvent("unsubscribed_newsletter", contactId, { method, list: scope });
  }
  log(`unsubscribe: ${scope} (${method})`);
  return { list: scope };
}

/* ---- Issue sends ------------------------------------------------------------ */

export const periodKey = (issue: Pick<Issue, "kind" | "period">) => (issue.kind === "tide" ? issue.period.from.slice(0, 7) : issue.period.from);

/** What the team email says about the subscriber send, and its two links. */
export type TeamSendInfo = {
  status: IssueSendStatus;
  scheduledFor: Date;
  finishedAt: Date | null;
  holdReason: string | null;
  heldBySystem: boolean;
  recipients: number;
  sendUrl: string;
  holdUrl: string;
  fairHousingFlagged: boolean;
  addressComplete: boolean;
};

const addressComplete = (f: { officeAddress: { street: string; zip: string } }) => Boolean(f.officeAddress.street && f.officeAddress.zip);

async function confirmedRecipients(list: NewsletterList): Promise<Recipient[]> {
  const rows = (await getDb().execute(sql`
    select s.id as "subscriptionId", s.email as "email"
    from newsletter_subscriptions s
    where s.list = ${list} and s.status = 'confirmed'
      and not exists (select 1 from contacts c where lower(c.email) = s.email and c.unsubscribed_email)
    order by s.confirmed_at nulls last, s.id
  `)) as unknown as Recipient[];
  return [...rows];
}

function actionUrl(config: NewsletterConfig, a: "send" | "hold", kind: IssueKindName, period: string, now = new Date()): string {
  return `${site.url}/api/newsletter/issue?t=${signToken({ p: "issue", a, k: kind, per: period }, config.secret, ISSUE_ACTION_TTL_SECONDS, now)}`;
}

/**
 * Called by the hand-off cron (app/api/issues/*): make sure there's a send
 * on record for this issue, scheduled or held, and say what the team email
 * should tell the team about it. A re-run finds the row it made before and
 * leaves it as it is (never un-holds, never re-sends). Null when subscriber
 * email is off.
 */
export async function prepareIssueSend(issue: Issue, now = new Date()): Promise<TeamSendInfo | null> {
  const config = activeConfig("issue hand-off");
  if (!config) return null;
  const kind = issue.kind;
  const period = periodKey(issue);
  const fh = checkFairHousing(`${issue.subject}\n${issue.html}\n${issue.text}`);
  const footer = await footerFacts();
  const complete = addressComplete(footer);
  const hold = initialHold({ fairHousingPassed: fh.passed, issueHold: issue.hold ?? null, addressComplete: complete });
  const scheduledFor = scheduledSendTime(kind, period, now);
  const db = getDb();
  await db
    .insert(issueSends)
    .values({
      kind,
      period,
      periodLabel: issue.period.label,
      periodEnd: issue.period.to,
      subject: issue.subject,
      status: hold ? "held" : "scheduled",
      scheduledFor,
      expiresAt: sendExpiry(kind, issue.period.to, scheduledFor),
      heldBy: hold ? "system" : null,
      holdReason: hold,
      heldAt: hold ? now : null,
    })
    .onConflictDoNothing({ target: [issueSends.kind, issueSends.period] });
  let [row] = await db.select().from(issueSends).where(and(eq(issueSends.kind, kind), eq(issueSends.period, period))).limit(1);
  if (!row) throw new Error("issue_sends row missing after insert");
  // A re-run that now finds a reason to hold (a new Fair Housing flag, an address removed) holds a send that hasn't started.
  if (hold && row.status === "scheduled") {
    [row] = await db.update(issueSends).set({ status: "held", heldBy: "system", holdReason: hold, heldAt: now, updatedAt: now }).where(eq(issueSends.id, row.id)).returning();
  }
  const recipients = (await confirmedRecipients(kind)).length;
  return {
    status: row!.status as IssueSendStatus,
    scheduledFor: row!.scheduledFor,
    finishedAt: row!.finishedAt,
    holdReason: row!.holdReason,
    heldBySystem: row!.heldBy === "system",
    recipients,
    sendUrl: actionUrl(config, "send", kind, period, now),
    holdUrl: actionUrl(config, "hold", kind, period, now),
    fairHousingFlagged: !fh.passed,
    addressComplete: complete,
  };
}

/** prepareIssueSend for the hand-off routes: a failure is logged and the team email goes out without the subscriber lines; nothing is sent. */
export async function prepareSubscriberSend(issue: Issue): Promise<TeamSendInfo | null> {
  try {
    return await prepareIssueSend(issue);
  } catch (err) {
    warn(`couldn't put the ${issue.kind} send on record; nothing will go to subscribers until it is (is migration 0013 applied?)`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** The subscriber copy of an issue, with unsubscribe placeholders, built from today's code and data. */
async function subscriberIssue(row: IssueSend): Promise<Issue | null> {
  const opts = { audience: "subscriber" as const, unsubscribe: { list: UNSUBSCRIBE_PLACEHOLDERS.list, all: UNSUBSCRIBE_PLACEHOLDERS.all } };
  if (row.kind === "encore") {
    await loadEncoreSnapshot();
    // The period is the week's Monday: building "today" as that Monday gives the same week.
    return loadEncoreIssue(row.period, opts);
  }
  return loadTideIssue(issueToday(), row.period, opts);
}

export type RunResult = {
  kind: string;
  period: string;
  decision: string;
  status: IssueSendStatus;
  sentThisRun: number;
  failedThisRun: number;
  unknownThisRun: number;
  deferred: number;
  error?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Send one issue to its confirmed subscribers, as far as today's cap and the
 * time allow. Safe to call twice at once and to re-run: each address is
 * claimed in newsletter_deliveries before its batch goes, and only one claim
 * wins.
 */
async function runSend(row: IssueSend, config: NewsletterConfig, opts: { now: Date; deadline: number; force: boolean }): Promise<RunResult> {
  const db = getDb();
  const list = row.kind as NewsletterList;
  const base = { kind: row.kind, period: row.period, sentThisRun: 0, failedThisRun: 0, unknownThisRun: 0, deferred: 0 };
  const decision = sendDecision({ status: row.status as IssueSendStatus, scheduledFor: row.scheduledFor, expiresAt: row.expiresAt }, opts.now, opts.force);
  if (decision === "expired" && row.status !== "expired") {
    await db.update(issueSends).set({ status: "expired", updatedAt: opts.now }).where(eq(issueSends.id, row.id));
  }
  if (decision !== "send") return { ...base, decision, status: decision === "expired" ? "expired" : (row.status as IssueSendStatus) };

  const hold = async (reason: string): Promise<RunResult> => {
    await db.update(issueSends).set({ status: "held", heldBy: "system", holdReason: reason, heldAt: opts.now, lastError: reason, updatedAt: opts.now }).where(eq(issueSends.id, row.id));
    warn(`${row.kind} ${row.period} held: ${reason}`);
    return { ...base, decision: "refused", status: "held", error: reason };
  };

  const issue = await subscriberIssue(row);
  if (!issue) return hold("there's no county sales data to build it from");
  const fh = checkFairHousing(`${issue.subject}\n${issue.html}\n${issue.text}`);
  if (!fh.passed) return hold("the Fair Housing checker flagged it");
  // Filled with stand-in links, the copy must have no placeholder and no box meant for the team.
  const bad = unsentable(personalize(issue, { list: site.url, all: site.url }));
  if (bad) return hold(bad);
  if (!addressComplete(await footerFacts())) return hold("the office street address and ZIP are empty in settings");

  await db
    .update(issueSends)
    .set({ status: "sending", startedAt: row.startedAt ?? opts.now, lastRunAt: opts.now, releasedAt: opts.force ? opts.now : row.releasedAt, heldBy: null, holdReason: null, updatedAt: opts.now })
    .where(eq(issueSends.id, row.id));

  const campaign = row.kind === "tide" ? `tide-${row.period}` : `encore-${row.period}`;
  let sent = 0;
  let failed = 0;
  let unknown = 0;
  let deferred = 0;
  let lastError: string | null = null;
  let finished = false;
  let total = 0;

  for (;;) {
    if (Date.now() > opts.deadline) break;
    // A hold pressed while this run is going stops the batches still to come.
    const [live] = await db.select({ status: issueSends.status }).from(issueSends).where(eq(issueSends.id, row.id)).limit(1);
    if (live?.status === "held") break;
    const subscribers = await confirmedRecipients(list);
    total = subscribers.length;
    const deliveries = (await db
      .select({ email: newsletterDeliveries.email, status: newsletterDeliveries.status, attempts: newsletterDeliveries.attempts })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.issueSendId, row.id))) as DeliveryRecord[];
    const pending = pendingRecipients(subscribers, deliveries);
    if (!pending.length) {
      finished = true;
      break;
    }
    const room = remainingToday(config.dailyCap, await usedToday(new Date()));
    if (room === 0) {
      deferred = pending.length;
      log(`${row.kind} ${row.period}: today's cap of ${config.dailyCap} is used; ${pending.length} wait for the next run`);
      break;
    }
    const next = pending.slice(0, Math.min(BATCH_SIZE, room));
    // Claim: a new row, or a retryable failure. Whatever another run claimed first isn't returned.
    const claimedRows = await db
      .insert(newsletterDeliveries)
      .values(next.map((r) => ({ kind: "issue", list, subscriptionId: r.subscriptionId, issueSendId: row.id, email: r.email, status: "claimed", attempts: 1 })))
      .onConflictDoUpdate({
        target: [newsletterDeliveries.issueSendId, newsletterDeliveries.email],
        set: { status: "claimed", attempts: sql`${newsletterDeliveries.attempts} + 1`, error: null },
        setWhere: sql`${newsletterDeliveries.status} = 'failed' and ${newsletterDeliveries.attempts} < ${MAX_ATTEMPTS}`,
      })
      .returning({ id: newsletterDeliveries.id, email: newsletterDeliveries.email });
    const claimed = new Map(claimedRows.map((r) => [r.email, r.id]));
    const batch = next.filter((r) => claimed.has(r.email));
    if (!batch.length) continue;

    const emails: OutgoingEmail[] = batch.map((r) => {
      const links = linksFor(r.subscriptionId, list);
      const body = personalize(issue, links);
      return {
        from: config.from,
        to: r.email,
        subject: issue.subject,
        html: body.html,
        text: body.text,
        replyTo: config.replyTo,
        headers: listUnsubscribeHeaders(links.oneClick, config.replyTo),
        tags: tags(list, "issue", campaign),
      };
    });
    const res = await sendBatch(emails, { apiKey: config.apiKey, idempotencyKey: batchIdempotencyKey(row.id, batch.map((r) => r.email), new Date().toISOString().slice(0, 10)) });
    const at = new Date();
    if (res.ok) {
      for (const [i, r] of batch.entries()) {
        await db
          .update(newsletterDeliveries)
          .set({ status: "sent", sentAt: at, resendId: res.ids[i] ?? null })
          .where(eq(newsletterDeliveries.id, claimed.get(r.email)!));
      }
      sent += batch.length;
      log(`${row.kind} ${row.period}: batch of ${batch.length} sent`);
    } else {
      const status = failureStatus(res.httpStatus);
      for (const r of batch) {
        await db.update(newsletterDeliveries).set({ status, error: res.error.slice(0, 1000) }).where(eq(newsletterDeliveries.id, claimed.get(r.email)!));
      }
      if (status === "failed") failed += batch.length;
      else unknown += batch.length;
      lastError = `Resend ${res.httpStatus ?? "no answer"}: ${res.error}`.slice(0, 1000);
      warn(`${row.kind} ${row.period}: batch of ${batch.length} ${status}: ${lastError}`);
      // A refusal (bad request, rate limit, the day's quota) would repeat for every batch: stop here, the next run picks it up.
      break;
    }
    await sleep(BATCH_GAP_MS);
  }

  const [counts] = await db
    .select({
      sent: sql<number>`count(*) filter (where ${newsletterDeliveries.status} = 'sent')::int`,
      failed: sql<number>`count(*) filter (where ${newsletterDeliveries.status} = 'failed')::int`,
      unknown: sql<number>`count(*) filter (where ${newsletterDeliveries.status} in ('unknown', 'claimed'))::int`,
    })
    .from(newsletterDeliveries)
    .where(eq(newsletterDeliveries.issueSendId, row.id));
  const done = new Date();
  // A hold pressed while this run was going stays a hold.
  const [current] = await db.select({ status: issueSends.status }).from(issueSends).where(eq(issueSends.id, row.id)).limit(1);
  const status: IssueSendStatus = current?.status === "held" ? "held" : finished ? "sent" : "sending";
  await db
    .update(issueSends)
    .set({
      status,
      recipients: total,
      sentCount: counts?.sent ?? 0,
      failedCount: counts?.failed ?? 0,
      unknownCount: counts?.unknown ?? 0,
      deferredCount: deferred,
      lastError,
      lastRunAt: done,
      finishedAt: finished ? done : null,
      updatedAt: done,
    })
    .where(eq(issueSends.id, row.id));
  return { ...base, decision, status, sentThisRun: sent, failedThisRun: failed, unknownThisRun: unknown, deferred, ...(lastError ? { error: lastError } : {}) };
}

/** Stop starting new batches after this long in one request (the routes allow 60 seconds). */
export const RUN_BUDGET_MS = 40_000;

export type DispatchResult = { ok: boolean; enabled: boolean; missing?: string[]; runs: RunResult[] };

/**
 * The send crons (app/api/newsletter/send/*): every send that's due and not
 * held, oldest first, `kind` alone when given. A send cut short by the cap
 * or the clock stays "sending" and the next run carries on.
 */
export async function dispatchDue(kind?: IssueKindName, now = new Date()): Promise<DispatchResult> {
  const config = activeConfig("send");
  if (!config) return { ok: true, enabled: false, missing: newsletterConfig().missing, runs: [] };
  const deadline = Date.now() + RUN_BUDGET_MS;
  const db = getDb();
  const rows = await db
    .select()
    .from(issueSends)
    .where(and(sql`${issueSends.status} in ('scheduled', 'sending')`, kind ? eq(issueSends.kind, kind) : sql`true`))
    .orderBy(issueSends.scheduledFor);
  const runs: RunResult[] = [];
  for (const row of rows) {
    if (Date.now() > deadline) break;
    try {
      runs.push(await runSend(row, config, { now, deadline, force: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warn(`${row.kind} ${row.period}: run failed`, message);
      await db.update(issueSends).set({ lastError: message.slice(0, 1000), lastRunAt: now, updatedAt: now }).where(eq(issueSends.id, row.id));
      runs.push({ kind: row.kind, period: row.period, decision: "error", status: row.status as IssueSendStatus, sentThisRun: 0, failedThisRun: 0, unknownThisRun: 0, deferred: 0, error: message });
    }
  }
  return { ok: runs.every((r) => !r.error), enabled: true, runs };
}

/* ---- The team's hold and send links ----------------------------------------- */

/** "October 3", in Sarasota's time, for "already went out on …". */
export const sentDay = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric" }).format(d) : "an earlier day");

export type IssueActionView =
  | { state: "ready"; action: "send" | "hold"; label: string; recipients: number; status: IssueSendStatus }
  | { state: "sent"; label: string; when: Date | null }
  | { state: "expired"; label: string }
  | { state: "missing" }
  | { state: "invalid" }
  | { state: "off" };

async function actionRow(token: string | null | undefined, config: NewsletterConfig) {
  const v = verifyToken<IssueActionPayload>(token, config.secret, "issue");
  if (!v.ok) return null;
  const [row] = await getDb()
    .select()
    .from(issueSends)
    .where(and(eq(issueSends.kind, v.data.k), eq(issueSends.period, v.data.per)))
    .limit(1);
  return { action: v.data.a, row: row ?? null };
}

const issueLabel = (row: IssueSend) => `${LIST_NAME[row.kind as NewsletterList]}, ${row.periodLabel}`;

/** What the page shows before the button is pressed. */
export async function viewIssueAction(token: string | null | undefined): Promise<IssueActionView> {
  const config = activeConfig("issue link");
  if (!config) return { state: "off" };
  const found = await actionRow(token, config);
  if (!found) return { state: "invalid" };
  const { action, row } = found;
  if (!row) return { state: "missing" };
  if (row.status === "sent") return { state: "sent", label: issueLabel(row), when: row.finishedAt };
  if (row.status === "expired" || Date.now() >= row.expiresAt.getTime()) return { state: "expired", label: issueLabel(row) };
  return { state: "ready", action, label: issueLabel(row), recipients: (await confirmedRecipients(row.kind as NewsletterList)).length, status: row.status as IssueSendStatus };
}

export type IssueActionResult = { ok: boolean; action: "send" | "hold" | null; message: string; run?: RunResult };

/** The button on that page: hold the issue, or send it now. */
export async function performIssueAction(token: string | null | undefined): Promise<IssueActionResult> {
  const config = activeConfig("issue link");
  if (!config) return { ok: false, action: null, message: ISSUE_ACTION_COPY.off };
  const found = await actionRow(token, config);
  if (!found) return { ok: false, action: null, message: ISSUE_ACTION_COPY.invalid };
  const { action, row } = found;
  if (!row) return { ok: false, action, message: ISSUE_ACTION_COPY.missing };
  const now = new Date();
  const db = getDb();

  if (action === "hold") {
    const d = holdDecision(row.status as IssueSendStatus);
    if (d === "already_sent") return { ok: false, action, message: fill(ISSUE_ACTION_COPY.alreadySent, { when: sentDay(row.finishedAt) }) };
    if (d === "expired") return { ok: false, action, message: ISSUE_ACTION_COPY.expired };
    if (d === "hold") {
      await db.update(issueSends).set({ status: "held", heldBy: "team", holdReason: "held from the team email", heldAt: now, updatedAt: now }).where(eq(issueSends.id, row.id));
      log(`${row.kind} ${row.period}: held from the team email`);
    }
    return { ok: true, action, message: ISSUE_ACTION_COPY.heldDone };
  }

  const run = await runSend(row, config, { now, deadline: Date.now() + RUN_BUDGET_MS, force: true });
  if (run.decision === "done") return { ok: false, action, message: fill(ISSUE_ACTION_COPY.alreadySent, { when: sentDay(row.finishedAt) }), run };
  if (run.decision === "expired") return { ok: false, action, message: ISSUE_ACTION_COPY.expired, run };
  if (run.decision === "refused" || (run.error && run.sentThisRun === 0)) return { ok: false, action, message: fill(ISSUE_ACTION_COPY.refused, { reason: run.error ?? "unknown" }), run };
  const plural = (n: number) => (n === 1 ? "subscriber" : "subscribers");
  const [after] = await db.select({ sent: issueSends.sentCount }).from(issueSends).where(eq(issueSends.id, row.id)).limit(1);
  const sentTotal = after?.sent ?? run.sentThisRun;
  return {
    ok: true,
    action,
    message: run.deferred
      ? fill(ISSUE_ACTION_COPY.sentPartial, { sent: sentTotal, subscribers: plural(sentTotal), left: run.deferred })
      : fill(ISSUE_ACTION_COPY.sentDone, { sent: sentTotal, subscribers: plural(sentTotal) }),
    run,
  };
}

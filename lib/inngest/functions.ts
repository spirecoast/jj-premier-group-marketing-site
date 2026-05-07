import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contacts, events, tasks } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { welcomeSeriesEmail } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { inngest } from "./client";

/**
 * Shared helper: create a failsafe task for a contact, with dedup against
 * any open task of the same failsafe_type for that contact. Idempotent —
 * safe to call from re-running cron jobs.
 *
 * Returns true if a task was created, false if one was already open.
 */
async function createFailsafeTaskIfMissing(args: {
  contactId: string;
  agentId: string | null;
  failsafeType: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
}): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.contactId, args.contactId),
        eq(tasks.failsafeType, args.failsafeType),
        isNull(tasks.completedAt),
      ),
    )
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(tasks).values({
    agentId: args.agentId,
    contactId: args.contactId,
    title: args.title,
    description: args.description,
    priority: args.priority,
    source: "failsafe",
    failsafeType: args.failsafeType,
    dueAt: new Date(),
  });

  await db.insert(events).values({
    eventType: "failsafe_fired",
    contactId: args.contactId,
    payload: { type: args.failsafeType },
  });

  return true;
}

const WELCOME_STEPS = [
  { stepNumber: 1, dayOffset: 0 },
  { stepNumber: 2, dayOffset: 2 },
  { stepNumber: 3, dayOffset: 5 },
  { stepNumber: 4, dayOffset: 9 },
  { stepNumber: 5, dayOffset: 14 },
] as const;

/**
 * Welcome series — 5 emails over 14 days, gated on consent at every step.
 *
 * Triggered by `lead.captured`. Inngest persists state across step.sleep calls
 * so a deploy or restart in the middle of a 2-week journey doesn't lose
 * progress.
 *
 * Consent re-check before each send: if the contact unsubscribes or removes
 * email consent mid-series, the remaining steps are silently skipped. The
 * sequence remains "in progress" until day 14 to keep the audit log honest.
 */
export const welcomeSeries = inngest.createFunction(
  {
    id: "welcome-series",
    name: "Welcome series (5 emails over 14 days)",
    triggers: [{ event: "lead.captured" }],
  },
  async ({ event, step, logger }) => {
    const { contactId } = event.data;

    for (const seqStep of WELCOME_STEPS) {
      if (seqStep.dayOffset > 0) {
        await step.sleep(
          `wait-day-${seqStep.dayOffset}`,
          `${seqStep.dayOffset}d`,
        );
      }

      await step.run(`send-step-${seqStep.stepNumber}`, async () => {
        const db = getDb();
        const rows = await db
          .select({
            email: contacts.email,
            fullName: contacts.fullName,
            consentEmail: contacts.consentEmail,
            unsubscribedEmail: contacts.unsubscribedEmail,
          })
          .from(contacts)
          .where(eq(contacts.id, contactId))
          .limit(1);
        const contact = rows[0];

        if (!contact || !contact.email) {
          logger.warn("[welcome-series] contact missing", { contactId });
          return { skipped: "no_contact" };
        }
        if (!contact.consentEmail || contact.unsubscribedEmail) {
          logger.info("[welcome-series] consent missing — skip", {
            contactId,
            step: seqStep.stepNumber,
          });
          return { skipped: "no_consent" };
        }

        const tmpl = welcomeSeriesEmail(seqStep.stepNumber, {
          name: contact.fullName,
          unsubscribeUrl: unsubscribeUrl(contactId),
        });
        const result = await sendEmail({
          to: contact.email,
          subject: tmpl.subject,
          html: tmpl.html,
          category: "marketing",
        });

        await db.insert(events).values({
          eventType: result.ok
            ? "sequence_step_sent"
            : "sequence_step_failed",
          contactId,
          payload: {
            sequence: "welcome_lead",
            step: seqStep.stepNumber,
            messageId: result.ok ? result.id : null,
            error: result.ok ? null : result.error,
          },
        });

        return { sent: result.ok, step: seqStep.stepNumber };
      });
    }

    return { contactId, completed: true };
  },
);

/**
 * Failsafe: new lead with no agent contact in 24 hours.
 *
 * Per ARCHITECTURE.md §11. Hourly scan: find contacts in lifecycle_stage='new'
 * created >24h ago that haven't been touched by an agent (no 'note' or
 * 'lifecycle_stage_changed' events) and don't already have an open
 * failsafe task of this type. Create a high-priority task assigned to the
 * primary agent and log a 'failsafe_fired' event.
 *
 * The failsafe is idempotent — re-running creates at most one open task per
 * contact per type, by virtue of the partial unique check.
 */
export const newLeadNoContactFailsafe = inngest.createFunction(
  {
    id: "failsafe-new-lead-no-contact-24h",
    name: "Failsafe: new lead, no contact in 24h",
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step, logger }) => {
    return await step.run("scan-and-create-tasks", async () => {
      const db = getDb();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const stale = await db
        .select({
          id: contacts.id,
          primaryAgentId: contacts.primaryAgentId,
          fullName: contacts.fullName,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            eq(contacts.lifecycleStage, "new"),
            lte(contacts.createdAt, cutoff),
          ),
        );

      let created = 0;
      let skipped = 0;

      for (const c of stale) {
        const existingTask = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.contactId, c.id),
              eq(tasks.failsafeType, "new_lead_no_contact_24h"),
              isNull(tasks.completedAt),
            ),
          )
          .limit(1);
        if (existingTask.length > 0) {
          skipped++;
          continue;
        }

        const agentTouched = await db
          .select({ id: events.id })
          .from(events)
          .where(
            and(
              eq(events.contactId, c.id),
              inArray(events.eventType, [
                "note",
                "lifecycle_stage_changed",
                "task_completed",
              ]),
            ),
          )
          .limit(1);
        if (agentTouched.length > 0) {
          skipped++;
          continue;
        }

        await db.insert(tasks).values({
          agentId: c.primaryAgentId,
          contactId: c.id,
          title: `Follow up: ${c.fullName ?? c.email ?? "new lead"}`,
          description:
            "No agent contact in 24+ hours. Reach out today to keep the lead warm.",
          priority: "high",
          source: "failsafe",
          failsafeType: "new_lead_no_contact_24h",
          dueAt: new Date(),
        });

        await db.insert(events).values({
          eventType: "failsafe_fired",
          contactId: c.id,
          payload: { type: "new_lead_no_contact_24h" },
        });

        created++;
      }

      logger.info("[failsafe] new_lead_no_contact_24h", {
        scanned: stale.length,
        created,
        skipped,
      });
      return { scanned: stale.length, created, skipped };
    });
  },
);

/**
 * Failsafe: a qualified lead hasn't been touched in 5 days.
 * Per §11. Daily 9am scan.
 */
export const qualifiedNoTouchFailsafe = inngest.createFunction(
  {
    id: "failsafe-qualified-no-touch-5d",
    name: "Failsafe: qualified lead, no touch in 5d",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step, logger }) => {
    return await step.run("scan", async () => {
      const db = getDb();
      const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const stale = await db
        .select({
          id: contacts.id,
          primaryAgentId: contacts.primaryAgentId,
          fullName: contacts.fullName,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            eq(contacts.lifecycleStage, "qualified"),
            lte(contacts.lastTouchAt, cutoff),
          ),
        );

      let created = 0;
      for (const c of stale) {
        const made = await createFailsafeTaskIfMissing({
          contactId: c.id,
          agentId: c.primaryAgentId,
          failsafeType: "qualified_no_touch_5d",
          title: `Re-engage: ${c.fullName ?? c.email ?? "qualified lead"}`,
          description:
            "Qualified lead with 5+ days since last touch. Send a check-in or schedule a call.",
          priority: "high",
        });
        if (made) created++;
      }

      logger.info("[failsafe] qualified_no_touch_5d", {
        scanned: stale.length,
        created,
      });
      return { scanned: stale.length, created };
    });
  },
);

/**
 * Failsafe: past-client / sphere contact untouched in 90+ days.
 * Per §11 + §12 sphere management. Daily 9am.
 */
export const sphereNoTouchFailsafe = inngest.createFunction(
  {
    id: "failsafe-sphere-no-touch-90d",
    name: "Failsafe: sphere/past-client, no touch in 90d",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step, logger }) => {
    return await step.run("scan", async () => {
      const db = getDb();
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const stale = await db
        .select({
          id: contacts.id,
          primaryAgentId: contacts.primaryAgentId,
          fullName: contacts.fullName,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            sql`${contacts.type} && ARRAY['past_client','sphere']::text[]`,
            lte(contacts.lastTouchAt, cutoff),
          ),
        );

      let created = 0;
      for (const c of stale) {
        const made = await createFailsafeTaskIfMissing({
          contactId: c.id,
          agentId: c.primaryAgentId,
          failsafeType: "sphere_no_touch_90d",
          title: `Check in: ${c.fullName ?? c.email ?? "sphere contact"}`,
          description:
            "90+ days since last touch. Send a personal note — text, call, or hand-written card.",
          priority: "normal",
        });
        if (made) created++;
      }

      logger.info("[failsafe] sphere_no_touch_90d", {
        scanned: stale.length,
        created,
      });
      return { scanned: stale.length, created };
    });
  },
);

/**
 * Failsafe: contact's birthday is today.
 * Per §11 + §12. Daily 8am so the team has it in the morning.
 *
 * No automated email — Phase 5+ when consent flow + FH-cleared template land.
 * Today: agent gets a task to send a personal text/note.
 */
export const birthdayFailsafe = inngest.createFunction(
  {
    id: "failsafe-birthday-today",
    name: "Failsafe: contact birthday today",
    triggers: [{ cron: "0 8 * * *" }],
  },
  async ({ step, logger }) => {
    return await step.run("scan", async () => {
      const db = getDb();
      const matching = await db
        .select({
          id: contacts.id,
          primaryAgentId: contacts.primaryAgentId,
          fullName: contacts.fullName,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            sql`${contacts.birthday} is not null`,
            sql`extract(month from ${contacts.birthday}) = extract(month from current_date)`,
            sql`extract(day from ${contacts.birthday}) = extract(day from current_date)`,
            isNull(contacts.archivedAt),
          ),
        );

      let created = 0;
      for (const c of matching) {
        const made = await createFailsafeTaskIfMissing({
          contactId: c.id,
          agentId: c.primaryAgentId,
          failsafeType: "birthday_today",
          title: `🎂 ${c.fullName ?? c.email ?? "contact"}'s birthday today`,
          description:
            "Send a personal birthday text or call. Keep it short and human.",
          priority: "normal",
        });
        if (made) created++;
      }

      logger.info("[failsafe] birthday_today", {
        matched: matching.length,
        created,
      });
      return { matched: matching.length, created };
    });
  },
);

/**
 * Failsafe: home-purchase anniversary is today.
 * Per §11 + §12. Daily 8am.
 */
export const closingAnniversaryFailsafe = inngest.createFunction(
  {
    id: "failsafe-closing-anniversary-today",
    name: "Failsafe: closing anniversary today",
    triggers: [{ cron: "0 8 * * *" }],
  },
  async ({ step, logger }) => {
    return await step.run("scan", async () => {
      const db = getDb();
      const matching = await db
        .select({
          id: contacts.id,
          primaryAgentId: contacts.primaryAgentId,
          fullName: contacts.fullName,
          email: contacts.email,
          homePurchaseDate: contacts.homePurchaseDate,
        })
        .from(contacts)
        .where(
          and(
            sql`${contacts.homePurchaseDate} is not null`,
            sql`extract(month from ${contacts.homePurchaseDate}) = extract(month from current_date)`,
            sql`extract(day from ${contacts.homePurchaseDate}) = extract(day from current_date)`,
            sql`${contacts.homePurchaseDate} < current_date`,
            isNull(contacts.archivedAt),
          ),
        );

      let created = 0;
      for (const c of matching) {
        const made = await createFailsafeTaskIfMissing({
          contactId: c.id,
          agentId: c.primaryAgentId,
          failsafeType: "closing_anniversary_today",
          title: `🏠 ${c.fullName ?? "contact"} home anniversary`,
          description:
            "Closing anniversary today. Send a personal note — optionally with a market update on their home value.",
          priority: "normal",
        });
        if (made) created++;
      }

      logger.info("[failsafe] closing_anniversary_today", {
        matched: matching.length,
        created,
      });
      return { matched: matching.length, created };
    });
  },
);

export const functions = [
  welcomeSeries,
  newLeadNoContactFailsafe,
  qualifiedNoTouchFailsafe,
  sphereNoTouchFailsafe,
  birthdayFailsafe,
  closingAnniversaryFailsafe,
];

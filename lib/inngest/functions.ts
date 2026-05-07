import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contacts, events, tasks } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { welcomeSeriesEmail } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { inngest } from "./client";

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

export const functions = [welcomeSeries, newLeadNoContactFailsafe];

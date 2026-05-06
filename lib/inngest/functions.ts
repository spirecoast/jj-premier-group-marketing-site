import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { welcomeSeriesEmail } from "@/lib/email/templates";
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
        });
        const result = await sendEmail({
          to: contact.email,
          subject: tmpl.subject,
          html: tmpl.html,
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

export const functions = [welcomeSeries];

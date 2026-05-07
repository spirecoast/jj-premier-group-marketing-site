"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { newsletterConfirmationEmail } from "@/lib/email/templates";
import { routeLead } from "@/lib/lead-routing";
import { inngest } from "@/lib/inngest/client";
import { unsubscribeUrl } from "@/lib/unsubscribe";

const newsletterSchema = z.object({
  email: z.string().trim().email("A valid email is required").max(320),
  // Honeypot
  website: z.string().max(0).optional(),
});

export type NewsletterState = {
  ok: boolean;
  error?: string;
};

export const initialNewsletterState: NewsletterState = { ok: false };

function extractUtm(formData: FormData): Record<string, string> | null {
  const utm: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("utm__") && typeof value === "string" && value) {
      utm[key.slice("utm__".length)] = value;
    }
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  const utm = extractUtm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Please enter a valid email.",
    };
  }

  if (parsed.data.website) {
    return { ok: true };
  }

  const email = parsed.data.email.toLowerCase();
  const now = new Date();
  const db = getDb();

  let contactId: string;
  try {
    const existing = await db
      .select({ id: contacts.id, type: contacts.type })
      .from(contacts)
      .where(eq(contacts.email, email))
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      contactId = row.id;
      await db
        .update(contacts)
        .set({
          consentEmail: true,
          consentEmailAt: now,
          unsubscribedEmail: false,
          lastTouchAt: now,
        })
        .where(eq(contacts.id, row.id));
    } else {
      let agentId: string | null = null;
      try {
        agentId = await routeLead({
          email,
          source: "organic",
          sourceDetail: "newsletter",
        });
      } catch (err) {
        console.error("[newsletter] routing failed; unassigned", err);
      }

      const [row] = await db
        .insert(contacts)
        .values({
          primaryAgentId: agentId,
          email,
          type: ["lead"],
          lifecycleStage: "new",
          source: utm?.utm_source ?? "organic",
          sourceDetail: "newsletter",
          utm,
          consentEmail: true,
          consentEmailAt: now,
          firstTouchAt: now,
          lastTouchAt: now,
        })
        .returning({ id: contacts.id });
      contactId = row.id;
    }

    await db.insert(events).values({
      eventType: "newsletter_signup",
      contactId,
      payload: { email },
    });
  } catch (err) {
    console.error("[newsletter] db write failed", err);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  }

  const confirmation = newsletterConfirmationEmail({
    email,
    unsubscribeUrl: unsubscribeUrl(contactId),
  });
  const result = await sendEmail({
    to: email,
    subject: confirmation.subject,
    html: confirmation.html,
    category: "marketing",
  });
  if (!result.ok) {
    console.error("[newsletter] confirmation email failed", result.error);
  }

  // Newsletter signup is the consent — enroll in the welcome series.
  try {
    await inngest.send({
      name: "lead.captured",
      data: {
        contactId,
        source: "organic",
        sourceDetail: "newsletter",
      },
    });
  } catch (err) {
    console.error("[newsletter] inngest send failed", err);
  }

  return { ok: true };
}

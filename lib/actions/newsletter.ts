"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { newsletterConfirmationEmail } from "@/lib/email/templates";

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

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
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
      const [row] = await db
        .insert(contacts)
        .values({
          email,
          type: ["lead"],
          lifecycleStage: "new",
          source: "organic",
          sourceDetail: "newsletter",
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

  const confirmation = newsletterConfirmationEmail({ email });
  const result = await sendEmail({
    to: email,
    subject: confirmation.subject,
    html: confirmation.html,
  });
  if (!result.ok) {
    console.error("[newsletter] confirmation email failed", result.error);
  }

  return { ok: true };
}

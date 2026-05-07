"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

const unsubscribeSchema = z.object({
  id: z.string().uuid(),
  sig: z.string().min(1),
});

export type UnsubscribeState = {
  ok: boolean;
  error?: string;
};

export async function applyUnsubscribe(
  _prev: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  const parsed = unsubscribeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Invalid unsubscribe link." };
  }

  if (!verifyUnsubscribe(parsed.data.id, parsed.data.sig)) {
    return { ok: false, error: "Invalid unsubscribe link." };
  }

  const db = getDb();
  const now = new Date();

  try {
    const result = await db
      .update(contacts)
      .set({
        unsubscribedEmail: true,
        consentEmail: false,
        lastTouchAt: now,
      })
      .where(eq(contacts.id, parsed.data.id))
      .returning({ id: contacts.id });

    if (result.length === 0) {
      // Treat unknown contact as success — never confirm/deny existence.
      return { ok: true };
    }

    await db.insert(events).values({
      eventType: "unsubscribed_email",
      contactId: parsed.data.id,
      payload: { method: "link" },
    });
  } catch (err) {
    console.error("[unsubscribe] db update failed", err);
    return {
      ok: false,
      error: "Couldn't process the unsubscribe. Please try again.",
    };
  }

  return { ok: true };
}

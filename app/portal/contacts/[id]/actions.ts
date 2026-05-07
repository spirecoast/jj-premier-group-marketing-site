"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { contacts, events } from "@/lib/db/schema";
import { updateScore } from "@/lib/lead-scoring";

const LIFECYCLE_STAGES = [
  "new",
  "contacted",
  "qualified",
  "active",
  "under_contract",
  "closed",
  "nurture",
  "cold",
  "lost",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

const updateStageSchema = z.object({
  contactId: z.string().uuid(),
  lifecycleStage: z.enum(LIFECYCLE_STAGES),
});

export type StageState = {
  ok: boolean;
  error?: string;
};

export async function updateLifecycleStage(
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  const agent = await requireAgent();
  const parsed = updateStageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Invalid stage." };
  }

  const db = getDb();
  const now = new Date();

  try {
    const [row] = await db
      .update(contacts)
      .set({
        lifecycleStage: parsed.data.lifecycleStage,
        lastTouchAt: now,
      })
      .where(eq(contacts.id, parsed.data.contactId))
      .returning({ id: contacts.id });

    if (!row) return { ok: false, error: "Contact not found." };

    await db.insert(events).values({
      eventType: "lifecycle_stage_changed",
      contactId: parsed.data.contactId,
      agentId: agent.id,
      payload: { stage: parsed.data.lifecycleStage, by: agent.id },
    });
    await updateScore(parsed.data.contactId);
  } catch (err) {
    console.error("[crm] stage update failed", err);
    return { ok: false, error: "Couldn't update stage." };
  }

  revalidatePath(`/portal/contacts/${parsed.data.contactId}`);
  revalidatePath("/portal/contacts");
  revalidatePath("/portal");
  return { ok: true };
}

const noteSchema = z.object({
  contactId: z.string().uuid(),
  note: z.string().trim().min(1, "Note can't be empty").max(5000),
});

export type NoteState = {
  ok: boolean;
  error?: string;
};

export async function addNote(
  _prev: NoteState,
  formData: FormData,
): Promise<NoteState> {
  const agent = await requireAgent();
  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid note.",
    };
  }

  const db = getDb();
  const now = new Date();

  try {
    await db.insert(events).values({
      eventType: "note",
      contactId: parsed.data.contactId,
      agentId: agent.id,
      payload: { note: parsed.data.note, by: agent.id, by_name: agent.name },
    });
    await db
      .update(contacts)
      .set({ lastTouchAt: now })
      .where(eq(contacts.id, parsed.data.contactId));
    await updateScore(parsed.data.contactId);
  } catch (err) {
    console.error("[crm] note insert failed", err);
    return { ok: false, error: "Couldn't save the note." };
  }

  revalidatePath(`/portal/contacts/${parsed.data.contactId}`);
  return { ok: true };
}

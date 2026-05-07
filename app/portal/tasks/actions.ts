"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { events, tasks } from "@/lib/db/schema";

const completeSchema = z.object({
  taskId: z.string().uuid(),
});

export type TaskActionState = { ok: boolean; error?: string };
export const initialTaskState: TaskActionState = { ok: false };

export async function completeTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const agent = await requireAgent();
  const parsed = completeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Invalid task." };

  const db = getDb();
  const now = new Date();

  try {
    const [row] = await db
      .update(tasks)
      .set({ completedAt: now, completedBy: agent.id })
      .where(eq(tasks.id, parsed.data.taskId))
      .returning({ id: tasks.id, contactId: tasks.contactId });

    if (!row) return { ok: false, error: "Task not found." };

    if (row.contactId) {
      await db.insert(events).values({
        eventType: "task_completed",
        contactId: row.contactId,
        agentId: agent.id,
        payload: { taskId: row.id },
      });
    }
  } catch (err) {
    console.error("[tasks] complete failed", err);
    return { ok: false, error: "Couldn't complete the task." };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/tasks");
  return { ok: true };
}

const createSchema = z.object({
  contactId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function createManualTask(
  _prev: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const agent = await requireAgent();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid task.",
    };
  }

  const db = getDb();
  try {
    await db.insert(tasks).values({
      agentId: agent.id,
      contactId: parsed.data.contactId ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
      priority: parsed.data.priority,
      source: "manual",
    });
  } catch (err) {
    console.error("[tasks] create failed", err);
    return { ok: false, error: "Couldn't create the task." };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/tasks");
  if (parsed.data.contactId) {
    revalidatePath(`/portal/contacts/${parsed.data.contactId}`);
  }
  return { ok: true };
}

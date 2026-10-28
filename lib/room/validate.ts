import { z } from "zod";
import { MAX_NAME, MAX_NOTES, MAX_PLACES, ROOM_KINDS, ROOM_STATUSES, parseStep, planQuery, type RoomContent } from "./model";

/**
 * What the team's room console may send, checked on the server before
 * anything is written. Pure, so the rules are unit-tested.
 */

const name = z
  .string()
  .transform((s) => s.replace(/\s+/g, " ").trim())
  .pipe(z.string().min(1).max(MAX_NAME));

const token = z.string().min(1).max(100);
const id = z.string().uuid();

export const createSchema = z.object({ token, name, kind: z.enum(ROOM_KINDS) });

export const saveSchema = z.object({
  token,
  id,
  name,
  kind: z.enum(ROOM_KINDS),
  step: z.string().max(12),
  /** Slugs, comma-separated, as the picker writes its hidden field. */
  places: z.string().max(MAX_PLACES * 90),
  movePlan: z.string().max(2000),
  visitPlan: z.string().max(2000),
  notes: z.string().max(MAX_NOTES),
});

export const roomIdSchema = z.object({ token, id });
export const statusSchema = z.object({ token, id, status: z.enum(ROOM_STATUSES) });

export type SaveInput = z.infer<typeof saveSchema>;

export type ContentProblem = "move" | "visit";

/**
 * A save's fields as room content. A plan link that isn't one is reported
 * rather than dropped, so the form can say which field to fix; the room is
 * saved with the rest only when both plans are good.
 */
export function contentFrom(input: SaveInput, today: string): { content: RoomContent; problems: ContentProblem[] } {
  const problems: ContentProblem[] = [];
  const places = [...new Set(input.places.split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9-]{1,80}$/.test(s)))].slice(0, MAX_PLACES);
  const move = input.movePlan.trim() ? planQuery(input.movePlan, "move", today) : null;
  if (input.movePlan.trim() && !move) problems.push("move");
  const visit = input.visitPlan.trim() ? planQuery(input.visitPlan, "visit", today) : null;
  if (input.visitPlan.trim() && !visit) problems.push("visit");
  return {
    content: { places, movePlan: move, visitPlan: visit, step: parseStep(input.step), notes: input.notes.replace(/\r\n?/g, "\n").trim().slice(0, MAX_NOTES) },
    problems,
  };
}

/** The fields of a FormData as plain strings, for the schemas above. */
export function formFields(fd: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = fd.get(k);
    out[k] = typeof v === "string" ? v : "";
  }
  return out;
}

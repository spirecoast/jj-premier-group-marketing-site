"use server";

import { revalidatePath } from "next/cache";
import { localDay } from "@/lib/encore/day";
import { roleForToken } from "@/lib/questionnaire/access";
import { TEAM_COPY as T } from "@/lib/room/copy";
import { createRoom, rotateRoomToken, setRoomStatus, updateRoom, type DbState } from "@/lib/room/store";
import { contentFrom, createSchema, formFields, roomIdSchema, saveSchema, statusSchema, type ContentProblem } from "@/lib/room/validate";
import { absoluteUrl } from "@/lib/seo";

/**
 * What the team's room console can do. Every action checks the team token
 * again (a server action can be called directly) and only the three team
 * links (lib/questionnaire/access.ts) pass. The raw room token leaves the
 * server only here, in the result of making or remaking a link.
 */

export type CreateState = { ok: true; name: string; link: string } | { ok: false; error: string } | null;
export type SaveState = { ok: true; at: string } | { ok: false; error: string; problems?: ContentProblem[] } | null;
export type LinkState = { link: string } | { error: string } | null;

function dbMessage(state: DbState): string {
  return state === "missing" ? T.missing : T.error;
}

function roomLink(token: string): string {
  return absoluteUrl(`/room/${token}`);
}

function consolePath(token: string, id?: string): string {
  return `/q/${encodeURIComponent(token)}/rooms${id ? `/${id}` : ""}`;
}

export async function createRoomAction(_prev: CreateState, fd: FormData): Promise<CreateState> {
  const parsed = createSchema.safeParse(formFields(fd, ["token", "name", "kind"]));
  if (!parsed.success) return { ok: false, error: T.invalid };
  const role = roleForToken(parsed.data.token);
  if (!role) return { ok: false, error: T.invalid };
  const made = await createRoom({ name: parsed.data.name, kind: parsed.data.kind, createdBy: role });
  if (made.state !== "ok" || !made.token || !made.room) return { ok: false, error: dbMessage(made.state) };
  revalidatePath(consolePath(parsed.data.token));
  return { ok: true, name: made.room.name, link: roomLink(made.token) };
}

export async function saveRoomAction(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const parsed = saveSchema.safeParse(formFields(fd, ["token", "id", "name", "kind", "step", "places", "movePlan", "visitPlan", "notes"]));
  if (!parsed.success) return { ok: false, error: T.invalid };
  if (!roleForToken(parsed.data.token)) return { ok: false, error: T.invalid };
  const { content, problems } = contentFrom(parsed.data, localDay(Date.now()));
  const state = await updateRoom(parsed.data.id, { name: parsed.data.name, kind: parsed.data.kind, content });
  if (state !== "ok") return { ok: false, error: dbMessage(state), problems };
  revalidatePath(consolePath(parsed.data.token));
  revalidatePath(consolePath(parsed.data.token, parsed.data.id));
  if (problems.length) return { ok: false, error: problems.includes("move") ? T.badMove : T.badVisit, problems };
  return { ok: true, at: new Date().toISOString() };
}

export async function rotateLinkAction(_prev: LinkState, fd: FormData): Promise<LinkState> {
  const parsed = roomIdSchema.safeParse(formFields(fd, ["token", "id"]));
  if (!parsed.success || !roleForToken(parsed.data.token)) return { error: T.invalid };
  const r = await rotateRoomToken(parsed.data.id);
  if (r.state !== "ok" || !r.token) return { error: dbMessage(r.state) };
  return { link: roomLink(r.token) };
}

export async function setStatusAction(fd: FormData): Promise<void> {
  const parsed = statusSchema.safeParse(formFields(fd, ["token", "id", "status"]));
  if (!parsed.success || !roleForToken(parsed.data.token)) return;
  await setRoomStatus(parsed.data.id, parsed.data.status);
  revalidatePath(consolePath(parsed.data.token));
  revalidatePath(consolePath(parsed.data.token, parsed.data.id));
}

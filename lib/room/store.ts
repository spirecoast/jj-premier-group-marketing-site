import "server-only";
import { randomBytes } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { clientRooms } from "@/lib/db/schema";
import { hashToken } from "@/lib/questionnaire/access";
import { EMPTY_CONTENT, ROOM_KINDS, ROOM_STATUSES, readContent, tokenShape, type Room, type RoomContent, type RoomKind, type RoomStatus } from "./model";

/**
 * Postgres storage for client rooms (table client_rooms, migration 0019).
 * The table is created on first use in each server process, so the pages
 * work even if nobody has run the migration yet.
 *
 * Tokens: a room's link is /room/<token>, 18 random bytes as base64url. Only
 * the SHA-256 of the token is stored, as the questionnaire does
 * (lib/questionnaire/access.ts); the raw token leaves this file once, from
 * createRoom or rotateRoomToken, for the agent to copy, and is never kept.
 *
 * Without DATABASE_URL nothing here throws: readers get "missing" and the
 * pages say so, and a client's link is a plain 404.
 */

export type DbState = "ok" | "missing" | "error";

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS "client_rooms" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "token_hash" text NOT NULL,
    "name" text NOT NULL,
    "kind" text DEFAULT 'buying' NOT NULL,
    "status" text DEFAULT 'open' NOT NULL,
    "content" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_by" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "closed_at" timestamp with time zone
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "client_rooms_token_hash_idx" ON "client_rooms" ("token_hash")`,
  `ALTER TABLE "client_rooms" ENABLE ROW LEVEL SECURITY`,
];

let ready: Promise<void> | null = null;

async function db() {
  const database = getDb();
  if (!ready) {
    ready = (async () => {
      for (const statement of DDL) await database.execute(sql.raw(statement));
    })();
    // A failure (database asleep, a race with another process) is retried on the next call.
    ready.catch(() => {
      ready = null;
    });
  }
  await ready;
  return database;
}

function toRoom(row: typeof clientRooms.$inferSelect): Room {
  return {
    id: row.id,
    name: row.name,
    kind: (ROOM_KINDS as readonly string[]).includes(row.kind) ? (row.kind as RoomKind) : "buying",
    status: (ROOM_STATUSES as readonly string[]).includes(row.status) ? (row.status as RoomStatus) : "open",
    content: readContent(row.content),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function newToken(): string {
  return randomBytes(18).toString("base64url");
}

function hashHex(token: string): string {
  return hashToken(token).toString("hex");
}

function failed(what: string, err: unknown): "error" {
  console.error(`[room] ${what} failed:`, err instanceof Error ? err.message : err);
  return "error";
}

/** The room behind a client's link, or null for anything but an open room (no database, a bad token, a closed room). */
export async function loadRoomByToken(token: unknown): Promise<Room | null> {
  if (!dbConfigured() || !tokenShape(token)) return null;
  try {
    const database = await db();
    const rows = await database.select().from(clientRooms).where(eq(clientRooms.tokenHash, hashHex(token))).limit(1);
    const row = rows[0];
    if (!row || row.status !== "open") return null;
    return toRoom(row);
  } catch (err) {
    failed("load by token", err);
    return null;
  }
}

export async function listRooms(): Promise<{ state: DbState; rooms: Room[] }> {
  if (!dbConfigured()) return { state: "missing", rooms: [] };
  try {
    const database = await db();
    const rows = await database.select().from(clientRooms).orderBy(desc(clientRooms.updatedAt)).limit(500);
    const rooms = rows.map(toRoom);
    // Open rooms first, each group newest first.
    rooms.sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1));
    return { state: "ok", rooms };
  } catch (err) {
    return { state: failed("list", err), rooms: [] };
  }
}

export async function getRoom(id: string): Promise<{ state: DbState; room: Room | null }> {
  if (!dbConfigured()) return { state: "missing", room: null };
  try {
    const database = await db();
    const rows = await database.select().from(clientRooms).where(eq(clientRooms.id, id)).limit(1);
    return { state: "ok", room: rows[0] ? toRoom(rows[0]) : null };
  } catch (err) {
    return { state: failed("get", err), room: null };
  }
}

/** A new, empty, open room. The token comes back once, for the agent to copy. */
export async function createRoom(input: { name: string; kind: RoomKind; createdBy: string }): Promise<{ state: DbState; room?: Room; token?: string }> {
  if (!dbConfigured()) return { state: "missing" };
  try {
    const database = await db();
    const token = newToken();
    const rows = await database
      .insert(clientRooms)
      .values({ tokenHash: hashHex(token), name: input.name, kind: input.kind, content: EMPTY_CONTENT, createdBy: input.createdBy })
      .returning();
    const row = rows[0];
    if (!row) return { state: "error" };
    return { state: "ok", room: toRoom(row), token };
  } catch (err) {
    return { state: failed("create", err) };
  }
}

export async function updateRoom(id: string, input: { name: string; kind: RoomKind; content: RoomContent }): Promise<DbState> {
  if (!dbConfigured()) return "missing";
  try {
    const database = await db();
    await database.update(clientRooms).set({ name: input.name, kind: input.kind, content: input.content, updatedAt: new Date() }).where(eq(clientRooms.id, id));
    return "ok";
  } catch (err) {
    return failed("update", err);
  }
}

/** A fresh token for the room; the old link stops working at once. The token comes back once. */
export async function rotateRoomToken(id: string): Promise<{ state: DbState; token?: string }> {
  if (!dbConfigured()) return { state: "missing" };
  try {
    const database = await db();
    const token = newToken();
    const rows = await database.update(clientRooms).set({ tokenHash: hashHex(token) }).where(eq(clientRooms.id, id)).returning({ id: clientRooms.id });
    return rows[0] ? { state: "ok", token } : { state: "error" };
  } catch (err) {
    return { state: failed("rotate", err) };
  }
}

export async function setRoomStatus(id: string, status: RoomStatus): Promise<DbState> {
  if (!dbConfigured()) return "missing";
  try {
    const database = await db();
    await database
      .update(clientRooms)
      .set({ status, closedAt: status === "closed" ? new Date() : null })
      .where(eq(clientRooms.id, id));
    return "ok";
  } catch (err) {
    return failed("status", err);
  }
}

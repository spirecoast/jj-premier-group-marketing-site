/**
 * Tables are created by the migrations in lib/db/migrations, never from a
 * request. When code runs against a database that hasn't had a migration
 * applied yet, the query fails with Postgres "undefined_table" (42P01); the
 * caller fails soft and this logs one clear line per table per process
 * instead of an error on every request.
 */

const UNDEFINED_TABLE = "42P01";

/** True for Postgres "relation does not exist", whether postgres.js threw it or Drizzle wrapped it. */
export function isMissingTable(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && typeof e === "object" && depth < 4; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === UNDEFINED_TABLE) return true;
  }
  return false;
}

const warned = new Set<string>();

/** Logs, once per process, that `table` is missing and which migration creates it. Returns whether it logged. */
export function warnMissingTable(table: string, migration: string, log: (line: string) => void = console.error): boolean {
  if (warned.has(table)) return false;
  warned.add(table);
  log(`[db] table "${table}" doesn't exist yet: apply lib/db/migrations/${migration} (docs/LAUNCH.md 4.3). Until then this feature stays off.`);
  return true;
}

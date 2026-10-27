/**
 * Which deployment this is, and whether it may touch the outside world.
 *
 * Preview deployments share production's database and keys (docs/LAUNCH.md
 * section 2), so a test on a preview would otherwise put a lead in the CRM,
 * email the team, spend the Google Places allowance and count in Plausible.
 * On Vercel only the production deployment does those things; a preview
 * (or `vercel dev`) does the work, keeps what it writes marked as a test,
 * and says what it held back.
 *
 * Off Vercel (`next dev`, `next start` on a laptop) VERCEL_ENV is unset and
 * the keys decide, as before: a local build has none unless someone put them
 * in .env.local on purpose.
 *
 * Pure: reads the env object it's given (process.env by default). Free of
 * imports so the edge runtime and client components can load it; in the
 * browser only NEXT_PUBLIC_VERCEL_ENV is visible, which Vercel sets on every
 * deployment.
 */

type Env = Record<string, string | undefined>;

export type DeployEnv = "production" | "preview" | "development" | "local";

export function deployEnv(env: Env = process.env): DeployEnv {
  const v = (env.VERCEL_ENV || env.NEXT_PUBLIC_VERCEL_ENV || "").trim().toLowerCase();
  if (v === "production" || v === "preview" || v === "development") return v;
  // A custom Vercel environment (anything else it may name) is treated like a preview.
  if (v) return "preview";
  return "local";
}

/**
 * True where real side effects are allowed: the CRM, Zapier, team and
 * subscriber email, Google Places, Plausible. False on a Vercel preview or
 * development deployment.
 */
export function sideEffectsAllowed(env: Env = process.env): boolean {
  const d = deployEnv(env);
  return d === "production" || d === "local";
}

/** A Vercel deployment that isn't production. Its writes are marked as tests. */
export function isPreviewDeployment(env: Env = process.env): boolean {
  return !sideEffectsAllowed(env);
}

/**
 * Where a preview may send its email instead of the real recipients:
 * PREVIEW_EMAIL_TO, one test inbox. Null (the default) means previews send
 * no email at all. Never used on production.
 */
export function previewEmailTo(env: Env = process.env): string | null {
  if (sideEffectsAllowed(env)) return null;
  const to = (env.PREVIEW_EMAIL_TO ?? "").trim();
  return /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(to) ? to : null;
}

/** One line for logs and for /api/health saying what a preview holds back. */
export const PREVIEW_HOLD_NOTE =
  "Preview deployment: no CRM, Zapier, Google Places or Plausible; email only to PREVIEW_EMAIL_TO when set; leads saved as tests.";

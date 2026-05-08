import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";
import { DemoControls } from "./demo-controls";

export const metadata: Metadata = {
  title: "Dev tools",
  robots: { index: false, follow: false },
};

const ADMIN_EMAILS = (process.env.DEMO_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default async function DevToolsPage() {
  const agent = await requireAgent();
  const isAdmin =
    ADMIN_EMAILS.length === 0
      ? true
      : ADMIN_EMAILS.includes(agent.email.toLowerCase());

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="portal-h1 mb-1">Dev tools</h1>
        <p className="text-sm text-muted-foreground">
          Admin-only utilities. Not linked from the main nav.
        </p>
      </header>

      {!isAdmin ? (
        <div className="bg-surface border border-border rounded-md px-4 py-8 text-center text-sm text-muted-foreground">
          Only admins listed in <code>DEMO_ADMIN_EMAILS</code> can use these.
        </div>
      ) : (
        <section className="bg-surface border border-border rounded-md">
          <header className="px-3 py-2 border-b border-border">
            <h2 className="portal-h2">Demo data</h2>
          </header>
          <div className="px-4 py-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seed creates 20 fake contacts spread across lifecycle stages,
              with backdated timestamps so the dashboard sparklines have a
              shape. Each demo contact is tagged with{" "}
              <code className="text-xs">utm.demo_seed = true</code> so wipe
              removes only those rows (cascades to events + tasks).
            </p>
            <DemoControls />
          </div>
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Today",
  robots: { index: false, follow: false },
};

export default async function PortalHome() {
  const agent = await requireAgent();

  return (
    <section className="px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">Today</p>
        <h1 className="text-section mb-6">Welcome, {agent.name.split(" ")[0]}.</h1>
        <p className="text-lg text-muted-foreground">
          Today view ships in the dashboard slice. For now, you&rsquo;re signed
          in.
        </p>
      </div>
    </section>
  );
}

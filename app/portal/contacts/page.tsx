import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false },
};

export default async function ContactsPage() {
  await requireAgent();

  return (
    <section className="px-6 lg:px-12 py-16">
      <div className="max-w-7xl mx-auto">
        <p className="text-eyebrow text-muted-foreground mb-3">Contacts</p>
        <h1 className="text-section mb-6">All leads</h1>
        <p className="text-muted-foreground">
          List view ships in the dashboard slice.
        </p>
      </div>
    </section>
  );
}

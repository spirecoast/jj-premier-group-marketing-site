import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { agents, contacts } from "@/lib/db/schema";
import { formatDate, formatRelative } from "@/lib/format";
import { ScoreBadge } from "../page";

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 100;

export default async function ContactsList() {
  await requireAgent();
  const db = getDb();

  const rows = await db
    .select({
      id: contacts.id,
      fullName: contacts.fullName,
      email: contacts.email,
      phone: contacts.phone,
      source: contacts.source,
      sourceDetail: contacts.sourceDetail,
      lifecycleStage: contacts.lifecycleStage,
      consentEmail: contacts.consentEmail,
      score: contacts.score,
      temperature: contacts.temperature,
      createdAt: contacts.createdAt,
      lastTouchAt: contacts.lastTouchAt,
      agentName: agents.name,
    })
    .from(contacts)
    .leftJoin(agents, eq(contacts.primaryAgentId, agents.id))
    .orderBy(desc(contacts.score), desc(contacts.createdAt))
    .limit(PAGE_SIZE);

  return (
    <section className="px-6 lg:px-12 py-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-eyebrow text-muted-foreground mb-3">Contacts</p>
            <h1 className="text-section">All leads</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing latest {rows.length}
            {rows.length === PAGE_SIZE ? ` of last ${PAGE_SIZE}` : ""}
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="bg-surface border border-border rounded-md p-12 text-center text-muted-foreground">
            No contacts yet. New leads land here as soon as someone submits the
            contact form or newsletter signup.
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated text-eyebrow text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Stage</th>
                  <th className="text-left px-4 py-3">Owner</th>
                  <th className="text-left px-4 py-3">Consent</th>
                  <th className="text-left px-4 py-3">Last touch</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/contacts/${c.id}` as never}
                        className="text-brand hover:text-brand-hover"
                      >
                        {c.fullName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge
                        score={c.score}
                        temperature={c.temperature}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{c.email ?? "—"}</span>
                        {c.phone ? (
                          <span className="text-xs">{c.phone}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.sourceDetail ?? c.source ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-brand-muted text-foreground text-xs">
                        {c.lifecycleStage ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.agentName ?? (
                        <span className="text-warning">unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.consentEmail ? "email ✓" : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatRelative(c.lastTouchAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

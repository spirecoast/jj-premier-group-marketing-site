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
    <div className="px-4 lg:px-6 py-6 max-w-[1400px] mx-auto w-full">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="portal-h1 mb-1">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Nobody yet."
              : `${rows.length}${rows.length === PAGE_SIZE ? `+ shown · latest ${PAGE_SIZE}` : ""}`}
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="bg-surface border border-border rounded-md px-4 py-16 text-center">
          <p className="text-sm font-medium text-foreground">
            No contacts yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            New leads land here as soon as someone submits the contact form
            or newsletter signup.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Stage</th>
                  <th className="px-3 py-2.5">Owner</th>
                  <th className="px-3 py-2.5">Consent</th>
                  <th className="px-3 py-2.5">Last touch</th>
                  <th className="px-3 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-surface-elevated transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/portal/contacts/${c.id}` as never}
                        className="text-foreground hover:text-brand font-medium"
                      >
                        {c.fullName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <ScoreBadge
                        score={c.score}
                        temperature={c.temperature}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <div className="flex flex-col leading-tight">
                        <span>{c.email ?? "—"}</span>
                        {c.phone ? (
                          <span className="text-xs">{c.phone}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {c.sourceDetail ?? c.source ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <StageChip stage={c.lifecycleStage} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {c.agentName ?? (
                        <span className="text-warning">unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      {c.consentEmail ? "email ✓" : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatRelative(c.lastTouchAt)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StageChip({ stage }: { stage: string | null }) {
  if (!stage) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  const styles: Record<string, string> = {
    new: "bg-info/10 text-info",
    contacted: "bg-info/10 text-info",
    qualified: "bg-brand-muted text-brand",
    active: "bg-brand-muted text-brand",
    under_contract: "bg-warning/15 text-warning",
    closed: "bg-success/10 text-success",
    nurture: "bg-surface-elevated text-muted-foreground",
    cold: "bg-surface-elevated text-muted-foreground",
    lost: "bg-surface-elevated text-muted-foreground",
  };
  const cls = styles[stage] ?? "bg-surface-elevated text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}
    >
      {stage.replace(/_/g, " ")}
    </span>
  );
}

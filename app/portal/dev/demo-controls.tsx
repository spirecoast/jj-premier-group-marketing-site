"use client";

import { useState, useTransition } from "react";
import { seedDemoData, wipeDemoData } from "./actions";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function DemoControls() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function runSeed() {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await seedDemoData();
      if (result.ok) {
        setStatus({ kind: "ok", message: `Seeded ${result.count} contacts.` });
      } else {
        setStatus({ kind: "error", message: result.error ?? "Failed." });
      }
    });
  }

  function runWipe() {
    if (!confirm("Wipe all demo contacts (and their events + tasks)?")) return;
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await wipeDemoData();
      if (result.ok) {
        setStatus({ kind: "ok", message: `Wiped ${result.count} contacts.` });
      } else {
        setStatus({ kind: "error", message: result.error ?? "Failed." });
      }
    });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={runSeed}
        disabled={isPending}
        className="px-4 py-2 bg-brand text-inverse text-sm rounded-md hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Working…" : "Seed 20 contacts"}
      </button>
      <button
        type="button"
        onClick={runWipe}
        disabled={isPending}
        className="px-4 py-2 bg-surface border border-border-strong text-sm rounded-md hover:bg-surface-elevated transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Wipe demo data
      </button>
      {status.kind === "ok" ? (
        <span className="text-xs text-success">{status.message}</span>
      ) : status.kind === "error" ? (
        <span className="text-xs text-danger">{status.message}</span>
      ) : null}
    </div>
  );
}

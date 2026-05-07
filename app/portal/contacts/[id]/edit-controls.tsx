"use client";

import { useActionState } from "react";
import {
  addNote,
  initialNoteState,
  initialStageState,
  updateLifecycleStage,
  type NoteState,
  type StageState,
} from "./actions";

const STAGES = [
  "new",
  "contacted",
  "qualified",
  "active",
  "under_contract",
  "closed",
  "nurture",
  "cold",
  "lost",
] as const;

export function StageEditor({
  contactId,
  currentStage,
}: {
  contactId: string;
  currentStage: string | null;
}) {
  const [state, formAction, isPending] = useActionState<StageState, FormData>(
    updateLifecycleStage,
    initialStageState,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="contactId" value={contactId} />
      <select
        name="lifecycleStage"
        defaultValue={currentStage ?? "new"}
        className="px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-2 bg-brand text-inverse text-sm rounded-sm hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "…" : "Update"}
      </button>
      {state.error ? (
        <span className="text-xs text-danger ml-2" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

export function NoteForm({ contactId }: { contactId: string }) {
  const [state, formAction, isPending] = useActionState<NoteState, FormData>(
    addNote,
    initialNoteState,
  );

  return (
    <form action={formAction} className="space-y-3" key={state.ok ? "fresh" : "open"}>
      <input type="hidden" name="contactId" value={contactId} />
      <label className="block">
        <span className="text-eyebrow text-muted-foreground mb-2 block">
          Add a note
        </span>
        <textarea
          name="note"
          rows={3}
          required
          maxLength={5000}
          placeholder="What happened? What's next?"
          className="w-full px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none resize-y"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-brand text-inverse text-sm rounded-sm hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save note"}
        </button>
        {state.error ? (
          <span className="text-xs text-danger" role="alert">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span className="text-xs text-success">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}

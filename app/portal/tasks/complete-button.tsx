"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { completeTask, type TaskActionState } from "./actions";

const initialTaskState: TaskActionState = { ok: false };

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [state, formAction, isPending] = useActionState<
    TaskActionState,
    FormData
  >(completeTask, initialTaskState);
  const lastRef = useRef<TaskActionState | null>(null);
  useEffect(() => {
    if (state === lastRef.current) return;
    if (state.ok) {
      toast.success("Task completed");
      lastRef.current = state;
    } else if (state.error) {
      toast.error(state.error);
      lastRef.current = state;
    }
  }, [state]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors disabled:opacity-60"
      >
        {isPending ? "…" : state.ok ? "Done" : "Complete"}
      </button>
      {state.error ? (
        <span className="text-xs text-danger ml-2">{state.error}</span>
      ) : null}
    </form>
  );
}

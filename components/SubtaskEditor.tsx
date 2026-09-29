"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import type { ActionResult } from "@/lib/actions/result";
import { createSubtask, setSubtaskDone } from "@/lib/actions/subtasks";
import { cn } from "@/lib/cn";
import type { Subtask } from "@/lib/types";

import { ToggleCheckbox } from "./ToggleCheckbox";

const initialState: ActionResult = { error: null };

/** The subtask block: an add row plus a toggle per subtask. */
export function SubtaskEditor({
  taskId,
  subtasks,
}: {
  taskId: string;
  subtasks: Subtask[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createSubtask,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (state.at) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state.at]);

  return (
    <div className="space-y-1">
      {open ? (
        <form
          ref={formRef}
          action={formAction}
          className="flex items-center gap-3 px-3 py-2"
        >
          <input type="hidden" name="taskId" value={taskId} />
          <Plus aria-hidden className="size-4 shrink-0 text-ink-soft" />
          <input
            ref={inputRef}
            name="title"
            placeholder="Subtask"
            aria-label="New subtask title"
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-1 text-[13px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cancel"
            className="text-muted transition-colors hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] text-ink-soft transition-colors hover:bg-black/[0.03]"
        >
          <Plus aria-hidden className="size-4 shrink-0" />
          <span>Add New Subtask</span>
        </button>
      )}

      {state.error && (
        <p role="alert" className="px-3 text-[12px] text-ink">
          {state.error}
        </p>
      )}

      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-3 px-3 py-2">
          <ToggleCheckbox
            action={setSubtaskDone}
            idField="subtaskId"
            id={subtask.id}
            checked={subtask.done}
            label={`Mark "${subtask.title}" as done`}
          />
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[15px]",
              subtask.done ? "text-muted line-through" : "text-ink",
            )}
          >
            {subtask.title}
          </span>
        </div>
      ))}
    </div>
  );
}

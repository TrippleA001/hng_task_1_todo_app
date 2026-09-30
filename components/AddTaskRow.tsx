"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/lib/actions/result";
import { createTask } from "@/lib/actions/tasks";
import { taskHref } from "@/lib/views";

const initialState: ActionResult = { error: null };

const rowClasses =
  "flex w-full items-center gap-3 rounded-[10px] border border-line-strong bg-field px-3.5 py-3";

/**
 * "+ Add New Task": a collapsed row that expands into a quick-add field.
 *
 * The list and due date are supplied as hidden fields by whichever view renders
 * it, so a task added from Today is due today.
 */
export function AddTaskRow({
  listId,
  dueDate,
  view,
  query = "",
}: {
  listId?: string;
  dueDate?: string;
  /** The active view, so the new task's detail panel opens in place. */
  view: string;
  query?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSeenAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clear the field after each successful add so several tasks can be entered in
  // a row, then open the new task's details so its date, list and tags can be
  // set without hunting for it. `state.at` changes on every success, which a
  // null error cannot convey.
  useEffect(() => {
    if (state.at && state.at !== lastSeenAt.current) {
      lastSeenAt.current = state.at;
      formRef.current?.reset();
      inputRef.current?.focus();
      if (state.taskId) {
        router.push(taskHref(view, state.taskId, query));
      }
    }
  }, [state.at, state.taskId, router, view, query]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${rowClasses} text-left text-[15px] text-ink-soft transition-colors hover:bg-black/[0.03]`}
      >
        <Plus aria-hidden className="size-4 shrink-0" />
        <span>Add New Task</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`${rowClasses} flex-col items-stretch gap-2`}
    >
      <div className="flex items-center gap-3">
        <Plus aria-hidden className="size-4 shrink-0 text-ink-soft" />
        <input
          ref={inputRef}
          name="title"
          placeholder="Task name"
          aria-label="New task title"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
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
      </div>

      {listId && <input type="hidden" name="listId" value={listId} />}
      {dueDate && <input type="hidden" name="dueDate" value={dueDate} />}

      {state.error && (
        <p role="alert" className="text-[12px] text-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}

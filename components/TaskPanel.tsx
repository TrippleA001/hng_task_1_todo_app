"use client";

import { addDays } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useActionState, type ReactNode } from "react";

import type { ActionResult } from "@/lib/actions/result";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/cn";
import { formatDueDate, toIsoDate, today } from "@/lib/format";
import type { List, Tag, Task } from "@/lib/types";

import { Button } from "./Button";
import { SubtaskEditor } from "./SubtaskEditor";

const initialState: ActionResult = { error: null };

const inputClasses =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-muted focus:outline-none";

/** Two-column label/control row, matching the mood board's alignment. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[68px_1fr] items-center gap-3">
      <span className="text-[13px] text-ink-soft">{label}</span>
      {children}
    </div>
  );
}

/** A borderless select with the chevron the mood board shows. */
function PlainSelect({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        aria-label={name}
        defaultValue={defaultValue}
        className="w-full appearance-none bg-transparent pr-5 text-sm font-medium text-ink focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-ink"
      />
    </div>
  );
}

/**
 * The whole right-hand panel body.
 *
 * Two structural details worth keeping:
 *
 * 1. The field form and the subtask forms are *siblings*, never nested - HTML
 *    forbids nested forms, so putting subtasks inside the task form would
 *    silently break every subtask toggle.
 * 2. Save/Delete live outside the form but carry `form="task-form"`, which is
 *    how HTML associates a button with a form it is not inside. That keeps them
 *    visually last, as the mood board shows, without JavaScript-only tricks.
 *
 * Render with `key={task.id}` so switching tasks remounts the uncontrolled
 * fields and their defaults apply.
 */
export function TaskPanel({
  task,
  lists,
  tags,
}: {
  task: Task;
  lists: List[];
  tags: Tag[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateTask,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTask,
    initialState,
  );

  const error = updateState.error ?? deleteState.error;
  const busy = updatePending || deletePending;

  const dueDateOptions = [
    { value: "", label: "No due date" },
    ...Array.from({ length: 14 }, (_, index) => {
      const iso = toIsoDate(addDays(today(), index));
      return { value: iso, label: formatDueDate(iso) };
    }),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form id="task-form" action={updateAction} className="flex flex-col">
        <input type="hidden" name="taskId" value={task.id} />

        <input
          name="title"
          aria-label="Task title"
          defaultValue={task.title}
          className={inputClasses}
        />

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[13px] text-ink-soft">
              Description
            </span>
            <textarea
              name="description"
              rows={5}
              placeholder="Description"
              defaultValue={task.description}
              className={cn(inputClasses, "resize-none")}
            />
          </label>

          <Field label="List">
            <PlainSelect
              name="listId"
              defaultValue={task.listId}
              options={lists.map((list) => ({
                value: list.id,
                label: list.name,
              }))}
            />
          </Field>

          <Field label="Due date">
            <PlainSelect
              name="dueDate"
              defaultValue={task.dueDate ?? ""}
              options={dueDateOptions}
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="tagIds"
                    value={tag.id}
                    defaultChecked={task.tagIds.includes(tag.id)}
                    className="peer sr-only"
                  />
                  <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-[12px] font-medium leading-none text-ink-soft ring-1 ring-line-strong transition-colors peer-checked:bg-line peer-checked:text-ink peer-checked:ring-transparent">
                    {tag.name}
                  </span>
                </label>
              ))}
              {tags.length === 0 && (
                <span className="text-[13px] text-muted">No tags yet</span>
              )}
            </div>
          </Field>
        </div>
      </form>

      <h2 className="pt-7 pb-2 text-[17px] font-bold text-ink">Subtasks:</h2>
      <SubtaskEditor taskId={task.id} subtasks={task.subtasks} />

      {error && (
        <p role="alert" aria-live="polite" className="pt-5 text-[13px] text-ink">
          {error}
        </p>
      )}
      {!error && updateState.at !== undefined && !busy && (
        <p aria-live="polite" className="pt-5 text-[13px] text-muted">
          Saved.
        </p>
      )}

      <div className="mt-auto flex gap-3 pt-8">
        <Button
          type="submit"
          form="task-form"
          formAction={deleteAction}
          variant="ghost"
          disabled={busy}
          onClick={(event) => {
            // Placeholder for a proper confirm dialog - losing a task with
            // subtasks attached should never be one misclick away.
            if (!window.confirm("Delete this task?")) event.preventDefault();
          }}
          className="flex-1 py-3.5 disabled:opacity-60"
        >
          {deletePending ? "Deleting…" : "Delete Task"}
        </Button>
        <Button
          type="submit"
          form="task-form"
          disabled={busy}
          className="flex-1 py-3.5 disabled:opacity-60"
        >
          {updatePending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

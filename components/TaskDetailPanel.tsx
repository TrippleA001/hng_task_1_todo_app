import { addDays } from "date-fns";
import { ChevronDown, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatDueDate, toIsoDate, today } from "@/lib/format";
import type { Task, Workspace } from "@/lib/types";

import { AddRow } from "./AddRow";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Chip } from "./Chip";

const selectClasses =
  "w-full appearance-none bg-transparent pr-5 text-sm font-medium text-ink focus:outline-none";

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
        className={selectClasses}
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
 * The right-hand editor: title, description, list, due date, tags, subtasks and
 * the Delete / Save actions.
 */
export function TaskDetailPanel({
  task,
  workspace,
}: {
  task: Task;
  workspace: Workspace;
}) {
  // The mock's "Due date" is a dropdown, so offer a window of upcoming days.
  const dueDateOptions = [
    { value: "", label: "No due date" },
    ...Array.from({ length: 14 }, (_, index) => {
      const iso = toIsoDate(addDays(today(), index));
      return { value: iso, label: formatDueDate(iso) };
    }),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <h2 className="pb-3 text-[17px] font-bold text-ink">Task:</h2>
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
            name="List"
            defaultValue={task.listId}
            options={workspace.lists.map((list) => ({
              value: list.id,
              label: list.name,
            }))}
          />
        </Field>

        <Field label="Due date">
          <PlainSelect
            name="Due date"
            defaultValue={task.dueDate ?? ""}
            options={dueDateOptions}
          />
        </Field>

        <Field label="Tags">
          <div className="flex flex-wrap items-center gap-2">
            {workspace.tags.map((tag) => (
              <Chip
                key={tag.id}
                tone={task.tagIds.includes(tag.id) ? "active" : "outline"}
              >
                {tag.name}
              </Chip>
            ))}
            <Chip tone="outline" icon={<Plus aria-hidden className="size-3" />}>
              Add Tag
            </Chip>
          </div>
        </Field>
      </div>

      <h2 className="pt-7 pb-2 text-[17px] font-bold text-ink">Subtasks:</h2>
      <AddRow label="Add New Subtask" />

      <div className="space-y-1">
        {task.subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-3 px-3 py-2">
            <Checkbox
              defaultChecked={subtask.done}
              aria-label={`Mark "${subtask.title}" as done`}
            />
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
              {subtask.title}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-3 pt-8">
        <Button variant="ghost" className="flex-1 py-3.5">
          Delete Task
        </Button>
        <Button className="flex-1 py-3.5">Save changes</Button>
      </div>
    </div>
  );
}

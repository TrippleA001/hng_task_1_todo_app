import Link from "next/link";
import { CalendarDays, ChevronRight, ListChecks } from "lucide-react";

import { setTaskDone } from "@/lib/actions/tasks";
import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/format";
import { subtaskTotal } from "@/lib/selectors";
import type { List, Task } from "@/lib/types";
import { taskHref } from "@/lib/views";

import { Chip } from "./Chip";
import { Swatch } from "./Swatch";
import { ToggleCheckbox } from "./ToggleCheckbox";

/**
 * One row in the middle column: round checkbox, title, metadata chips, chevron.
 *
 * Chips are rendered from the data, so a task shows its due date, subtask count
 * and list whenever it has them. The title and chevron link to the same URL with
 * the task selected, which is what opens the detail panel - the checkbox stays a
 * separate form so checking a task never navigates.
 */
export function TaskRow({
  task,
  list,
  view,
  query = "",
  selected = false,
  className,
}: {
  task: Task;
  list?: List;
  /** The active view, so the link returns to the same list after closing. */
  view: string;
  query?: string;
  selected?: boolean;
  className?: string;
}) {
  const subtasks = subtaskTotal(task);
  const hasMeta = Boolean(task.dueDate) || subtasks > 0 || Boolean(list);
  const overdue = isOverdue(task.dueDate) && !task.done;
  const href = taskHref(view, task.id, query);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border-b border-line px-2 py-4 last:border-b-0",
        selected && "bg-black/[0.04]",
        className,
      )}
    >
      <ToggleCheckbox
        action={setTaskDone}
        idField="taskId"
        id={task.id}
        checked={task.done}
        label={`Mark "${task.title}" as done`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-[15px] font-medium text-ink hover:underline"
        >
          {task.title}
        </Link>
        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.dueDate && (
              <Chip
                tone={overdue ? "danger" : "soft"}
                icon={<CalendarDays aria-hidden className="size-3.5" />}
              >
                {overdue
                  ? `Overdue ${formatDueDate(task.dueDate)}`
                  : formatDueDate(task.dueDate)}
              </Chip>
            )}
            {subtasks > 0 && (
              <Chip icon={<ListChecks aria-hidden className="size-3.5" />}>
                {subtasks} Subtasks
              </Chip>
            )}
            {list && (
              <Chip icon={<Swatch color={list.color} className="size-3" />}>
                {list.name}
              </Chip>
            )}
          </div>
        )}
      </div>
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className="mt-1 shrink-0 text-muted"
      >
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

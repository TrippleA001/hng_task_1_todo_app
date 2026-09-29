import { CalendarDays, ChevronRight, ListChecks } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDueDate } from "@/lib/format";
import { subtaskTotal } from "@/lib/selectors";
import type { List, Task } from "@/lib/types";

import { Checkbox } from "./Checkbox";
import { Chip } from "./Chip";
import { Swatch } from "./Swatch";

/**
 * One row in the middle column: round checkbox, title, metadata chips, chevron.
 *
 * Chips are rendered from the data, so a task shows its due date, subtask count
 * and list whenever it has them.
 */
export function TaskRow({
  task,
  list,
  className,
}: {
  task: Task;
  list?: List;
  className?: string;
}) {
  const subtasks = subtaskTotal(task);
  const hasMeta = Boolean(task.dueDate) || subtasks > 0 || Boolean(list);

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-line py-4 last:border-b-0",
        className,
      )}
    >
      <Checkbox
        defaultChecked={task.done}
        aria-label={`Mark "${task.title}" as done`}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{task.title}</p>
        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.dueDate && (
              <Chip icon={<CalendarDays aria-hidden className="size-3.5" />}>
                {formatDueDate(task.dueDate)}
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
      <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-muted" />
    </div>
  );
}

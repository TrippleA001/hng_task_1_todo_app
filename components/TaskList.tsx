import { listForTask } from "@/lib/selectors";
import type { Task, Workspace } from "@/lib/types";

import { AddRow } from "./AddRow";
import { CountBadge } from "./CountBadge";
import { TaskRow } from "./TaskRow";

/**
 * The middle column: a bold view title with its count, the add row, then the
 * tasks themselves.
 */
export function TaskList({
  title,
  tasks,
  workspace,
  className,
}: {
  title: string;
  tasks: Task[];
  workspace: Workspace;
  className?: string;
}) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ""}`}>
      <header className="flex items-center gap-3.5 pb-6">
        <h1 className="text-[32px] leading-none font-bold text-ink">{title}</h1>
        <CountBadge
          value={tasks.length}
          active
          className="min-w-9 px-2 py-1 text-[19px] leading-6"
        />
      </header>

      <AddRow label="Add New Task" variant="field" />

      <div className="mt-3 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            list={listForTask(workspace, task)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Nothing here yet.
          </p>
        )}
      </div>
    </div>
  );
}


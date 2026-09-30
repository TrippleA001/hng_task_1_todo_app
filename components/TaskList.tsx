import { listForTask } from "@/lib/selectors";
import type { Task, Workspace } from "@/lib/types";

import { AddTaskRow } from "./AddTaskRow";
import { CountBadge } from "./CountBadge";
import { TaskRow } from "./TaskRow";

/**
 * The middle column: a bold view title with its count, the add row, then the
 * tasks themselves.
 *
 * Each row links itself into the detail panel (`?task=`), so `selectedTaskId`
 * only drives the highlight - selection is a URL, not component state.
 */
export function TaskList({
  title,
  tasks,
  workspace,
  view,
  query = "",
  selectedTaskId = null,
  emptyMessage,
  quickAddListId,
  quickAddDueDate,
  className,
}: {
  title: string;
  tasks: Task[];
  workspace: Workspace;
  /** The active view, carried into every row's link. */
  view: string;
  query?: string;
  selectedTaskId?: string | null;
  /** Overrides the default empty-state line, e.g. when a search matched nothing. */
  emptyMessage?: string;
  /** List a quick-added task joins. */
  quickAddListId?: string;
  /** Due date (ISO) a quick-added task gets - today, in the Today view. */
  quickAddDueDate?: string;
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

      <AddTaskRow listId={quickAddListId} dueDate={quickAddDueDate} />

      <div className="mt-3 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            list={listForTask(workspace, task)}
            view={view}
            query={query}
            selected={task.id === selectedTaskId}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {emptyMessage ?? "Nothing here yet."}
          </p>
        )}
      </div>
    </div>
  );
}


import type { Task, Workspace } from "@/lib/types";

import { TaskPanel } from "./TaskPanel";

/**
 * The right-hand column.
 *
 * A Server Component that only lays out headings - all interactivity lives in
 * TaskPanel and its children, so the shell itself ships no client JS.
 */
export function TaskDetailPanel({
  task,
  workspace,
}: {
  task: Task;
  workspace: Workspace;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <h2 className="pb-3 text-[17px] font-bold text-ink">Task:</h2>
      <TaskPanel
        key={task.id}
        task={task}
        lists={workspace.lists}
        tags={workspace.tags}
      />
    </div>
  );
}

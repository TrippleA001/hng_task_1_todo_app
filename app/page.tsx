import { AppShell } from "@/components/AppShell";
import { Sidebar } from "@/components/Sidebar";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { TaskList } from "@/components/TaskList";
import { getActiveView, getWorkspace } from "@/lib/data";
import { toIsoDate, today } from "@/lib/format";
import { tasksForView, viewTitle } from "@/lib/selectors";

/**
 * The three-pane app shell.
 *
 * Data arrives through lib/data and every mutation goes through the Server
 * Actions in lib/actions; no component talks to Supabase directly.
 */
export default async function Home() {
  const workspace = await getWorkspace();
  const activeView = await getActiveView();

  const tasks = tasksForView(workspace, activeView);
  // Nothing is selectable yet, so open the first task in the view. Phase 6 turns
  // the selection into a URL parameter.
  const selectedTask = tasks[0] ?? null;

  // Quick-add defaults: inside a list, a new task joins that list; in Today it is
  // due today.
  const quickAddListId = activeView.startsWith("list:")
    ? activeView.slice("list:".length)
    : workspace.lists[0]?.id;
  const quickAddDueDate =
    activeView === "today" ? toIsoDate(today()) : undefined;

  return (
    <AppShell
      sidebar={<Sidebar workspace={workspace} activeView={activeView} />}
      main={
        <TaskList
          title={viewTitle(workspace, activeView)}
          tasks={tasks}
          workspace={workspace}
          quickAddListId={quickAddListId}
          quickAddDueDate={quickAddDueDate}
        />
      }
      detail={
        selectedTask ? (
          <TaskDetailPanel task={selectedTask} workspace={workspace} />
        ) : (
          <p className="text-sm text-muted">
            Select a task to see its details.
          </p>
        )
      }
    />
  );
}

import { AppShell } from "@/components/AppShell";
import { Sidebar } from "@/components/Sidebar";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { TaskList } from "@/components/TaskList";
import { getActiveView, getWorkspace } from "@/lib/data";
import { tasksForView, viewTitle } from "@/lib/selectors";

/**
 * The three-pane app shell.
 *
 * All data arrives through lib/data, so swapping the demo workspace for
 * Supabase in Phase 3 does not touch this file.
 */
export default async function Home() {
  const workspace = await getWorkspace();
  const activeView = await getActiveView();

  const tasks = tasksForView(workspace, activeView);
  // Nothing is selectable yet, so open the first task in the view. Phase 6 turns
  // the selection into a URL parameter.
  const selectedTask = tasks[0] ?? null;

  return (
    <AppShell
      sidebar={<Sidebar workspace={workspace} activeView={activeView} />}
      main={
        <TaskList
          title={viewTitle(workspace, activeView)}
          tasks={tasks}
          workspace={workspace}
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

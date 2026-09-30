import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar } from "@/components/Sidebar";
import { StickyWall } from "@/components/StickyWall";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { TaskList } from "@/components/TaskList";
import { requireUser } from "@/lib/auth";
import { getWorkspace, isOnboarded } from "@/lib/data";
import { toIsoDate, today } from "@/lib/format";
import { filterByTitle, tasksForView, viewTitle } from "@/lib/selectors";
import { normalizeView, readParam, viewHref } from "@/lib/views";

/**
 * The three-pane app shell.
 *
 * The view is entirely URL-driven: `?view=` picks the list, `?task=` opens the
 * detail panel, and `?q=` filters by title - so every screen is shareable,
 * reloadable, and the back button behaves. Data arrives through lib/data and
 * every mutation goes through the Server Actions in lib/actions; no component
 * talks to Supabase directly.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [workspace, onboarded, user] = await Promise.all([
    getWorkspace(),
    isOnboarded(),
    requireUser(),
  ]);

  const activeView = normalizeView(readParam(params.view), workspace);
  const query = readParam(params.q)?.trim() ?? "";
  const isSettings = activeView === "settings";
  const isCalendar = activeView === "calendar";
  const isSticky = activeView === "sticky";
  const month = readParam(params.month);

  // View first (so the heading count matches what is listed), then search.
  // Settings is not a task list - it swaps the middle pane entirely.
  const tasks = isSettings
    ? []
    : filterByTitle(tasksForView(workspace, activeView), query);

  // ?task= wins so a deep link opens the task you expect; the id has to be in
  // the visible list, otherwise the panel would show something the list does
  // not. Falls back to the first visible task so the panel arrives populated.
  // `requestedTask` also drives the mobile layout: only an explicit ?task= makes
  // the detail pane take the full screen below `xl`.
  const requestedTaskId = readParam(params.task);
  const requestedTask = requestedTaskId
    ? tasks.find((task) => task.id === requestedTaskId)
    : undefined;
  const selectedTask = requestedTask ?? tasks[0] ?? null;

  // Quick-add defaults: inside a list, a new task joins that list; in Today it
  // is due today.
  const quickAddListId = activeView.startsWith("list:")
    ? activeView.slice("list:".length)
    : workspace.lists[0]?.id;
  const quickAddDueDate =
    activeView === "today" ? toIsoDate(today()) : undefined;

  return (
    <AppShell
      sidebar={
        <Sidebar workspace={workspace} activeView={activeView} query={query} />
      }
      main={
        isSettings ? (
          <SettingsPanel
            email={user.email ?? "Signed in"}
            listCount={workspace.lists.length}
            taskCount={workspace.tasks.length}
          />
        ) : isCalendar ? (
          <CalendarView tasks={tasks} month={month} query={query} />
        ) : isSticky ? (
          <StickyWall
            tasks={tasks}
            selectedTaskId={selectedTask?.id ?? null}
            query={query}
          />
        ) : (
          <TaskList
            title={viewTitle(workspace, activeView)}
            tasks={tasks}
            workspace={workspace}
            view={activeView}
            query={query}
            selectedTaskId={selectedTask?.id ?? null}
            emptyMessage={query ? `No tasks match "${query}".` : undefined}
            quickAddListId={quickAddListId}
            quickAddDueDate={quickAddDueDate}
          />
        )
      }
      detail={
        selectedTask ? (
          <TaskDetailPanel task={selectedTask} workspace={workspace} />
        ) : (
          <p className="text-sm text-muted">Select a task to see its details.</p>
        )
      }
      detailOpen={requestedTask !== undefined}
      detailBackHref={viewHref(activeView, query)}
      overlay={onboarded ? undefined : <OnboardingWalkthrough />}
    />
  );
}

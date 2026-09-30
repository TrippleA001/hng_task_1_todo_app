import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { Pagination } from "@/components/Pagination";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Sidebar } from "@/components/Sidebar";
import { StickyWall } from "@/components/StickyWall";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { TaskList } from "@/components/TaskList";
import { requireUser } from "@/lib/auth";
import { getWorkspace, isOnboarded } from "@/lib/data";
import { toIsoDate, today } from "@/lib/format";
import { PAGE_SIZE, pageParam } from "@/lib/pagination";
import { filterByTitle, tasksForView, viewTitle } from "@/lib/selectors";
import { normalizeView, readParam, viewHref } from "@/lib/views";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/**
 * The three-pane app shell.
 *
 * The view is entirely URL-driven: `?view=` picks the list, `?task=` opens the
 * detail panel, and `?q=` filters by title - so every screen is shareable,
 * reloadable, and the back button behaves. `?page=` windows the 20-row page
 * and `?month=` navigates the calendar. Data arrives through lib/data and
 * every mutation goes through the Server Actions in lib/actions; no component
 * talks to Supabase directly.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = readParam(params.q)?.trim() ?? "";
  const monthParam = readParam(params.month);
  const month =
    monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)
      ? monthParam
      : undefined;
  const page = pageParam(params.page);
  const requestedTaskId = readParam(params.task);

  // Normalizing needs the list ids, so fetch once with the raw view and
  // re-fetch with the normalized view only when they differ.
  const rawView = readParam(params.view);
  const [firstWorkspace, onboarded, user] = await Promise.all([
    getWorkspace({ view: rawView ?? "today", page, query }, requestedTaskId),
    isOnboarded(),
    requireUser(),
  ]);

  const activeView = normalizeView(rawView, firstWorkspace);
  const workspace =
    activeView === (rawView ?? "today")
      ? firstWorkspace
      : await getWorkspace({ view: activeView, page, query }, requestedTaskId);

  const isSettings = activeView === "settings";
  const isCalendar = activeView === "calendar";
  const isSticky = activeView === "sticky";

  // Calendar owns a month range instead of a page: the grid bounds come from
  // ?month=, and the whole month is fetched index-backed.
  let calendarTasks = workspace.tasks;
  if (isCalendar) {
    const reference = startOfMonth(
      month ? new Date(`${month}-01T00:00:00`) : today(),
    );
    const days = eachDayOfInterval({
      start: startOfWeek(reference, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(reference), { weekStartsOn: 1 }),
    });
    const range = {
      rangeStart: format(days[0], "yyyy-MM-dd"),
      rangeEnd: format(days[days.length - 1], "yyyy-MM-dd"),
    };
    calendarTasks = (
      await getWorkspace(
        { view: "calendar", page: 1, query, ...range },
        requestedTaskId,
      )
    ).tasks;
  }

  // View first (so the heading count matches what is listed), then search.
  // Settings is not a task list - it swaps the middle pane entirely. Search
  // already ran server-side via `ilike`; the selector is a safety net for the
  // off-page detail row.
  const tasks = isSettings
    ? []
    : filterByTitle(
        tasksForView(
          isCalendar ? { ...workspace, tasks: calendarTasks } : workspace,
          activeView,
        ),
        query,
      );

  // ?task= wins so a deep link opens the task you expect; the id has to be in
  // the visible list, otherwise the panel would show something the list does
  // not. Falls back to the first visible task so the panel arrives populated.
  // `requestedTask` also drives the mobile layout: only an explicit ?task= makes
  // the detail pane take the full screen below `xl`.
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

  const showPager = !isSettings && !isCalendar;
  const pager = showPager ? (
    <Pagination
      view={activeView}
      page={page}
      total={workspace.total}
      query={query}
    />
  ) : undefined;

  return (
    <AppShell
      sidebar={
        <Sidebar
          workspace={workspace}
          counts={workspace.counts}
          activeView={activeView}
          query={query}
        />
      }
      main={
        isSettings ? (
          <SettingsPanel
            email={user.email ?? "Signed in"}
            listCount={workspace.lists.length}
            taskCount={workspace.counts.tasks}
          />
        ) : isCalendar ? (
          <CalendarView tasks={tasks} month={month} query={query} />
        ) : isSticky ? (
          <StickyWall
            tasks={tasks}
            total={workspace.total}
            selectedTaskId={selectedTask?.id ?? null}
            query={query}
            pagination={pager}
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
            reorderable={activeView.startsWith("list:") && !query}
            pageOffset={(page - 1) * PAGE_SIZE}
            page={page}
            pagination={pager}
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

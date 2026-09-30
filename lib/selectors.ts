import { isDueTodayOrLater, isDueTodayOrOverdue } from "./format";
import type { List, Task, Workspace } from "./types";

/**
 * Derived reads over a workspace page.
 *
 * The workspace now arrives already scoped and paged from SQL (20 rows), so
 * these filters only narrow what is on screen - they never widen it. The
 * date windows mirror the query predicates in lib/db/workspace.ts (Today
 * `<= today`, Upcoming `>= today`); the SQL comments point back here, so keep
 * the two definitions in step.
 */

/**
 * Tasks belonging to a view. The SQL layer already scoped the page, so this
 * only narrows: it drops done rows from the date views the way the queries do
 * (Today `due <= today`, Upcoming `due >= today`), while list views keep done
 * tasks because that is where you go to see what you have finished.
 */
export function tasksForView(workspace: Workspace, view: string): Task[] {
  if (view === "today") {
    return workspace.tasks.filter(
      (task) => !task.done && isDueTodayOrOverdue(task.dueDate),
    );
  }

  if (view === "upcoming") {
    return workspace.tasks.filter(
      (task) => !task.done && isDueTodayOrLater(task.dueDate),
    );
  }

  if (view.startsWith("list:")) {
    const listId = view.slice("list:".length);
    return workspace.tasks.filter((task) => task.listId === listId);
  }

  return workspace.tasks;
}

/** Case-insensitive title search within the loaded page. The fetch already
 * applies `ilike` server-side, so this is a no-op safety net for rows that
 * arrived through the off-page detail fetch. */
export function filterByTitle(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tasks;
  return tasks.filter((task) => task.title.toLowerCase().includes(needle));
}

/** Human-readable heading for a view key: "Today", "Upcoming", or a list name. */
export function viewTitle(workspace: Workspace, view: string): string {
  if (view === "today") return "Today";
  if (view === "upcoming") return "Upcoming";
  if (view === "calendar") return "Calendar";
  if (view === "sticky") return "Sticky Wall";
  if (view === "settings") return "Settings";

  if (view.startsWith("list:")) {
    const listId = view.slice("list:".length);
    return workspace.lists.find((list) => list.id === listId)?.name ?? "List";
  }

  return "Tasks";
}


/** The list a task belongs to, for the swatch-and-name chip. */
export function listForTask(workspace: Workspace, task: Task): List | undefined {
  return workspace.lists.find((list) => list.id === task.listId);
}

/**
 * Subtask count for the chip on a task row. This is the *total* number of
 * subtasks, matching the mood board ("1 Subtasks" for a single subtask).
 */
export function subtaskTotal(task: Task): number {
  return task.subtasks.length;
}

/**
 * Count of tasks in a given list view.
 */
export function countForList(listId: string, workspace: Workspace): number {
  return workspace.tasks.filter((task) => task.listId === listId).length;
}

/**
 * Count of tasks in the current view (today/upcoming).
 */
export function countForView(view: string, workspace: Workspace): number {
  if (view === "today")
    return workspace.tasks.filter(
      (task) => !task.done && isDueTodayOrOverdue(task.dueDate),
    ).length;
  if (view === "upcoming")
    return workspace.tasks.filter(
      (task) => !task.done && isDueTodayOrLater(task.dueDate),
    ).length;
  return workspace.tasks.length;
}

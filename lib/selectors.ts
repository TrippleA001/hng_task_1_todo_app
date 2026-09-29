import { isDueTodayOrLater, isDueTodayOrOverdue } from "./format";
import type { List, Task, Workspace } from "./types";

/**
 * Derived reads over a workspace. Keeping these as pure functions means the
 * sidebar counts, the main list and the detail panel can never disagree -
 * they all read from the same task array.
 */

/**
 * Tasks belonging to a view: "today" | "upcoming" | "list:<id>".
 *
 * Today shows everything due today *or earlier* and Upcoming shows today
 * onwards, so overdue tasks appear in Today only and never in both. A named
 * list shows everything in it, done included, because that is where you go to
 * see what you have finished.
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

/** Case-insensitive title search. An empty query returns everything. */
export function filterByTitle(tasks: Task[], query: string): Task[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tasks;
  return tasks.filter((task) => task.title.toLowerCase().includes(needle));
}

/** Count shown next to a view name in the sidebar. */
export function countForView(workspace: Workspace, view: string): number {
  return tasksForView(workspace, view).length;
}

/** Count shown next to a list name in the sidebar. */
export function countForList(workspace: Workspace, listId: string): number {
  return workspace.tasks.filter((task) => task.listId === listId && !task.done)
    .length;
}

/** Human-readable heading for a view key: "Today", "Upcoming", or a list name. */
export function viewTitle(workspace: Workspace, view: string): string {
  if (view === "today") return "Today";
  if (view === "upcoming") return "Upcoming";
  if (view === "calendar") return "Calendar";
  if (view === "sticky") return "Sticky Wall";

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

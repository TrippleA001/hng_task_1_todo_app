import { isDueToday, isDueTodayOrLater } from "./format";
import type { List, Task, Workspace } from "./types";

/**
 * Derived reads over a workspace. Keeping these as pure functions means the
 * sidebar counts, the main list and the detail panel can never disagree -
 * they all read from the same task array.
 */

/** Tasks belonging to a view: "today" | "upcoming" | "list:<id>". */
export function tasksForView(workspace: Workspace, view: string): Task[] {
  return tasksForViewExcluding(workspace, view, []);
}

/**
 * Same as `tasksForView`, but hides optional task ids - used to skip the task
 * that is currently open in the detail panel.
 */
export function tasksForViewExcluding(
  workspace: Workspace,
  view: string,
  excludeIds: string[],
): Task[] {
  const base = workspace.tasks.filter((task) => !excludeIds.includes(task.id));

  if (view === "today") {
    return base.filter((task) => !task.done && isDueToday(task.dueDate));
  }

  if (view === "upcoming") {
    return base.filter((task) => !task.done && isDueTodayOrLater(task.dueDate));
  }

  if (view.startsWith("list:")) {
    const listId = view.slice("list:".length);
    return base.filter((task) => task.listId === listId);
  }

  return base;
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

/** Progress for the checkbox/checked state of a parent task. */
export function subtaskProgress(task: Task): { done: number; total: number } {
  return {
    done: task.subtasks.filter((subtask) => subtask.done).length,
    total: task.subtasks.length,
  };
}

import type { Workspace } from "./types";

/** Views that are not tied to a particular list. */
const FIXED_VIEWS = [
  "today",
  "upcoming",
  "calendar",
  "sticky",
  "settings",
] as const;

/**
 * Turns whatever was in the URL into a view the app can render.
 *
 * Unknown or stale values (a deleted list id, a hand-edited link) fall back to
 * "today" rather than rendering a broken empty shell.
 */
export function normalizeView(
  raw: string | undefined,
  workspace: Workspace,
): string {
  if (!raw) return "today";

  if (raw.startsWith("list:")) {
    const listId = raw.slice("list:".length);
    return workspace.lists.some((list) => list.id === listId) ? raw : "today";
  }

  return (FIXED_VIEWS as readonly string[]).includes(raw) ? raw : "today";
}

/** URL for a view, carrying the current search term across. */
export function viewHref(view: string, query = ""): string {
  const params = new URLSearchParams({ view });
  if (query) params.set("q", query);
  return `/?${params.toString()}`;
}

/** URL for a view with one task open in the detail panel. */
export function taskHref(view: string, taskId: string, query = ""): string {
  const params = new URLSearchParams({ view, task: taskId });
  if (query) params.set("q", query);
  return `/?${params.toString()}`;
}

/** The view a URL param should be read as, ignoring arrays and blanks. */
export function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

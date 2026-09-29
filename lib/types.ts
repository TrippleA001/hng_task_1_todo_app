/**
 * Domain types for the task manager.
 *
 * These mirror the Supabase schema in supabase/migrations - keep the two in
 * step. Field names are camelCase here and snake_case in Postgres; the mapping
 * lives in lib/db.
 */

/** Colour of a list swatch. Matches the --color-swatch-* design tokens. */
export type SwatchColor = "red" | "blue" | "yellow";

/** The four views in the sidebar. */
export type ViewKey = "upcoming" | "today" | "calendar" | "sticky";

export interface List {
  id: string;
  name: string;
  color: SwatchColor;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  done: boolean;
  listId: string;
  /** ISO date (yyyy-MM-dd), or null when the task has no due date. */
  dueDate: string | null;
  tagIds: string[];
  subtasks: Subtask[];
  doneSubtasks?: number;
}

/** Everything the shell needs to render: sidebar counts plus the task list. */
export interface Workspace {
  lists: List[];
  tags: Tag[];
  tasks: Task[];
}

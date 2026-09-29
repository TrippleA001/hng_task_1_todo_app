import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import type { List, Subtask, SwatchColor, Tag, Task, Workspace } from "../types";

type Client = SupabaseClient<Database>;

const SWATCHES: SwatchColor[] = ["red", "blue", "yellow"];

/** Postgres stores the colour as text; narrow it to the union the UI expects. */
function toSwatchColor(color: string): SwatchColor {
  return SWATCHES.includes(color as SwatchColor)
    ? (color as SwatchColor)
    : "blue";
}

/**
 * Reads the signed-in user's whole workspace.
 *
 * Deliberately five flat queries rather than one nested `select`: the volumes
 * here are tiny, it keeps the generated types honest, and RLS scopes every one
 * of them to the caller - so there is no query shape that can read someone
 * else's rows.
 */
export async function fetchWorkspace(supabase: Client): Promise<Workspace> {
  const [listsResult, tagsResult, tasksResult, subtasksResult, taskTagsResult] =
    await Promise.all([
      supabase
        .from("lists")
        .select("id, name, color, position")
        .order("position")
        .order("name"),
      supabase.from("tags").select("id, name").order("name"),
      supabase
        .from("tasks")
        .select("id, title, description, done, list_id, due_date, position")
        .order("position")
        .order("created_at"),
      supabase
        .from("subtasks")
        .select("id, task_id, title, done, position")
        .order("position"),
      supabase.from("task_tags").select("task_id, tag_id"),
    ]);

  const failure = [
    listsResult,
    tagsResult,
    tasksResult,
    subtasksResult,
    taskTagsResult,
  ].find((result) => result.error);

  if (failure?.error) {
    throw new Error(`Could not load the workspace: ${failure.error.message}`);
  }

  const lists: List[] = (listsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: toSwatchColor(row.color),
  }));

  const tags: Tag[] = (tagsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  const subtasksByTask = new Map<string, Subtask[]>();
  for (const row of subtasksResult.data ?? []) {
    const bucket = subtasksByTask.get(row.task_id) ?? [];
    bucket.push({ id: row.id, title: row.title, done: row.done });
    subtasksByTask.set(row.task_id, bucket);
  }

  const tagIdsByTask = new Map<string, string[]>();
  for (const row of taskTagsResult.data ?? []) {
    const bucket = tagIdsByTask.get(row.task_id) ?? [];
    bucket.push(row.tag_id);
    tagIdsByTask.set(row.task_id, bucket);
  }

  const tasks: Task[] = (tasksResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    done: row.done,
    listId: row.list_id,
    dueDate: row.due_date,
    tagIds: tagIdsByTask.get(row.id) ?? [],
    subtasks: subtasksByTask.get(row.id) ?? [],
  }));

  return { lists, tags, tasks };
}

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";

type Client = SupabaseClient<Database>;

/**
 * Deletes every demo row 0003 created for this user (`is_seeded`), leaving
 * anything the user wrote untouched.
 *
 * Deletion order matters: seeded tasks go first (their subtasks and tag links
 * cascade), then seeded tags, then a seeded list only when no task still points
 * at it - tasks.list_id is NOT NULL with ON DELETE CASCADE, so deleting a list
 * that holds a task would take that task with it.
 *
 * Returns the error message instead of throwing, so both callers (the
 * walkthrough and Settings) can surface it inline.
 */
export async function deleteSeededWorkspace(
  client: Client,
): Promise<string | null> {
  const { error: tasksError } = await client
    .from("tasks")
    .delete()
    .eq("is_seeded", true);
  if (tasksError) return tasksError.message;

  const { error: tagsError } = await client
    .from("tags")
    .delete()
    .eq("is_seeded", true);
  if (tagsError) return tagsError.message;

  const [seedListsResult, busyListsResult] = await Promise.all([
    client.from("lists").select("id").eq("is_seeded", true),
    client.from("tasks").select("list_id"),
  ]);
  if (seedListsResult.error) return seedListsResult.error.message;
  if (busyListsResult.error) return busyListsResult.error.message;

  const busy = new Set(
    (busyListsResult.data ?? []).map((row) => row.list_id),
  );
  const removable = (seedListsResult.data ?? [])
    .map((row) => row.id)
    .filter((id) => !busy.has(id));

  if (removable.length > 0) {
    const { error } = await client.from("lists").delete().in("id", removable);
    if (error) return error.message;
  }

  return null;
}
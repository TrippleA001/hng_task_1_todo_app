"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, readBoolean, readString, type ActionResult } from "./result";

/**
 * Mutations for tasks.
 *
 * The form actions take `(previous, formData)` because that is the shape
 * `useActionState` calls; `previous` is unused since each result is fresh.
 *
 * Each toggle ships two wrappers around one shared implementation:
 * - the `void` form action (`<form action={...}>` only accepts
 *   `void | Promise<void>`), which keeps no-JS submit working;
 * - `toggleXxxWithResult`, which the hydrated checkbox calls directly so a
 *   failure can be shown as a toast instead of silently reverting.
 *
 * Each one re-checks the session with requireUser() rather than trusting the
 * proxy, and every write is additionally scoped by RLS in Postgres. Updates and
 * deletes `.select("id")` afterwards so that zero affected rows is detectable -
 * a write that matched nothing (a stale id, or someone else's row) must surface
 * as an error instead of silently appearing to succeed.
 */

export async function createTask(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const title = readString(formData, "title");
  if (!title) return fail("Give the task a title.");

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  // Fall back to the first list: tasks.list_id is NOT NULL, so every task needs
  // somewhere to live even when the current view has no list context.
  let listId = readString(formData, "listId");
  if (!listId) {
    const { data: firstList } = await supabase
      .from("lists")
      .select("id")
      .order("position")
      .limit(1)
      .maybeSingle();

    if (!firstList) return fail("Create a list before adding a task.");
    listId = firstList.id;
  }

  const { data: lastTask } = await supabase
    .from("tasks")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const dueDate = readString(formData, "dueDate");

  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      list_id: listId,
      title,
      due_date: dueDate || null,
      position: (lastTask?.position ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);

  revalidatePath("/");
  return ok(created.id);
}

async function applyTaskDone(formData: FormData): Promise<ActionResult> {
  const taskId = readString(formData, "taskId");
  if (!taskId) return fail("Missing task.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  // completed_at is maintained by the tasks_sync_completion trigger, so this
  // only has to flip the boolean.
  const { data, error } = await supabase
    .from("tasks")
    .update({ done: readBoolean(formData, "done") })
    .eq("id", taskId)
    .select("id");

  if (error) return fail(error.message);
  if (!data?.length) return fail("That task no longer exists.");

  revalidatePath("/");
  return ok();
}

/**
 * Toggles a task's done flag. Void form action for the no-JS fallback; the
 * hydrated checkbox calls `toggleTaskDoneWithResult` instead.
 */
export async function setTaskDone(formData: FormData): Promise<void> {
  const result = await applyTaskDone(formData);
  if (result.error) {
    console.error("setTaskDone failed:", result.error);
  }
}

/**
 * Toggles a task's done flag and returns the result, so the client can toast
 * on failure. The optimistic tick reverts automatically when this resolves
 * with an error, because `useOptimistic` reconciles with the transition result.
 */
export async function toggleTaskDoneWithResult(
  formData: FormData,
): Promise<ActionResult> {
  return applyTaskDone(formData);
}

export async function updateTask(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readString(formData, "taskId");
  if (!taskId) return fail("Missing task.");

  const title = readString(formData, "title");
  if (!title) return fail("Give the task a title.");

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const listId = readString(formData, "listId");
  const dueDate = readString(formData, "dueDate");

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title,
      description: String(formData.get("description") ?? ""),
      due_date: dueDate || null,
      ...(listId ? { list_id: listId } : {}),
    })
    .eq("id", taskId)
    .select("id");

  if (error) return fail(error.message);
  if (!data?.length) return fail("That task no longer exists.");

  // Tag links are replaced wholesale: clearing then re-inserting the submitted
  // selection is simpler than diffing, and the table has no other columns to
  // preserve.
  const { error: clearError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId);

  if (clearError) return fail(clearError.message);

  const tagIds = formData.getAll("tagIds").map(String).filter(Boolean);

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase.from("task_tags").insert(
      tagIds.map((tagId) => ({
        task_id: taskId,
        tag_id: tagId,
        user_id: user.id,
      })),
    );

    if (tagError) return fail(tagError.message);
  }

  revalidatePath("/");
  return ok();
}

/**
 * Reorders tasks within one list to match an explicit id sequence.
 *
 * The caller passes the visible ids in their new order plus the page offset
 * (0 on the first page), and positions become `offset + index`. Only rows on
 * the current page move — dragging across page boundaries is not supported,
 * because a 20-row window cannot show where the task would land.
 */
export async function applyTaskOrder(
  orderedIds: string[],
  offset: number,
): Promise<ActionResult> {
  if (orderedIds.length === 0) return ok();
  if (!Number.isInteger(offset) || offset < 0) return fail("Bad page.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  // Ownership first: every id must belong to this user's workspace, otherwise
  // a crafted list could rewrite other users' positions through RLS gaps.
  const { data: owned, error: ownedError } = await supabase
    .from("tasks")
    .select("id, list_id")
    .in("id", orderedIds);

  if (ownedError) return fail(ownedError.message);
  if ((owned ?? []).length !== orderedIds.length) {
    return fail("Some tasks no longer exist.");
  }

  const listIds = new Set((owned ?? []).map((row) => row.list_id));
  if (listIds.size !== 1) {
    return fail("Tasks can only be reordered within one list.");
  }

  const updates = orderedIds.map((id, index) =>
    supabase.from("tasks").update({ position: offset + index }).eq("id", id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) return fail(failed.error.message);

  revalidatePath("/");
  return ok();
}

export async function deleteTask(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readString(formData, "taskId");
  if (!taskId) return fail("Missing task.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  // Subtasks and tag links go with it: both foreign keys are ON DELETE CASCADE.
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id");

  if (error) return fail(error.message);
  if (!data?.length) return fail("That task no longer exists.");

  revalidatePath("/");
  return ok();
}

"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, readBoolean, readString, type ActionResult } from "./result";

/**
 * Mutations for tasks.
 *
 * The form actions take `(previous, formData)` because that is the shape
 * `useActionState` calls; `previous` is unused since each result is fresh. The
 * toggle actions return void instead, because they are handed straight to
 * `<form action={...}>`, whose type only accepts `void | Promise<void>`.
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

  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);

  const dueDate = readString(formData, "dueDate");

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    list_id: listId,
    title,
    due_date: dueDate || null,
    position: count ?? 0,
  });

  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
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
 * Toggles a task's done flag.
 *
 * Returns void so it can be used directly as a form action. The user-visible
 * signal on failure is the checkbox not changing, so the reason is logged -
 * a toast/optimistic treatment is a polish-phase job.
 */
export async function setTaskDone(formData: FormData): Promise<void> {
  const result = await applyTaskDone(formData);
  if (result.error) {
    console.error("setTaskDone failed:", result.error);
  }
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

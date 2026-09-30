"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, readBoolean, readString, type ActionResult } from "./result";

/**
 * Mutations for subtasks.
 *
 * `createSubtask` takes `(previous, formData)` for `useActionState`.
 *
 * `setSubtaskDone` (void) is the no-JS form action;
 * `toggleSubtaskDoneWithResult` is what the hydrated checkbox calls so a
 * failure can be toasted instead of silently reverting.
 *
 * Both re-check the session and rely on RLS for ownership. `createSubtask`
 * additionally verifies the parent task is readable by this user: the subtasks
 * policy only checks the subtask's own user_id, so without that check a
 * mismatched task_id could attach a subtask to a task belonging to someone else.
 */

export async function createSubtask(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const taskId = readString(formData, "taskId");
  const title = readString(formData, "title");

  if (!taskId) return fail("Missing task.");
  if (!title) return fail("Give the subtask a title.");

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data: parent } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .maybeSingle();

  if (!parent) return fail("That task no longer exists.");

  const { count } = await supabase
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { error } = await supabase.from("subtasks").insert({
    user_id: user.id,
    task_id: taskId,
    title,
    position: count ?? 0,
  });

  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}

async function applySubtaskDone(formData: FormData): Promise<ActionResult> {
  const subtaskId = readString(formData, "subtaskId");
  if (!subtaskId) return fail("Missing subtask.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("subtasks")
    .update({ done: readBoolean(formData, "done") })
    .eq("id", subtaskId)
    .select("id");

  if (error) return fail(error.message);
  if (!data?.length) return fail("That subtask no longer exists.");

  revalidatePath("/");
  return ok();
}

/** Void form action for the no-JS fallback. */
export async function setSubtaskDone(formData: FormData): Promise<void> {
  const result = await applySubtaskDone(formData);
  if (result.error) {
    console.error("setSubtaskDone failed:", result.error);
  }
}

/** Returns the toggle result so the client can toast on failure. */
export async function toggleSubtaskDoneWithResult(
  formData: FormData,
): Promise<ActionResult> {
  return applySubtaskDone(formData);
}

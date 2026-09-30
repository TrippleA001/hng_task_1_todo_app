"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, type ActionResult } from "./result";

/**
 * Finishes the first-run walkthrough, optionally wiping the demo workspace.
 *
 * The demo rows are exactly the ones 0003 created (`is_seeded`), so anything
 * the user wrote survives the wipe. Deletion order matters: seeded tasks go
 * first (their subtasks and tag links cascade), then seeded tags, then a seeded
 * list only when no task still points at it - tasks.list_id is NOT NULL with
 * ON DELETE CASCADE, so deleting a list that holds a task would take that task
 * with it.
 *
 * Writes run as the signed-in user, so RLS independently restricts every delete
 * to this user's rows on top of the filters here.
 */
export async function completeOnboarding(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const clearDemo = formData.get("clearDemo") === "true";

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  if (clearDemo) {
    const { error: tasksError } = await supabase
      .from("tasks")
      .delete()
      .eq("is_seeded", true);
    if (tasksError) return fail(tasksError.message);

    const { error: tagsError } = await supabase
      .from("tags")
      .delete()
      .eq("is_seeded", true);
    if (tagsError) return fail(tagsError.message);

    const [seedListsResult, busyListsResult] = await Promise.all([
      supabase.from("lists").select("id").eq("is_seeded", true),
      supabase.from("tasks").select("list_id"),
    ]);
    if (seedListsResult.error) return fail(seedListsResult.error.message);
    if (busyListsResult.error) return fail(busyListsResult.error.message);

    const busy = new Set(
      (busyListsResult.data ?? []).map((row) => row.list_id),
    );
    const removable = (seedListsResult.data ?? [])
      .map((row) => row.id)
      .filter((id) => !busy.has(id));

    if (removable.length > 0) {
      const { error: listsError } = await supabase
        .from("lists")
        .delete()
        .in("id", removable);
      if (listsError) return fail(listsError.message);
    }
  }

  const { error: settingsError } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      onboarded_at: new Date().toISOString(),
    });
  if (settingsError) return fail(settingsError.message);

  revalidatePath("/");
  return ok();
}
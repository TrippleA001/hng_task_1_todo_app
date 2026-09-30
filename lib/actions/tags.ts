"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, readString, type ActionResult } from "./result";

/**
 * Creates a tag from the sidebar's "Add Tag" control.
 *
 * Duplicate names surface as the database's unique violation, which RLS has
 * already scoped to this user - so the error only ever fires for a real clash.
 */
export async function createTag(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const name = readString(formData, "name");
  if (!name) return fail("Give the tag a name.");

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("tags").insert({ user_id: user.id, name });
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}

/**
 * Renames a tag from the sidebar's inline editor - same direct-argument shape
 * as renameList, for the same reason (see that function's comment).
 *
 * A name that clashes with another of this user's tags surfaces as the
 * database's unique violation, scoped to them by RLS.
 */
export async function renameTag(id: string, name: string): Promise<ActionResult> {
  if (!id) return fail("That tag no longer exists.");
  const trimmed = name.trim();
  if (!trimmed) return fail("Give the tag a name.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("tags").update({ name: trimmed }).eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}

/**
 * Deletes a tag. task_tags cascades (0001), so the tag disappears from every
 * task that carried it while the tasks themselves are untouched.
 */
export async function deleteTag(id: string): Promise<ActionResult> {
  if (!id) return fail("That tag no longer exists.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}
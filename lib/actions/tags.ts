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
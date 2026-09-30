"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, readString, type ActionResult } from "./result";

/**
 * Creates a list from the sidebar's "Add New List" row.
 *
 * Position appends to the end so the sidebar order matches creation order, and
 * the colour is normalised to the three the swatch CSS (and the database check
 * constraint) support before the insert.
 */
export async function createList(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const name = readString(formData, "name");
  if (!name) return fail("Give the list a name.");

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const requestedColor = readString(formData, "color");
  const color =
    requestedColor === "red" || requestedColor === "yellow"
      ? requestedColor
      : "blue";

  const { count } = await supabase
    .from("lists")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("lists").insert({
    user_id: user.id,
    name,
    color,
    position: count ?? 0,
  });

  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}

/**
 * Renames a list from the sidebar's inline editor.
 *
 * Takes plain arguments rather than a `(state, formData)` pair: the row calls
 * it inside a transition and closes the editor in the callback - an effect
 * that called setState there is exactly what the lint config forbids.
 */
export async function renameList(id: string, name: string): Promise<ActionResult> {
  if (!id) return fail("That list no longer exists.");
  const trimmed = name.trim();
  if (!trimmed) return fail("Give the list a name.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("lists")
    .update({ name: trimmed })
    .eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}

/**
 * Deletes a list. tasks.list_id is ON DELETE CASCADE (0001), so this also
 * removes every task in the list - the row asks for confirmation first, and
 * RLS scopes the delete to this user's own lists.
 */
export async function deleteList(id: string): Promise<ActionResult> {
  if (!id) return fail("That list no longer exists.");

  await requireUser();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}
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
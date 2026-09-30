"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { deleteSeededWorkspace } from "../db/demo";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, type ActionResult } from "./result";

/**
 * Clears the demo workspace from Settings - the same wipe the walkthrough
 * offers, available later for anyone who chose "Keep the demo tasks" and
 * changed their mind. Only rows flagged `is_seeded` are touched.
 *
 * Takes no arguments: nothing in the form feeds the action, and a
 * zero-parameter function still satisfies useActionState's
 * `(state, formData) => state` signature.
 */
export async function clearDemoData(): Promise<ActionResult> {
  await requireUser();
  const supabase = await createServerSupabaseClient();

  const error = await deleteSeededWorkspace(supabase);
  if (error) return fail(error);

  revalidatePath("/");
  return ok();
}

/**
 * Re-runs 0003's seeder for this account, bringing the demo workspace back.
 *
 * The count guard stops a double restore from inserting a second copy of the
 * demo data; the seeder itself is additionally hardened to only accept the
 * signed-in account (see migration 0004). Like `clearDemoData`, it takes no
 * arguments - see the note there.
 */
export async function restoreDemoData(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from("lists")
    .select("id", { count: "exact", head: true })
    .eq("is_seeded", true);
  if (count) return fail("The demo workspace is already in your lists.");

  const { error } = await supabase.rpc("seed_demo_workspace_for_user", {
    target_user: user.id,
  });
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}
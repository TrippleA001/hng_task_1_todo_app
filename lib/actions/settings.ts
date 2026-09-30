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
 * The guard counts demo *tasks*, not lists: a clear deliberately keeps seeded
 * lists that hold the user's own tasks (see lib/db/demo.ts), so the previous
 * lists-based guard refused a restore that was exactly what the user asked for.
 * Migration 0005's seeder stamps is_seeded on what it inserts, which makes a
 * double restore harmless (the guard catches it) and lets a later clear work
 * again. Like `clearDemoData`, it takes no arguments - see the note there.
 */
export async function restoreDemoData(): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { count, error: countError } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("is_seeded", true);
  if (countError) return fail(countError.message);
  if (count) return fail("The demo tasks are already in your workspace.");

  const { error } = await supabase.rpc("seed_demo_workspace_for_user", {
    target_user: user.id,
  });
  if (error) return fail(error.message);

  revalidatePath("/");
  return ok();
}
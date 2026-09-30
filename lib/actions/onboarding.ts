"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "../auth";
import { deleteSeededWorkspace } from "../db/demo";
import { createServerSupabaseClient } from "../supabase/server";
import { fail, ok, type ActionResult } from "./result";

/**
 * Finishes the first-run walkthrough, optionally wiping the demo workspace.
 *
 * The wipe itself lives in lib/db/demo.ts so Settings can offer the same
 * cleanup; either way only rows flagged `is_seeded` are touched, and writes run
 * as the signed-in user so RLS restricts every delete to this user's rows.
 */
export async function completeOnboarding(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const clearDemo = formData.get("clearDemo") === "true";

  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  if (clearDemo) {
    // The deletion order and its cascade reasoning live with the helper.
    const wipeError = await deleteSeededWorkspace(supabase);
    if (wipeError) return fail(wipeError);
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
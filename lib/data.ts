import { requireUser } from "./auth";
import { fetchWorkspace } from "./db/workspace";
import { createServerSupabaseClient } from "./supabase/server";
import type { Workspace } from "./types";

/**
 * Single seam between the UI and its data.
 *
 * Components never talk to Supabase directly - they receive a Workspace, and
 * the pure selectors in lib/selectors.ts derive every count from it.
 */

export async function getWorkspace(): Promise<Workspace> {
  // The real auth gate. proxy.ts redirects for a nicer experience, but a request
  // can reach a page without it, so the session is checked again here.
  await requireUser();

  const supabase = await createServerSupabaseClient();
  return fetchWorkspace(supabase);
}

/**
 * Whether the first-run walkthrough has been completed.
 *
 * A missing settings row counts as "not yet": the row is only written when the
 * walkthrough finishes, so a brand-new account never has to create one just to
 * be shown the tour. If the table itself is missing the error names the
 * migration to run rather than failing silently in a way that looks like a
 * completed walkthrough.
 */
export async function isOnboarded(): Promise<boolean> {
  await requireUser();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("onboarded_at")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not read onboarding state: ${error.message}. ` +
        "Did supabase/migrations/0004_onboarding.sql run?",
    );
  }

  return Boolean(data?.onboarded_at);
}


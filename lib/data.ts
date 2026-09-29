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
 * The view the shell opens on.
 *
 * Interim: always "today". Phase 6 makes the active view a URL parameter so it
 * survives a reload and can be linked to.
 */
export async function getActiveView(): Promise<string> {
  return "today";
}


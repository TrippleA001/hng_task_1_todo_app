import { demoWorkspace, demoTaskId, demoView } from "./mock-data";
import type { Workspace } from "./types";

/**
 * Single seam between the UI and its data.
 *
 * Today this returns demo data. Phase 3 replaces the body with Supabase
 * queries and nothing that calls it has to change - which is why the UI never
 * imports from lib/mock-data directly.
 */

export async function getWorkspace(): Promise<Workspace> {
  return demoWorkspace;
}

/** The view the app opens on. */
export async function getActiveView(): Promise<string> {
  return demoView;
}

/** The task open in the detail panel, or null when nothing is selected. */
export async function getSelectedTaskId(): Promise<string | null> {
  return demoTaskId;
}

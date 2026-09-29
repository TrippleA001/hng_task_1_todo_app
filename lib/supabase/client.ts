import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "../database.types";
import { supabaseEnv } from "../env";

/**
 * Supabase client for Client Components.
 *
 * Uses the publishable key, which is public by design - RLS is what stops one
 * user reading another's rows. Never put the secret/service_role key here.
 */
export function createBrowserSupabaseClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient<Database>(url, key);
}

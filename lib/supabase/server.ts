import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "../database.types";
import { supabaseEnv } from "../env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Create a new one per request - never share a client between requests, since
 * it carries the caller's session.
 *
 * `cookies` must implement `getAll` and `setAll`; @supabase/ssr's own types warn
 * that the older `get`/`set`/`remove` trio causes "random logouts" and JSON
 * parsing errors because it misses edge cases.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components are not allowed to set cookies. That is fine:
          // proxy.ts refreshes the session and writes the new cookies onto the
          // response instead.
        }
      },
    },
  });
}

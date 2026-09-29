import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createServerSupabaseClient } from "./supabase/server";

/**
 * The real authentication gate.
 *
 * proxy.ts redirects unauthenticated requests for a better experience, but it is
 * not trusted for security: Next.js middleware has been bypassed in the wild
 * (CVE-2025-29927). Every server-side data read calls this first, and RLS
 * independently scopes the rows to this user in the database.
 *
 * `cache` dedupes the call within a single request, so a page and several
 * components can all call it without extra round trips.
 */
export const requireUser = cache(async (): Promise<User> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "../database.types";
import { supabaseEnv } from "../env";

/** Reachable without a session. */
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Refreshes the Supabase session cookie and does the coarse redirects.
 *
 * This runs from proxy.ts (Next 16's rename of middleware.ts) on every matched
 * request. Two things matter:
 *
 * 1. `auth.getUser()` must be the first call after the client is created, and
 *    nothing may run between them - it is what triggers the token refresh, and
 *    `setAll` below is what writes the refreshed cookies back.
 * 2. This is a UX redirect, NOT the security boundary. Middleware-based auth
 *    has been bypassed before (CVE-2025-29927), so server-side reads
 *    independently verify the session in lib/auth.ts, and RLS scopes rows in
 *    the database no matter what reaches the app.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/login";
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
  }

  if (user && pathname === "/login") {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/";
    redirectTo.search = "";
    return NextResponse.redirect(redirectTo);
  }

  return response;
}

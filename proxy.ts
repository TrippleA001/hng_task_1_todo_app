import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next 16 renamed middleware.ts to proxy.ts and renamed the export accordingly.
 *
 * - The file must be `proxy.ts` at the project root (Next matches `(?:src/)?proxy`).
 * - The exported function must be named `proxy`. A `middleware` export here
 *   would be ignored, which silently disables session refresh.
 * - NextRequest, NextResponse and `config.matcher` are unchanged, but this now
 *   runs on the Node.js runtime rather than Edge.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals, the favicon and static images.
     * Excluding them avoids refreshing the session on asset requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

/**
 * The two public Supabase values from .env.local.
 *
 * Fail with a specific message rather than letting an undefined URL surface as
 * a confusing "Invalid URL" deep inside the Supabase client.
 */
export function supabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Add both to .env.local - see README.md.",
    );
  }

  return { url, key };
}

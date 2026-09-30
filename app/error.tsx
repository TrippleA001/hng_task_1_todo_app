"use client";

/**
 * Root error boundary for the app shell.
 *
 * The message is shown on purpose (including in production): the realistic
 * failures here are configuration ones - a Supabase env var missing on the
 * server, or a migration not yet run - and both messages tell the developer
 * exactly what to fix. `reset()` re-runs the failed render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[440px] rounded-[20px] border border-line bg-card p-8 text-center shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)]">
        <h1 className="text-[22px] font-bold text-ink">Something went wrong</h1>
        <p className="mt-3 text-[15px] leading-6 break-words text-ink-soft">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-2 text-[12px] text-muted">Error ref: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-[10px] bg-accent px-5 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:bg-accent-strong"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
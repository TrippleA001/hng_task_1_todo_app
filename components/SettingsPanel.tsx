"use client";

import { Mail, RotateCcw, Trash2 } from "lucide-react";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/actions/result";
import { clearDemoData, restoreDemoData } from "@/lib/actions/settings";
import { signOut } from "@/lib/auth-actions";

const initialState: ActionResult = { error: null };

/**
 * The Settings view: account identity, sign out, and the demo-workspace
 * controls that mirror what the walkthrough offers on first run.
 *
 * Counts come in as plain numbers so this stays a leaf client component; both
 * actions revalidate the route, so the numbers refresh with everything else.
 */
export function SettingsPanel({
  email,
  listCount,
  taskCount,
}: {
  email: string;
  listCount: number;
  taskCount: number;
}) {
  const [clearState, clearAction, clearPending] = useActionState(
    clearDemoData,
    initialState,
  );
  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreDemoData,
    initialState,
  );

  // One message area: an error wins, otherwise the most recent success.
  const error = clearState.error ?? restoreState.error;
  const latestSuccess = Math.max(clearState.at ?? 0, restoreState.at ?? 0);
  const success =
    latestSuccess === 0
      ? null
      : (restoreState.at ?? 0) === latestSuccess &&
          (clearState.at ?? 0) !== latestSuccess
        ? "Demo workspace restored."
        : "Demo tasks cleared.";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="pb-6">
        <h1 className="text-[32px] leading-none font-bold text-ink">
          Settings
        </h1>
      </header>

      <section className="rounded-[14px] border border-line bg-card p-5">
        <h2 className="text-[15px] font-semibold text-ink">Account</h2>
        <p className="mt-3 flex items-center gap-2 text-[15px] text-ink-soft">
          <Mail aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="min-w-0 truncate">{email}</span>
        </p>
        <p className="mt-1.5 text-[13px] text-muted">
          {listCount} {listCount === 1 ? "list" : "lists"} · {taskCount}{" "}
          {taskCount === 1 ? "task" : "tasks"}
        </p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="rounded-[10px] border border-line-strong px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-black/[0.03]"
          >
            Sign out
          </button>
        </form>
      </section>

      <section className="mt-5 rounded-[14px] border border-line bg-card p-5">
        <h2 className="text-[15px] font-semibold text-ink">Demo workspace</h2>
        <p className="mt-2 max-w-[54ch] text-[14px] leading-6 text-muted">
          New accounts start with demo tasks so the app is never an empty
          shell. Clearing removes them - and only them - while restoring brings
          them back if you miss them. Your own tasks are never touched.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <form action={clearAction}>
            <button
              type="submit"
              disabled={clearPending}
              className="flex items-center gap-2 rounded-[10px] border border-line-strong px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-black/[0.03] disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-4" />
              {clearPending ? "Clearing…" : "Clear demo tasks"}
            </button>
          </form>
          <form action={restoreAction}>
            <button
              type="submit"
              disabled={restorePending}
              className="flex items-center gap-2 rounded-[10px] border border-line-strong px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-black/[0.03] disabled:opacity-60"
            >
              <RotateCcw aria-hidden className="size-4" />
              {restorePending ? "Restoring…" : "Restore demo tasks"}
            </button>
          </form>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-[13px] text-ink">
            {error}
          </p>
        )}
        {!error && success && (
          <p className="mt-3 text-[13px] text-muted">{success}</p>
        )}
      </section>
    </div>
  );
}
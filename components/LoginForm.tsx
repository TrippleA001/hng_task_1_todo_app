"use client";

import { useActionState, useState } from "react";

import { signIn, signUp, type AuthState } from "@/lib/auth-actions";
import { cn } from "@/lib/cn";

const initialState: AuthState = { error: null };

const fieldClasses =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-muted focus:outline-none";

type Mode = "signin" | "signup";

/**
 * Sign in / create account form.
 *
 * Two `useActionState` hooks (one per action) because the action passed to a
 * form cannot change identity without changing the hook it came from.
 */
export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");

  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState,
  );

  const isSignIn = mode === "signin";
  const state = isSignIn ? signInState : signUpState;
  const pending = isSignIn ? signInPending : signUpPending;

  const tabs: Array<{ value: Mode; label: string }> = [
    { value: "signin", label: "Sign in" },
    { value: "signup", label: "Create account" },
  ];

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Authentication" className="mb-5 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => setMode(tab.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              mode === tab.value
                ? "bg-black/[0.06] text-ink"
                : "text-muted hover:bg-black/[0.03]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        action={isSignIn ? signInAction : signUpAction}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-soft">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClasses}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-ink-soft">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            placeholder="At least 6 characters"
            className={fieldClasses}
          />
        </label>

        {state.error && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-swatch-red/20 px-3 py-2 text-[13px] text-ink"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Working…" : isSignIn ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

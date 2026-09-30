"use client";

import { useActionState, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  PanelRight,
  Search,
  Sparkles,
} from "lucide-react";

import { completeOnboarding } from "@/lib/actions/onboarding";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/cn";

const initialState: ActionResult = { error: null };

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to your task manager",
    body: "Here is a quick tour of where everything lives. Every screen is a link, so you can bookmark, reload or share exactly what you are looking at.",
  },
  {
    icon: ListTodo,
    title: "Your sidebar",
    body: "Upcoming, Today, Calendar and Sticky Wall on the left, then your lists with their colours and live counts, and your tags. Search at the top filters whichever view you are in.",
  },
  {
    icon: Search,
    title: "Adding and completing tasks",
    body: "\"Add New Task\" expands into a quick-add field - from Today a new task is due today, inside a list it joins that list. Tick the round checkbox to mark a task done.",
  },
  {
    icon: PanelRight,
    title: "Task details",
    body: "Click any task to open it: description, due date, list, tags and subtasks, all editable in place. On a phone the detail fills the screen and Back returns you to your list.",
  },
  {
    icon: Check,
    title: "Ready to start adding your own tasks?",
    body: "Your workspace is filled with demo tasks so you can see how everything looks. Want us to clear them out so you can start fresh?",
  },
];

/**
 * The first-run walkthrough.
 *
 * Rendered by the page while `user_settings.onboarded_at` is null; the final
 * step asks whether to wipe the demo workspace, and either answer completes
 * onboarding through the server action (which revalidates the route, unmounting
 * this overlay). Navigation is local React state - no URL changes, so a reload
 * lands on the same step you left.
 */
export function OnboardingWalkthrough() {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  const isLast = step === steps.length - 1;
  const { icon: Icon, title, body } = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative w-full max-w-[440px] rounded-[20px] border border-line bg-card p-7 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)] sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {steps.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === step ? "w-5 bg-ink" : "w-1.5 bg-line-strong",
                )}
              />
            ))}
          </div>
          <span className="text-[12px] text-muted">
            {step + 1} of {steps.length}
          </span>
        </div>

        <Icon aria-hidden className="mb-4 size-6 text-ink" />
        <h2
          id="onboarding-title"
          className="text-[22px] leading-tight font-bold text-ink"
        >
          {title}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-ink-soft">{body}</p>

        {isLast ? (
          <form action={formAction} className="mt-7 space-y-2.5">
            <button
              type="submit"
              name="clearDemo"
              value="true"
              disabled={pending}
              className="w-full rounded-[10px] bg-accent px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {pending ? "Cleaning up…" : "Yes, clear the demo tasks"}
            </button>
            <button
              type="submit"
              name="clearDemo"
              value="false"
              disabled={pending}
              className="w-full rounded-[10px] border border-line-strong px-4 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-black/[0.03] disabled:opacity-60"
            >
              Keep the demo tasks
            </button>
            {state.error && (
              <p role="alert" className="text-[13px] text-ink">
                {state.error}
              </p>
            )}
          </form>
        ) : (
          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(steps.length - 1)}
              className="text-[14px] text-muted transition-colors hover:text-ink"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                disabled={step === 0}
                aria-label="Previous step"
                className="rounded-lg border border-line-strong p-2 text-ink transition-colors hover:bg-black/[0.03] disabled:opacity-40"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:bg-accent-strong"
              >
                Next
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
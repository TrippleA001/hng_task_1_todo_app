"use client";

import { useActionState, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Menu,
  PanelRight,
  Plus,
  Sparkles,
} from "lucide-react";

import { completeOnboarding } from "@/lib/actions/onboarding";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/cn";

const initialState: ActionResult = { error: null };

/**
 * The tour in the order a newcomer actually meets the app: what they are
 * looking at, how to add to it, how to change it, how to move around, then
 * the one decision the demo workspace needs from them.
 */
const steps = [
  {
    icon: ListTodo,
    title: "This is your task list",
    body: "The middle pane opens on Today: everything due today or already overdue. Tick the circle on the left of a task to finish it, or click the task itself to see its details.",
  },
  {
    icon: Plus,
    title: "Adding tasks takes seconds",
    body: "Tap \"Add New Task\" at the bottom of the list, type your task and press Enter. From Today it lands with a due date of today; open a list first and the task joins that list instead.",
  },
  {
    icon: PanelRight,
    title: "Click a task to edit everything",
    body: "Title, description, due date, list, tags and subtasks all live in the panel on the right, editable right there. On a phone the panel fills the screen and Back returns you to your list.",
  },
  {
    icon: Menu,
    title: "The sidebar is your map",
    body: "Jump between Upcoming, Today, Calendar and Sticky Wall, search from the top, and use the \"+\" rows to make your own Lists and Tags. On a phone, tap Menu up top to open the sidebar.",
  },
  {
    icon: Sparkles,
    title: "One last thing",
    body: "Your workspace starts with a few example tasks so nothing looks empty. Clear them to start from scratch, or keep them as a starting point - you can change this any time in Settings.",
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
          <div className="flex gap-1.5">
            {steps.map((stepItem, index) => (
              <button
                key={stepItem.title}
                type="button"
                onClick={() => setStep(index)}
                aria-label={`Go to step ${index + 1}: ${stepItem.title}`}
                aria-current={index === step ? "step" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === step
                    ? "w-5 bg-ink"
                    : "w-1.5 bg-line-strong hover:bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-[12px] text-muted">
            Step {step + 1} of {steps.length}
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
          <div className="mt-7 space-y-3">
            <form action={formAction} className="space-y-2.5">
              <button
                type="submit"
                name="clearDemo"
                value="true"
                disabled={pending}
                className="w-full rounded-[10px] bg-accent px-4 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
              >
                {pending ? "Starting…" : "Start fresh - clear the demo tasks"}
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
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                disabled={pending}
                className="flex items-center gap-1 text-[14px] text-muted transition-colors hover:text-ink disabled:opacity-60"
              >
                <ChevronLeft aria-hidden className="size-4" />
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-7 flex items-center justify-between">
            {/* A true skip: finish onboarding now and keep everything as-is. */}
            <form action={formAction}>
              <button
                type="submit"
                name="clearDemo"
                value="false"
                disabled={pending}
                className="text-[14px] text-muted transition-colors hover:text-ink disabled:opacity-60"
              >
                Skip tour
              </button>
            </form>
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
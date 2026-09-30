"use client";

import { Check } from "lucide-react";
import {
  startTransition,
  useActionState,
  useOptimistic,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/cn";

type ToggleAction = (formData: FormData) => Promise<void>;
type ToggleActionWithResult = (formData: FormData) => Promise<ActionResult>;

function SubmitCircle({
  checked,
  label,
  className,
}: {
  checked: boolean;
  label: string;
  className?: string;
}) {
  // useFormStatus only works inside the <form>, so the button lives in its own
  // component rather than in ToggleCheckbox itself.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
        checked ? "border-ink bg-ink" : "border-line-strong hover:border-ink",
        pending && "opacity-50",
        className,
      )}
    >
      <Check
        aria-hidden
        strokeWidth={3}
        className={cn(
          "size-3 text-white transition-opacity",
          checked ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

/**
 * The round checkbox from the mood board, wired to a Server Action.
 *
 * It is a submit button rather than an <input type="checkbox"> so that toggling
 * works without JavaScript, and the hidden `done` field carries the *target*
 * state (the opposite of the current one).
 *
 * Once hydrated, submits are intercepted: the tick applies optimistically via
 * `useOptimistic` (a failed toggle snaps back automatically when the transition
 * ends) and failures surface as a toast. The no-JS fallback keeps working
 * because React only runs `onSubmit` after hydration; without JS the native
 * POST hits the void form action.
 */
export function ToggleCheckbox({
  action,
  actionWithResult,
  idField,
  id,
  checked,
  label,
  className,
}: {
  action: ToggleAction;
  actionWithResult: ToggleActionWithResult;
  idField: "taskId" | "subtaskId";
  id: string;
  checked: boolean;
  label: string;
  className?: string;
}) {
  const [actionState, submitWithResult] = useActionState(
    async (_previous: ActionResult | null, formData: FormData) => {
      const result = await actionWithResult(formData);
      if (result.error) toast.error(result.error);
      return result;
    },
    null,
  );
  const [optimisticChecked, toggleOptimistic] = useOptimistic(
    checked,
    (_current: boolean, next: boolean) => next,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    // `contents` keeps the form boxless: the button becomes the flex item, so
    // callers can pass layout classes (e.g. a top margin) and they apply to the
    // button rather than to an invisible wrapper.
    <form
      ref={formRef}
      action={action}
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(formRef.current ?? event.currentTarget);
        startTransition(() => {
          toggleOptimistic(!optimisticChecked);
          submitWithResult(formData);
        });
      }}
    >
      <input type="hidden" name={idField} value={id} />
      <input
        type="hidden"
        name="done"
        value={optimisticChecked ? "false" : "true"}
      />
      <SubmitCircle
        checked={optimisticChecked}
        label={label}
        className={className}
      />
      {actionState?.error ? (
        <span className="sr-only" role="alert">
          {actionState.error}
        </span>
      ) : null}
    </form>
  );
}

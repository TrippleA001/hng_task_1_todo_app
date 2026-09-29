"use client";

import { Check } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/cn";

type ToggleAction = (formData: FormData) => Promise<void>;

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
 */
export function ToggleCheckbox({
  action,
  idField,
  id,
  checked,
  label,
  className,
}: {
  action: ToggleAction;
  idField: "taskId" | "subtaskId";
  id: string;
  checked: boolean;
  label: string;
  className?: string;
}) {
  return (
    // `contents` keeps the form boxless: the button becomes the flex item, so
    // callers can pass layout classes (e.g. a top margin) and they apply to the
    // button rather than to an invisible wrapper.
    <form action={action} className="contents">
      <input type="hidden" name={idField} value={id} />
      <input type="hidden" name="done" value={checked ? "false" : "true"} />
      <SubmitCircle checked={checked} label={label} className={className} />
    </form>
  );
}

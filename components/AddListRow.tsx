"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createList } from "@/lib/actions/lists";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/cn";

import { Swatch } from "./Swatch";

const initialState: ActionResult = { error: null };
const COLORS = ["red", "blue", "yellow"] as const;

/**
 * "Add New List" in the sidebar: a row that expands into an inline form with a
 * name field and the three swatch colours - the same expand-in-place pattern as
 * AddTaskRow, so the sidebar never navigates away.
 */
export function AddListRow() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<(typeof COLORS)[number]>("blue");
  const [state, formAction, pending] = useActionState(createList, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clear the field after a successful add so several lists can be entered in
  // a row - the same DOM-reset trick AddTaskRow uses. An error keeps the form
  // untouched so its message stays visible (`at` only changes on success).
  useEffect(() => {
    if (state.at) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state.at]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[15px] text-ink transition-colors hover:bg-black/[0.03]"
      >
        <Plus aria-hidden className="size-4" />
        <span>Add New List</span>
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2.5 rounded-lg border border-line-strong bg-field p-2.5"
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          name="name"
          placeholder="List name"
          aria-label="New list name"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-2.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => setOpen(false)}
          className="text-muted transition-colors hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div
        role="group"
        aria-label="List colour"
        className="flex items-center gap-2 px-0.5"
      >
        {COLORS.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={`${option} list colour`}
            aria-pressed={color === option}
            onClick={() => setColor(option)}
            className={cn(
              "rounded-[6px] p-0.5 transition-shadow",
              color === option &&
                "ring-2 ring-ink ring-offset-1 ring-offset-field",
            )}
          >
            <Swatch color={option} />
          </button>
        ))}
      </div>

      <input type="hidden" name="color" value={color} />

      {state.error && (
        <p role="alert" className="text-[12px] text-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
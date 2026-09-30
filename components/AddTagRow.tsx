"use client";

import { Plus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { createTag } from "@/lib/actions/tags";
import type { ActionResult } from "@/lib/actions/result";

const initialState: ActionResult = { error: null };

/**
 * "Add Tag" in the sidebar's Tags section: a chip that expands into a compact
 * inline form, styled to sit among the existing tag chips.
 */
export function AddTagRow() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTag, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clear the field after a successful add (same DOM-reset pattern as
  // AddTaskRow); an error keeps the form untouched so its message shows.
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
        className="inline-flex items-center gap-1 rounded-[7px] border border-line-strong bg-field px-2.5 py-1.5 text-[13px] text-ink transition-colors hover:bg-black/[0.03]"
      >
        <Plus aria-hidden className="size-3" />
        Add Tag
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="inline-flex flex-wrap items-center gap-1.5 rounded-[7px] border border-line-strong bg-field px-2 py-1"
    >
      <input
        ref={inputRef}
        name="name"
        placeholder="Tag name"
        aria-label="New tag name"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="w-24 min-w-0 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[13px] font-semibold text-ink transition-opacity hover:opacity-70 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setOpen(false)}
        className="text-muted transition-colors hover:text-ink"
      >
        <X aria-hidden className="size-3.5" />
      </button>
      {state.error && (
        <p role="alert" className="basis-full text-[12px] text-ink">
          {state.error}
        </p>
      )}
    </form>
  );
}
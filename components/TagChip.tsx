"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { deleteTag, renameTag } from "@/lib/actions/tags";
import { cn } from "@/lib/cn";

import { Chip } from "./Chip";

/**
 * A tag chip with rename and delete, styled to sit among the other chips in
 * the sidebar's Tags section.
 *
 * Delete asks for confirmation (the chip's buttons are small enough to
 * mis-hit) and the dialog makes the blast radius explicit: only the tag goes,
 * never the tasks. Same direct-argument action pattern as ListRow.
 */
export function TagChip({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    const save = () => {
      const trimmed = draft.trim();
      if (!trimmed) {
        setError("Give the tag a name.");
        return;
      }
      setError(null);
      startTransition(async () => {
        const result = await renameTag(id, trimmed);
        if (result.error) setError(result.error);
        else setEditing(false);
      });
    };

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="inline-flex flex-wrap items-center gap-1.5 rounded-[7px] border border-line-strong bg-field px-2 py-1"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          aria-label={`Rename tag ${name}`}
          className="w-24 min-w-0 bg-transparent text-[13px] text-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-[13px] font-semibold text-ink transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          aria-label="Cancel rename"
          onClick={() => {
            setDraft(name);
            setEditing(false);
          }}
          className="text-muted transition-colors hover:text-ink"
        >
          <X aria-hidden className="size-3.5" />
        </button>
        {error && (
          <p role="alert" className="basis-full text-[12px] text-ink">
            {error}
          </p>
        )}
      </form>
    );
  }

  const remove = () => {
    if (!confirm(`Delete the "${name}" tag? Tasks keep everything else.`)) return;
    startTransition(async () => {
      const result = await deleteTag(id);
      if (result.error) setError(result.error);
    });
  };

  return (
    <span className="inline-flex items-center gap-0.5">
      <Chip tone="soft">{name}</Chip>
      <button
        type="button"
        aria-label={`Rename ${name}`}
        onClick={() => {
          setDraft(name);
          setError(null);
          setEditing(true);
        }}
        className={cn(
          "rounded p-1 transition-colors",
          error ? "text-ink" : "text-muted hover:text-ink",
        )}
      >
        <Pencil aria-hidden className="size-3" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${name}`}
        disabled={pending}
        onClick={remove}
        className="rounded p-1 text-muted transition-colors hover:text-ink disabled:opacity-50"
      >
        <Trash2 aria-hidden className="size-3" />
      </button>
      {error && (
        <span role="alert" className="basis-full text-[12px] text-ink">
          {error}
        </span>
      )}
    </span>
  );
}
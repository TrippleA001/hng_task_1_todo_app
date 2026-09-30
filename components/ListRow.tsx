"use client";

import Link from "next/link";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { deleteList, renameList } from "@/lib/actions/lists";
import { cn } from "@/lib/cn";
import type { SwatchColor } from "@/lib/types";

import { CountBadge } from "./CountBadge";
import { Swatch } from "./Swatch";

/**
 * A sidebar list row with first-class rename and delete.
 *
 * The label is a real link while browsing; the pencil swaps it for an inline
 * form and the bin asks for confirmation first, because deleting a list also
 * deletes every task inside it (0001's cascade). The mutations run as direct
 * server-action calls inside a transition, so the editor closes the moment the
 * action resolves - closing from an effect would trip the lint rule against
 * setState-in-effect.
 */
export function ListRow({
  id,
  name,
  color,
  count,
  active,
  href,
}: {
  id: string;
  name: string;
  color: SwatchColor;
  count: number;
  active: boolean;
  href: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the rename field whenever the editor opens (imperative focus in an
  // effect is fine - the rule targets setState).
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    const save = () => {
      const trimmed = draft.trim();
      if (!trimmed) {
        setError("Give the list a name.");
        return;
      }
      setError(null);
      startTransition(async () => {
        const result = await renameList(id, trimmed);
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
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-field px-2 py-1.5"
      >
        <Swatch color={color} />
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          aria-label={`Rename list ${name}`}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-2.5 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
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
          <X aria-hidden className="size-4" />
        </button>
        {error && (
          <p role="alert" className="w-full text-[12px] text-ink">
            {error}
          </p>
        )}
      </form>
    );
  }

  const remove = () => {
    if (!confirm(`Delete "${name}" and all tasks inside it?`)) return;
    startTransition(async () => {
      const result = await deleteList(id);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center rounded-lg transition-colors",
        active ? "bg-black/[0.05]" : "hover:bg-black/[0.03]",
      )}
    >
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-[15px]",
          active ? "font-semibold text-ink" : "text-ink",
        )}
      >
        <Swatch color={color} />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <CountBadge value={count} active={active} />
      </Link>
      <span className="flex shrink-0 items-center gap-0.5 pr-1.5">
        <button
          type="button"
          aria-label={`Rename ${name}`}
          onClick={() => {
            setDraft(name);
            setError(null);
            setEditing(true);
          }}
          className="rounded p-1 text-muted transition-colors hover:text-ink"
        >
          <Pencil aria-hidden className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${name}`}
          disabled={pending}
          onClick={remove}
          className="rounded p-1 text-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      </span>
      {error && (
        <p role="alert" className="w-full px-2 pb-1.5 text-[12px] text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
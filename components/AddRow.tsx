import { Plus } from "lucide-react";

import { cn } from "@/lib/cn";

type Variant = "field" | "plain";

const variantClasses: Record<Variant, string> = {
  // "+ Add New Task" sits in a filled box in the mood board.
  field: "rounded-[10px] border border-line-strong bg-field px-3.5 py-3",
  // "+ Add New Subtask" is a bare row.
  plain: "px-0 py-2",
};

/** The "+ Add New Task" / "+ Add New Subtask" row. */
export function AddRow({
  label,
  variant = "plain",
  className,
}: {
  label: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 text-left text-[15px] text-ink-soft transition-colors hover:bg-black/[0.03]",
        variantClasses[variant],
        className,
      )}
    >
      <Plus aria-hidden className="size-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

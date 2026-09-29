import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "soft" | "outline" | "active" | "danger";

const toneClasses: Record<Tone, string> = {
  soft: "bg-field text-ink-soft",
  outline: "border border-line-strong bg-white text-ink",
  active: "bg-line text-ink",
  // Used for an overdue due date.
  danger: "bg-swatch-red/30 text-ink",
};

/** A small pill used for a task's due date, subtask count, list and tags. */
export function Chip({
  children,
  icon,
  tone = "soft",
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

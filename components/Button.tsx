import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost";

const variantClasses: Record<Variant, string> = {
  // "Save changes" in the mood board.
  primary: "bg-accent text-ink hover:bg-accent-strong",
  // "Delete Task" in the mood board.
  ghost: "border border-line-strong bg-white text-ink hover:bg-field",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors",
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

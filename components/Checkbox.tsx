import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * The round checkbox from the mood board.
 *
 * The tick is positioned over the circle rather than inside it so that the
 * `group-has-[:checked]` variants can drive both the circle and the icon.
 * Uncontrolled for now - Phases 5 and 6 wire it to the database.
 */
export function Checkbox({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "group relative flex size-5 shrink-0 cursor-pointer items-center justify-center",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...rest} />
      <span
        aria-hidden
        className="size-5 rounded-full border-[1.5px] border-line-strong transition-colors group-has-[:checked]:border-ink group-has-[:checked]:bg-ink group-focus-within:ring-2 group-focus-within:ring-accent group-focus-within:ring-offset-1"
      />
      <Check
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute size-3 text-white opacity-0 transition-opacity group-has-[:checked]:opacity-100"
      />
    </label>
  );
}

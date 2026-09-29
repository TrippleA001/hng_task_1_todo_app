import { cn } from "@/lib/cn";

/** The rounded count pill shown on sidebar rows and view titles. */
export function CountBadge({
  value,
  active = false,
  className,
}: {
  value: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "min-w-6 rounded-md bg-white px-1.5 py-0.5 text-center text-[13px] leading-5 tabular-nums",
        active ? "font-semibold text-ink shadow-sm" : "text-ink-soft",
        className,
      )}
    >
      {value}
    </span>
  );
}

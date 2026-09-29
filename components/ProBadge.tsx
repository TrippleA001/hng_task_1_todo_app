import { cn } from "@/lib/cn";

/**
 * The blue "Pro" pill that overlaps the card's top-right corner.
 *
 * Decorative for now - it deliberately sits in the positioning wrapper rather
 * than the card so the card's `overflow-hidden` does not clip it.
 */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "z-10 rounded-2xl bg-pro px-7 py-3.5 font-display text-3xl font-bold text-white shadow-[0_10px_30px_-10px_rgba(47,127,247,0.7)]",
        className,
      )}
    >
      Pro
    </span>
  );
}

import { cn } from "@/lib/cn";
import type { SwatchColor } from "@/lib/types";

const swatchClasses: Record<SwatchColor, string> = {
  red: "bg-swatch-red",
  blue: "bg-swatch-blue",
  yellow: "bg-swatch-yellow",
};

/** The small colour square that identifies a list. */
export function Swatch({
  color,
  className,
}: {
  color: SwatchColor;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-4 shrink-0 rounded-[4px]",
        swatchClasses[color],
        className,
      )}
    />
  );
}

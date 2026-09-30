import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { CountBadge } from "./CountBadge";

/**
 * A clickable sidebar row: view, list or tag.
 *
 * `swatch` wins over `icon` so a list row can show its colour square where a
 * view row shows a Lucide icon. With `href` the row renders a real link (so
 * middle-click and "open in new tab" work); without one it stays a button,
 * which is what the Sign out and Add rows need.
 */
export function SidebarRow({
  label,
  icon,
  swatch,
  count,
  active = false,
  chevron = false,
  type = "button",
  href,
  className,
}: {
  label: string;
  icon?: ReactNode;
  swatch?: ReactNode;
  count?: number;
  active?: boolean;
  chevron?: boolean;
  /** "submit" lets the row act as the button of a surrounding form. */
  type?: "button" | "submit";
  /** When present the row navigates instead of firing a callback. */
  href?: string;
  className?: string;
}) {
  const classes = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[15px] transition-colors",
    active
      ? "bg-black/[0.05] font-semibold text-ink"
      : "text-ink hover:bg-black/[0.03]",
    className,
  );

  const content = (
    <>
      {swatch ?? icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" && <CountBadge value={count} active={active} />}
      {chevron && (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {content}
    </button>
  );
}

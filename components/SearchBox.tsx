import { Search } from "lucide-react";

import { cn } from "@/lib/cn";

/** The search field at the top of the sidebar. */
export function SearchBox({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line-strong bg-field px-3 py-2",
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0 text-muted" />
      <input
        type="search"
        placeholder="Search"
        aria-label="Search tasks"
        className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}

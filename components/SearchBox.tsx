import { Search } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The search field at the top of the sidebar.
 *
 * Deliberately a plain GET form: submitting navigates to `/?view=...&q=...`, so
 * search works without client JavaScript, survives a reload, and the active view
 * is carried across so you keep looking at the same list while filtering it.
 */
export function SearchBox({
  view,
  query = "",
  className,
}: {
  view: string;
  query?: string;
  className?: string;
}) {
  return (
    <form
      action="/"
      method="get"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-line-strong bg-field px-3 py-2",
        className,
      )}
    >
      <input type="hidden" name="view" value={view} />
      <Search aria-hidden className="size-4 shrink-0 text-muted" />
      <input
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search"
        aria-label="Search tasks"
        className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </form>
  );
}

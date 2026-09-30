import { PAGE_SIZE, pageHref } from "@/lib/pagination";

/**
 * Prev/Next pager for a 20-row window. Plain links, so paging works without
 * JS and the page is shareable. The last page link disappears when the total
 * fits on one page.
 */
export function Pagination({
  view,
  page,
  total,
  query = "",
  month,
}: {
  view: string;
  page: number;
  total: number;
  query?: string;
  month?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pageCount);

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Task pages"
      className="flex items-center justify-between border-t border-line pt-3"
    >
      {current > 1 ? (
        <a
          href={pageHref(view, current - 1, query, month)}
          className="rounded-lg border border-line-strong px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-black/[0.03]"
        >
          ← Prev
        </a>
      ) : (
        <span />
      )}
      <span className="text-[13px] text-muted" aria-live="polite">
        Page {current} of {pageCount}
      </span>
      {current < pageCount ? (
        <a
          href={pageHref(view, current + 1, query, month)}
          className="rounded-lg border border-line-strong px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-black/[0.03]"
        >
          Next →
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
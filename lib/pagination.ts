/**
 * Page size for every paged task collection. One constant so the list views,
 * the sticky wall, the fetch ranges and the UI copy can never disagree.
 */
export const PAGE_SIZE = 20;

/** 1-based page number from `?page=`; garbage in, page 1 out. */
export function pageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** URL for a view at a given page, carrying search and calendar month across. */
export function pageHref(
  view: string,
  page: number,
  query = "",
  month?: string,
): string {
  const params = new URLSearchParams({ view });
  if (query) params.set("q", query);
  if (month) params.set("month", month);
  if (page > 1) params.set("page", String(page));
  return `/?${params.toString()}`;
}

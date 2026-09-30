import { format, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";

/** The mock renders dates as dd-MM-yy (e.g. 22-03-22). */
export function formatDueDate(iso: string): string {
  return format(new Date(iso), "dd-MM-yy");
}

/** ISO date (yyyy-MM-dd) for the given date. */
export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Today at midnight, so comparisons ignore the time of day. */
export function today(): Date {
  return startOfDay(new Date());
}

/** True when the date is today. */
export function isDueToday(iso: string | null): boolean {
  return iso !== null && isSameDay(new Date(iso), today());
}

/** True when the date is today or later. */
export function isDueTodayOrLater(iso: string | null): boolean {
  if (iso === null) return false;
  const due = startOfDay(new Date(iso));
  return isSameDay(due, today()) || isAfter(due, today());
}

/** True when the due date has already passed. */
export function isOverdue(iso: string | null): boolean {
  return iso !== null && isBefore(startOfDay(new Date(iso)), today());
}

/**
 * True when the date is today or already past.
 *
 * This is what the Today view uses: a task due yesterday is still work you have
 * to do today, and leaving it out of Today made overdue tasks invisible in both
 * Today and Upcoming. The SQL in lib/db/workspace.ts (`due_date <= today`)
 * is the same definition expressed server-side - keep the two in step.
 */
export function isDueTodayOrOverdue(iso: string | null): boolean {
  return isDueToday(iso) || isOverdue(iso);
}

/**
 * ISO-date comparisons for building scoped Supabase queries out of yyyy-MM-dd
 * strings. String comparison is safe because ISO dates sort lexicographically.
 */
export function isDueOnOrBefore(iso: string, cutoff: string): boolean {
  return iso.slice(0, 10) <= cutoff;
}

export function isDueOnOrAfter(iso: string, cutoff: string): boolean {
  return iso.slice(0, 10) >= cutoff;
}

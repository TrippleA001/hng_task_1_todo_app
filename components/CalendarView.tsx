import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { today } from "@/lib/format";
import type { Task } from "@/lib/types";
import { taskHref } from "@/lib/views";

import { CountBadge } from "./CountBadge";

/** `?month=` is yyyy-MM; anything else falls back to the current month. */
const MONTH_PARAM = /^\d{4}-(0[1-9]|1[0-2])$/;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** URL for the calendar at a given month, carrying the search term across. */
function monthHref(month: Date, query: string): string {
  const params = new URLSearchParams({
    view: "calendar",
    month: format(month, "yyyy-MM"),
  });
  if (query) params.set("q", query);
  return `/?${params.toString()}`;
}

/**
 * The Calendar view: a month grid with each task sitting on its due date.
 *
 * The month lives in `?month=`, so prev/next are ordinary links - reload,
 * back button and sharing all behave. Tasks without a due date have nowhere to
 * sit in a grid, so they are reachable from the other views instead.
 */
export function CalendarView({
  tasks,
  month,
  query = "",
}: {
  tasks: Task[];
  month?: string;
  query?: string;
}) {
  const reference = month && MONTH_PARAM.test(month)
    ? startOfMonth(new Date(`${month}-01T00:00:00`))
    : startOfMonth(today());

  const days = eachDayOfInterval({
    start: startOfWeek(reference, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(reference), { weekStartsOn: 1 }),
  });

  // Bucket by the raw yyyy-MM-dd from Postgres; parsing it as a local date key
  // avoids the off-by-one a UTC parse would introduce in negative offsets.
  const byDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = task.dueDate.slice(0, 10);
    const bucket = byDay.get(key) ?? [];
    bucket.push(task);
    byDay.set(key, bucket);
  }

  const monthCount = days.reduce(
    (total, day) => total + (byDay.get(format(day, "yyyy-MM-dd"))?.length ?? 0),
    0,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-3.5 pb-6">
        <h1 className="text-[32px] leading-none font-bold text-ink">
          Calendar
        </h1>
        <CountBadge
          value={monthCount}
          active
          className="min-w-9 px-2 py-1 text-[19px] leading-6"
        />
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={monthHref(addMonths(reference, -1), query)}
            aria-label="Previous month"
            className="rounded-lg border border-line-strong p-2 text-ink transition-colors hover:bg-black/[0.03]"
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Link>
          <span className="min-w-[132px] text-center text-[15px] font-semibold text-ink">
            {format(reference, "MMMM yyyy")}
          </span>
          <Link
            href={monthHref(addMonths(reference, 1), query)}
            aria-label="Next month"
            className="rounded-lg border border-line-strong p-2 text-ink transition-colors hover:bg-black/[0.03]"
          >
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-7 overflow-hidden rounded-[14px] border border-line bg-line">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-card px-2 py-2 text-center text-[12px] font-semibold tracking-wide text-muted uppercase"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, reference);
          const isToday = isSameDay(day, today());

          return (
            <div
              key={key}
              className={cn(
                "min-h-[88px] bg-card p-1.5",
                !inMonth && "bg-black/[0.02]",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-[13px] text-ink",
                  isToday && "bg-ink font-semibold text-card",
                  !inMonth && "text-muted",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={taskHref("calendar", task.id, query)}
                    title={task.title}
                    className={cn(
                      "block truncate rounded bg-black/[0.06] px-1.5 py-1 text-[12px] text-ink transition-colors hover:bg-black/[0.12]",
                      task.done && "text-muted line-through",
                    )}
                  >
                    {task.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {monthCount === 0 && (
        <p className="mt-4 text-sm text-muted">
          {query
            ? `No tasks match "${query}" this month.`
            : "Nothing due this month."}
        </p>
      )}
    </div>
  );
}
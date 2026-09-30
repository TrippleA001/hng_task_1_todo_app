import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDueDate, isOverdue } from "@/lib/format";
import type { Task } from "@/lib/types";
import { taskHref } from "@/lib/views";

import { CountBadge } from "./CountBadge";

/** A deterministic tilt per card, so the wall looks pinned but not random. */
const TILTS = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-1", "-rotate-1"];

/**
 * The Sticky Wall: the same tasks as pinned paper notes instead of rows.
 *
 * A presentation, not a second data source - each card links to `?task=` like
 * a list row does, so the detail panel and the back button behave identically.
 * Notes without a due date live here happily, which a date-shaped view cannot
 * say.
 */
export function StickyWall({
  tasks,
  selectedTaskId = null,
  query = "",
}: {
  tasks: Task[];
  selectedTaskId?: string | null;
  query?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3.5 pb-6">
        <h1 className="text-[32px] leading-none font-bold text-ink">
          Sticky Wall
        </h1>
        <CountBadge
          value={tasks.length}
          active
          className="min-w-9 px-2 py-1 text-[19px] leading-6"
        />
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-[10px] border border-dashed border-line-strong px-3.5 py-6 text-center text-[15px] text-muted">
          {query ? `No tasks match "${query}".` : "Nothing here yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {tasks.map((task, index) => {
            const overdue = isOverdue(task.dueDate) && !task.done;

            return (
              <Link
                key={task.id}
                href={taskHref("sticky", task.id, query)}
                className={cn(
                  "block rounded-[3px] bg-swatch-yellow p-4 shadow-[0_12px_26px_-18px_rgba(0,0,0,0.7)] transition-shadow hover:shadow-[0_16px_30px_-18px_rgba(0,0,0,0.8)]",
                  TILTS[index % TILTS.length],
                  task.done && "opacity-60",
                  selectedTaskId === task.id && "ring-2 ring-ink",
                )}
              >
                <p
                  className={cn(
                    "text-[15px] leading-5 font-medium break-words text-ink",
                    task.done && "line-through",
                  )}
                >
                  {task.title}
                </p>
                {task.dueDate && (
                  <span
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 text-[12px]",
                      overdue ? "font-semibold text-ink" : "text-ink-soft",
                    )}
                  >
                    <CalendarDays aria-hidden className="size-3.5" />
                    {overdue
                      ? `Overdue ${formatDueDate(task.dueDate)}`
                      : formatDueDate(task.dueDate)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
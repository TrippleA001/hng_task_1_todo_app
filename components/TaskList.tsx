"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { applyTaskOrder } from "@/lib/actions/tasks";
import { listForTask } from "@/lib/selectors";
import type { Task, Workspace } from "@/lib/types";

import { AddTaskRow } from "./AddTaskRow";
import { CountBadge } from "./CountBadge";
import { TaskRow } from "./TaskRow";

/**
 * A task row with a drag handle. The handle is the only draggable surface so
 * dragging never fights the title link, the checkbox, or touch scrolling.
 */
function SortableTaskRow({
  task,
  workspace,
  view,
  query,
  page,
  selected,
}: {
  task: Task;
  workspace: Workspace;
  view: string;
  query: string;
  page: number;
  selected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      <TaskRow
        task={task}
        list={listForTask(workspace, task)}
        view={view}
        query={query}
        page={page}
        selected={selected}
        handle={
          <button
            type="button"
            aria-label={`Drag "${task.title}" to reorder`}
            {...attributes}
            {...listeners}
            className="mt-1 shrink-0 cursor-grab touch-none text-muted transition-colors hover:text-ink active:cursor-grabbing"
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
        }
      />
    </div>
  );
}

/**
 * The middle column: a bold view title with its count, the add row, then the
 * tasks themselves.
 *
 * Each row links itself into the detail panel (`?task=`), so `selectedTaskId`
 * only drives the highlight - selection is a URL, not component state.
 *
 * Drag handles appear in list views only: `position` is per-list data, so
 * reordering a cross-list Today/Upcoming subset would interleave two lists'
 * position spaces. Order applies to the current page window; `pageOffset` is
 * added back when positions are written.
 */
export function TaskList({
  title,
  tasks,
  workspace,
  view,
  query = "",
  selectedTaskId = null,
  emptyMessage,
  quickAddListId,
  quickAddDueDate,
  reorderable = false,
  pageOffset = 0,
  page = 1,
  pagination,
  className,
}: {
  title: string;
  tasks: Task[];
  workspace: Workspace;
  /** The active view, carried into every row's link. */
  view: string;
  query?: string;
  selectedTaskId?: string | null;
  /** Overrides the default empty-state line, e.g. when a search matched nothing. */
  emptyMessage?: string;
  /** List a quick-added task joins. */
  quickAddListId?: string;
  /** Due date (ISO) a quick-added task gets - today, in the Today view. */
  quickAddDueDate?: string;
  reorderable?: boolean;
  pageOffset?: number;
  page?: number;
  pagination?: React.ReactNode;
  className?: string;
}) {
  const [items, setItems] = useState<Task[] | null>(null);
  const visible = items ?? tasks;

  const sensors = useSensors(
    useSensor(PointerSensor),
    // A press-and-hold before touch dragging, so a tap still opens the task.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = visible.findIndex((task) => task.id === active.id);
    const to = visible.findIndex((task) => task.id === over.id);
    if (from < 0 || to < 0) return;

    const next = arrayMove(visible, from, to);
    const previous = visible;
    setItems(next);

    startTransition(async () => {
      const result = await applyTaskOrder(
        next.map((task) => task.id),
        pageOffset,
      );
      if (result.error) {
        setItems(previous);
        toast.error(result.error);
      }
    });
  }

  // Server data changed (navigation, mutation) - drop the local order.
  if (items && items.length !== tasks.length) {
    setItems(null);
  }

  const emptyLine = (
    <p className="py-10 text-center text-sm text-muted">
      {emptyMessage ?? "Nothing here yet."}
    </p>
  );

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ""}`}>
      <header className="flex items-center gap-3.5 pb-6">
        <h1 className="text-[32px] leading-none font-bold text-ink">{title}</h1>
        <CountBadge
          value={tasks.length}
          active
          className="min-w-9 px-2 py-1 text-[19px] leading-6"
        />
      </header>

      {quickAddListId ? (
        <AddTaskRow
          listId={quickAddListId}
          dueDate={quickAddDueDate}
          view={view}
          query={query}
        />
      ) : (
        <p className="rounded-[10px] border border-dashed border-line-strong px-3.5 py-3 text-[15px] text-muted">
          Create a list in the sidebar, then add your first task here.
        </p>
      )}

      {reorderable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visible.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-3 flex-1 overflow-y-auto">
              {visible.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  workspace={workspace}
                  view={view}
                  query={query}
                  page={page}
                  selected={task.id === selectedTaskId}
                />
              ))}
              {visible.length === 0 && emptyLine}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="mt-3 flex-1 overflow-y-auto">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              list={listForTask(workspace, task)}
              view={view}
              query={query}
              page={page}
              selected={task.id === selectedTaskId}
            />
          ))}
          {tasks.length === 0 && emptyLine}
        </div>
      )}

      {pagination}
    </div>
  );
}


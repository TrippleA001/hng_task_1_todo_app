import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import { toIsoDate, today } from "../format";
import { PAGE_SIZE } from "../pagination";
import type {
  List,
  Subtask,
  SwatchColor,
  Tag,
  Task,
  Workspace,
} from "../types";

type Client = SupabaseClient<Database>;

const SWATCHES: SwatchColor[] = ["red", "blue", "yellow"];

/** Postgres stores the colour as text; narrow it to the union the UI expects. */
function toSwatchColor(color: string): SwatchColor {
  return SWATCHES.includes(color as SwatchColor)
    ? (color as SwatchColor)
    : "blue";
}

/**
 * Scope for the paged task fetch: which slice of the workspace one screen
 * needs. Date windows mirror the selector predicates in lib/selectors.ts
 * (Today `<= today`, Upcoming `>= today`) - keep the two in step or counts
 * and lists will disagree.
 */
export interface TaskScope {
  view: string;
  page: number;
  query: string;
  /** Grid range `yyyy-MM-dd`, calendar only. */
  rangeStart?: string;
  rangeEnd?: string;
}

export interface ScopedWorkspace extends Workspace {
  /** Total rows matching the scope (or the month total for the calendar). */
  total: number;
  /** Head counts for the sidebar badges - always totals, never page sizes. */
  counts: {
    today: number;
    upcoming: number;
    perList: Record<string, number>;
    tasks: number;
  };
}

/**
 * Reads exactly what one screen needs, in two waves.
 *
 * Wave 1 (parallel): lists, tags, the scoped 20-row task page (row columns
 * only - `description` is the heaviest column and the list never shows it),
 * and head-count queries for the sidebar badges.
 *
 * Wave 2 (parallel, filtered to the displayed ids): subtasks, tag links, and
 * the selected task's description. Everything stays bounded by PAGE_SIZE.
 */
export async function fetchWorkspace(
  supabase: Client,
  scope: TaskScope,
  selectedTaskId?: string | null,
): Promise<ScopedWorkspace> {
  const todayIso = toIsoDate(today());
  const needle = scope.query.trim();
  const page = Math.max(1, scope.page);
  const from = (page - 1) * PAGE_SIZE;
  const last = from + PAGE_SIZE - 1;

  // The scoped page. Calendar owns its range (whole month, index-backed, no
  // paging); every other view takes one 20-row window. `count: exact` on the
  // same query keeps "Page N of M" honest under search.
  async function fetchTaskPage(): Promise<{
    rows: Array<{
      id: string;
      title: string;
      done: boolean;
      list_id: string;
      due_date: string | null;
    }>;
    total: number;
  }> {
    if (scope.view === "calendar" && scope.rangeStart && scope.rangeEnd) {
      let monthQuery = supabase
        .from("tasks")
        .select("id, title, done, list_id, due_date", { count: "exact" })
        .gte("due_date", scope.rangeStart)
        .lte("due_date", scope.rangeEnd)
        .order("due_date")
        .order("position");
      if (needle) monthQuery = monthQuery.ilike("title", `%${needle}%`);
      const { data, error, count } = await monthQuery;
      if (error) throw new Error(`Could not load the calendar: ${error.message}`);
      return { rows: data ?? [], total: count ?? 0 };
    }

    let scoped = supabase
      .from("tasks")
      .select("id, title, done, list_id, due_date", { count: "exact" });

    if (scope.view === "today") {
      scoped = scoped.lte("due_date", todayIso).eq("done", false);
    } else if (scope.view === "upcoming") {
      scoped = scoped.gte("due_date", todayIso).eq("done", false);
    } else if (scope.view.startsWith("list:")) {
      scoped = scoped.eq("list_id", scope.view.slice("list:".length));
    }

    if (needle) scoped = scoped.ilike("title", `%${needle}%`);

    const { data, error, count } = await scoped
      .order("position")
      .order("created_at")
      .range(from, last);
    if (error) throw new Error(`Could not load tasks: ${error.message}`);
    return { rows: data ?? [], total: count ?? 0 };
  }

  const [listsResult, tagsResult, pageResult, todayResult, upcomingResult, totalResult] =
    await Promise.all([
      supabase
        .from("lists")
        .select("id, name, color, position")
        .order("position")
        .order("name"),
      supabase.from("tags").select("id, name").order("name"),
      fetchTaskPage(),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .lte("due_date", todayIso)
        .eq("done", false),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .gte("due_date", todayIso)
        .eq("done", false),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
    ]);

  const waveOneFailure = [
    listsResult,
    tagsResult,
    todayResult,
    upcomingResult,
    totalResult,
  ].find((result) => result.error);

  if (waveOneFailure?.error) {
    throw new Error(
      `Could not load the workspace: ${waveOneFailure.error.message}`,
    );
  }

  const lists: List[] = (listsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: toSwatchColor(row.color),
  }));

  const tags: Tag[] = (tagsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  // Per-list badge counts: one head-count query each. Lists are few and the
  // queries are `count: exact, head: true` (no rows), so this stays cheap.
  const perListEntries = await Promise.all(
    (listsResult.data ?? []).map(async (row) => {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("list_id", row.id)
        .eq("done", false);
      return [row.id, count ?? 0] as const;
    }),
  );

  // Wave 2, bounded by the displayed ids (plus the open task when it is not
  // on this page, e.g. a deep link): subtasks, tag links, and the open task's
  // description (trimmed from the page select as the heaviest column).
  const taskIds = pageResult.rows.map((row) => row.id);
  const detailIds =
    selectedTaskId && !taskIds.includes(selectedTaskId)
      ? [...taskIds, selectedTaskId]
      : taskIds;

  const [subtasksResult, taskTagsResult, detailResult] = await Promise.all([
    detailIds.length > 0
      ? supabase
          .from("subtasks")
          .select("id, task_id, title, done, position")
          .in("task_id", detailIds)
          .order("position")
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            task_id: string;
            title: string;
            done: boolean;
          }>,
          error: null,
        }),
    taskIds.length > 0
      ? supabase
          .from("task_tags")
          .select("task_id, tag_id")
          .in("task_id", detailIds)
      : Promise.resolve({
          data: [] as Array<{ task_id: string; tag_id: string }>,
          error: null,
        }),
    selectedTaskId
      ? supabase
          .from("tasks")
          .select("id, title, description, done, list_id, due_date")
          .eq("id", selectedTaskId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const waveTwoFailure = [subtasksResult, taskTagsResult, detailResult].find(
    (result) => result.error,
  );
  if (waveTwoFailure?.error) {
    throw new Error(
      `Could not load task details: ${waveTwoFailure.error.message}`,
    );
  }

  // Descriptions: empty on the page rows (trimmed from the select), the real
  // value only for the open task. When the open task missed the page (a deep
  // link), its full row arrives here as well.
  const descriptions = new Map<string, string>();
  if (selectedTaskId && detailResult.data) {
    descriptions.set(selectedTaskId, detailResult.data.description ?? "");
  }

  const offPageTask =
    selectedTaskId &&
    detailResult.data &&
    !pageResult.rows.some((row) => row.id === selectedTaskId)
      ? {
          id: detailResult.data.id,
          title: detailResult.data.title,
          done: detailResult.data.done,
          list_id: detailResult.data.list_id,
          due_date: detailResult.data.due_date,
        }
      : null;

  const subtasksByTask = new Map<string, Subtask[]>();
  for (const row of subtasksResult.data ?? []) {
    const bucket = subtasksByTask.get(row.task_id) ?? [];
    bucket.push({ id: row.id, title: row.title, done: row.done });
    subtasksByTask.set(row.task_id, bucket);
  }

  const tagIdsByTask = new Map<string, string[]>();
  for (const row of taskTagsResult.data ?? []) {
    const bucket = tagIdsByTask.get(row.task_id) ?? [];
    bucket.push(row.tag_id);
    tagIdsByTask.set(row.task_id, bucket);
  }

  const allRows = offPageTask
    ? [...pageResult.rows, offPageTask]
    : pageResult.rows;

  const tasks: Task[] = allRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: descriptions.get(row.id) ?? "",
    done: row.done,
    listId: row.list_id,
    dueDate: row.due_date,
    tagIds: tagIdsByTask.get(row.id) ?? [],
    subtasks: subtasksByTask.get(row.id) ?? [],
  }));

  return {
    lists,
    tags,
    tasks,
    total: pageResult.total,
    counts: {
      today: todayResult.count ?? 0,
      upcoming: upcomingResult.count ?? 0,
      perList: Object.fromEntries(perListEntries),
      tasks: totalResult.count ?? 0,
    },
  };
}

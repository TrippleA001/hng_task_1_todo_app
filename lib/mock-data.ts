import { addDays } from "date-fns";

import { toIsoDate, today } from "./format";
import type { List, Tag, Task, Workspace } from "./types";

/**
 * Demo data that reproduces the mood board (docs/project mood board.png).
 *
 * Due dates are relative to the day it runs, so "Today" always shows 5 tasks
 * and "Upcoming" always shows 12. Counts in the sidebar are *derived* from
 * these tasks - nothing is hard-coded - which is what makes this data useful
 * for checking the selectors before the database exists.
 */

const start = today();

/** ISO date `offset` days from today (negative = overdue). */
const day = (offset: number) => toIsoDate(addDays(start, offset));

const lists: List[] = [
  { id: "list-personal", name: "Personal", color: "red" },
  { id: "list-work", name: "Work", color: "blue" },
  { id: "list-1", name: "List 1", color: "yellow" },
];

const tags: Tag[] = [
  { id: "tag-1", name: "Tag 1" },
  { id: "tag-2", name: "Tag 2" },
];

const tasks: Task[] = [
  // ------------------------------------------------------- due today (5)
  {
    id: "task-research",
    title: "Research content ideas",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(0),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-authors",
    title: "Create a database of guest authors",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(0),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-license",
    title: "Renew driver's license",
    description: "",
    done: false,
    listId: "list-personal",
    dueDate: day(0),
    tagIds: ["tag-1"],
    subtasks: [{ id: "sub-license-1", title: "Subtask", done: false }],
  },
  {
    id: "task-accountant",
    title: "Consult accountant",
    description: "",
    done: false,
    listId: "list-1",
    dueDate: day(0),
    tagIds: [],
    subtasks: [
      { id: "sub-accountant-1", title: "Gather receipts", done: false },
      { id: "sub-accountant-2", title: "List deductible expenses", done: false },
      { id: "sub-accountant-3", title: "Email accountant", done: false },
    ],
  },
  {
    id: "task-card",
    title: "Print business card",
    description: "",
    done: false,
    listId: "list-personal",
    dueDate: day(0),
    tagIds: [],
    subtasks: [],
  },

  // -------------------------------------------------------- upcoming (7)
  {
    id: "task-report",
    title: "Prepare quarterly report",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(3),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-sync",
    title: "Sync with design team",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(4),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-dentist",
    title: "Book dentist appointment",
    description: "",
    done: false,
    listId: "list-personal",
    dueDate: day(5),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-filter",
    title: "Replace kitchen filter",
    description: "",
    done: false,
    listId: "list-1",
    dueDate: day(6),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-onboarding",
    title: "Update onboarding docs",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(8),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-ink",
    title: "Order printer ink",
    description: "",
    done: false,
    listId: "list-1",
    dueDate: day(10),
    tagIds: [],
    subtasks: [],
  },
  {
    id: "task-ssl",
    title: "Renew SSL certificate",
    description: "",
    done: false,
    listId: "list-work",
    dueDate: day(14),
    tagIds: [],
    subtasks: [],
  },
];

export const demoWorkspace: Workspace = { lists, tags, tasks };

/** The task the mood board shows open in the detail panel. */
export const demoTaskId = "task-license";

/** The list the mood board's "Due date" dropdown implies as a default. */
export const demoView: string = "today";

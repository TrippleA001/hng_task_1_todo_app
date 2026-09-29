import {
  CalendarDays,
  ChevronsRight,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  Settings,
  StickyNote,
} from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import { countForList, countForView } from "@/lib/selectors";
import type { Workspace } from "@/lib/types";

import { Chip } from "./Chip";
import { SearchBox } from "./SearchBox";
import { SidebarRow } from "./SidebarRow";
import { SidebarSection } from "./SidebarSection";
import { Swatch } from "./Swatch";

/**
 * The left column: menu header, search, the TASKS / LISTS / TAGS groups and the
 * Settings / Sign out footer.
 *
 * Counts come from lib/selectors so they cannot drift from the task list.
 */
export function Sidebar({
  workspace,
  activeView,
}: {
  workspace: Workspace;
  activeView: string;
}) {
  return (
    <>
      <header className="flex items-center justify-between px-2 pb-4">
        <h1 className="text-[19px] font-bold text-ink">Menu</h1>
        <button
          type="button"
          aria-label="Toggle sidebar"
          className="text-ink transition-opacity hover:opacity-60"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </header>

      <SearchBox className="mb-6" />

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <SidebarSection title="Tasks">
          <SidebarRow
            icon={<ChevronsRight aria-hidden className="size-4" />}
            label="Upcoming"
            count={countForView(workspace, "upcoming")}
            active={activeView === "upcoming"}
            chevron
          />
          <SidebarRow
            icon={<ListTodo aria-hidden className="size-4" />}
            label="Today"
            count={countForView(workspace, "today")}
            active={activeView === "today"}
            chevron
          />
          <SidebarRow
            icon={<CalendarDays aria-hidden className="size-4" />}
            label="Calendar"
            active={activeView === "calendar"}
            chevron
          />
          <SidebarRow
            icon={<StickyNote aria-hidden className="size-4" />}
            label="Sticky Wall"
            active={activeView === "sticky"}
            chevron
          />
        </SidebarSection>

        <SidebarSection title="Lists">
          {workspace.lists.map((list) => (
            <SidebarRow
              key={list.id}
              swatch={<Swatch color={list.color} />}
              label={list.name}
              count={countForList(workspace, list.id)}
              active={activeView === `list:${list.id}`}
            />
          ))}
          <SidebarRow
            icon={<Plus aria-hidden className="size-4" />}
            label="Add New List"
          />
        </SidebarSection>

        <SidebarSection title="Tags">
          <div className="flex flex-wrap items-center gap-2 px-2 pt-1">
            {workspace.tags.map((tag) => (
              <Chip key={tag.id} tone="soft">
                {tag.name}
              </Chip>
            ))}
            <Chip tone="outline" icon={<Plus aria-hidden className="size-3" />}>
              Add Tag
            </Chip>
          </div>
        </SidebarSection>
      </nav>

      <footer className="mt-4 space-y-0.5 border-t border-line pt-4">
        <SidebarRow
          icon={<Settings aria-hidden className="size-4" />}
          label="Settings"
        />
        <form action={signOut}>
          <SidebarRow
            type="submit"
            icon={<LogOut aria-hidden className="size-4" />}
            label="Sign out"
          />
        </form>
      </footer>
    </>
  );
}

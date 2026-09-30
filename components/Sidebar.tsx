import {
  CalendarDays,
  ChevronsRight,
  ListTodo,
  LogOut,
  Settings,
  StickyNote,
} from "lucide-react";

import { signOut } from "@/lib/auth-actions";
import type { Workspace } from "@/lib/types";
import { viewHref } from "@/lib/views";

import { AddListRow } from "./AddListRow";
import { AddTagRow } from "./AddTagRow";
import { ListRow } from "./ListRow";
import { SearchBox } from "./SearchBox";
import { SidebarRow } from "./SidebarRow";
import { SidebarSection } from "./SidebarSection";
import { TagChip } from "./TagChip";

/**
 * The left column: menu header, search, the TASKS / LISTS / TAGS groups and the
 * Settings / Sign out footer.
 *
 * Counts arrive as SQL head-count totals from the page (not derived from the
 * 20-row task page), so the badges show true totals even when the visible
 * list is paged. Every view row is a real link to `/?view=...` so navigation
 * works with plain HTML (back button, reload, open in new tab).
 */
export function Sidebar({
  workspace,
  counts,
  activeView,
  query = "",
}: {
  workspace: Workspace;
  counts: { today: number; upcoming: number; perList: Record<string, number> };
  activeView: string;
  query?: string;
}) {
  return (
    <>
      <header className="flex items-center justify-between px-2 pb-4">
        <h1 className="text-[19px] font-bold text-ink">Menu</h1>
      </header>

      <SearchBox className="mb-6" view={activeView} query={query} />

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <SidebarSection title="Tasks">
          <SidebarRow
            icon={<ChevronsRight aria-hidden className="size-4" />}
            label="Upcoming"
            count={counts.upcoming}
            active={activeView === "upcoming"}
            href={viewHref("upcoming", query)}
            chevron
          />
          <SidebarRow
            icon={<ListTodo aria-hidden className="size-4" />}
            label="Today"
            count={counts.today}
            active={activeView === "today"}
            href={viewHref("today", query)}
            chevron
          />
          <SidebarRow
            icon={<CalendarDays aria-hidden className="size-4" />}
            label="Calendar"
            active={activeView === "calendar"}
            href={viewHref("calendar", query)}
            chevron
          />
          <SidebarRow
            icon={<StickyNote aria-hidden className="size-4" />}
            label="Sticky Wall"
            active={activeView === "sticky"}
            href={viewHref("sticky", query)}
            chevron
          />
        </SidebarSection>

        <SidebarSection title="Lists">
          {workspace.lists.map((list) => (
            <ListRow
              key={list.id}
              id={list.id}
              name={list.name}
              color={list.color}
              count={counts.perList[list.id] ?? 0}
              active={activeView === `list:${list.id}`}
              href={viewHref(`list:${list.id}`, query)}
            />
          ))}
          <AddListRow />
        </SidebarSection>

        <SidebarSection title="Tags">
          <div className="flex flex-wrap items-center gap-1.5 px-2 pt-1">
            {workspace.tags.map((tag) => (
              <TagChip key={tag.id} id={tag.id} name={tag.name} />
            ))}
            <AddTagRow />
          </div>
        </SidebarSection>
      </nav>

      <footer className="mt-4 space-y-0.5 border-t border-line pt-4">
        <SidebarRow
          icon={<Settings aria-hidden className="size-4" />}
          label="Settings"
          active={activeView === "settings"}
          href={viewHref("settings", query)}
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

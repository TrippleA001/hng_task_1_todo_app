import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { MobileSidebar } from "./MobileSidebar";

/**
 * The centred card with its three panes: sidebar, task list, detail panel.
 *
 * Responsive behaviour:
 * - `lg` and up: sidebar + list columns (the detail pane joins at `xl`).
 * - Below `lg`: one column, with the sidebar in a slide-in drawer.
 * - Below `xl`: opening a task (`detailOpen`) swaps the list for a full-screen
 *   detail pane with a Back link; at `xl` the pane is always visible instead.
 * - Below `sm` the card goes full-bleed so small screens get every pixel.
 */
export function AppShell({
  sidebar,
  main,
  detail,
  detailOpen = false,
  detailBackHref,
  overlay,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  /** True when the URL explicitly opened a task (full-screen below `xl`). */
  detailOpen?: boolean;
  /** Where the mobile Back link returns to - the current view. */
  detailBackHref?: string;
  /** Fixed layer above the card - the onboarding walkthrough uses it. */
  overlay?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center p-0 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1240px]">
        <div className="flex min-h-screen flex-col overflow-hidden bg-card sm:min-h-[calc(100vh-2rem)] sm:rounded-[20px] sm:shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)] lg:min-h-[calc(100vh-3rem)]">
          <MobileSidebar>{sidebar}</MobileSidebar>

          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-[250px] shrink-0 flex-col bg-sidebar px-4 py-6 lg:flex xl:w-[280px]">
              {sidebar}
            </aside>

            <main
              className={`min-w-0 flex-1 flex-col bg-card px-4 py-6 sm:px-6 lg:px-8 ${
                detailOpen ? "hidden xl:flex" : "flex"
              }`}
            >
              {main}
            </main>

            <aside
              className={`min-w-0 shrink-0 flex-col bg-panel px-4 py-6 sm:px-6 xl:flex xl:w-[340px] xl:border-l xl:border-line 2xl:w-[400px] ${
                detailOpen ? "flex w-full" : "hidden"
              }`}
            >
              {detailBackHref && (
                <Link
                  href={detailBackHref}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink xl:hidden"
                >
                  <ArrowLeft aria-hidden className="size-4" />
                  Back
                </Link>
              )}
              {detail}
            </aside>
          </div>
        </div>

        {overlay}
      </div>
    </div>
  );
}

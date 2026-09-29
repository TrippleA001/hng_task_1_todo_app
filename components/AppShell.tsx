import type { ReactNode } from "react";

import { ProBadge } from "./ProBadge";

/**
 * The centred card with its three panes: sidebar, task list, detail panel.
 *
 * The card is card-width but not clipped, so the Pro badge can overhang the top
 * edge the way the mood board shows it; the inner element does the clipping.
 */
export function AppShell({
  sidebar,
  main,
  detail,
}: {
  sidebar: ReactNode;
  main: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="flex min-h-screen justify-center p-6">
      <div className="relative w-full max-w-[1240px]">
        <ProBadge className="absolute -top-7 right-8" />
        <div className="flex min-h-[calc(100vh-3rem)] overflow-hidden rounded-[20px] bg-card shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)]">
          <aside className="flex w-[250px] shrink-0 flex-col bg-sidebar px-4 py-6">
            {sidebar}
          </aside>
          <main className="flex min-w-0 flex-1 flex-col bg-card px-8 py-6">
            {main}
          </main>
          <aside className="flex w-[340px] shrink-0 flex-col bg-panel px-6 py-6">
            {detail}
          </aside>
        </div>
      </div>
    </div>
  );
}

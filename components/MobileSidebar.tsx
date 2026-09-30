"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

/**
 * The mobile hamburger and its slide-in drawer.
 *
 * Below `lg` the sidebar column is hidden, so this renders a slim top bar with a
 * real menu button and reuses the *same* server-rendered Sidebar as drawer
 * content - the desktop column and the drawer are one React node rendered twice,
 * so they can never drift apart.
 */
export function MobileSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Navigating closes the drawer: any click that lands on a link (sidebar rows,
  // settings, sign out) should take the user straight to the content instead of
  // making them hunt for the X first. Buttons - the close control itself, inline
  // rename forms, the add rows - keep the drawer open.
  const handleDrawerClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
  };

  return (
    <>
      <div className="border-b border-line bg-sidebar px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex items-center gap-2 text-[15px] font-bold text-ink"
        >
          <Menu aria-hidden className="size-5" />
          Menu
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-label="Menu"
            onClick={handleDrawerClick}
            className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto bg-sidebar px-4 py-6 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-ink transition-opacity hover:opacity-60"
            >
              <X aria-hidden className="size-5" />
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
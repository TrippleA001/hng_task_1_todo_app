import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** TASKS / LISTS / TAGS grouping in the sidebar. */
export function SidebarSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-0.5", className)}>
      <h2 className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

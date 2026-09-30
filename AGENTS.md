<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Tasks (to_do_list_task_1_v2) — project rules for agents

A task manager built from the mood board in `docs/project mood board.png`:
three-pane layout (sidebar, task list, detail panel) with lists, tags,
subtasks and due dates. Keep the Next.js block above verbatim — `next dev`
re-adds it if removed.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres + Auth, `@supabase/ssr` 0.12.7) · `date-fns` ·
`lucide-react` · deployed on Vercel from this directory (repo root).

## Commands and gates

- `npm install`, `npm run dev` (http://localhost:3000), `npm run build`,
  `npm run lint`.
- No test suite exists. The gate is **lint clean + build green (TypeScript)**,
  then a dev-server smoke check (`/login` → 200, `/` unauthenticated → 307
  to `/login`).
- `.env.local` must exist first or every page fails at the Supabase env check.
- Dev-server logs go to `dev*.log`, which is git-ignored — never commit them,
  and stop background servers when done (port 3000).

## Architecture

- **URL-driven shell:** `?view=` picks the view (`today`, `upcoming`,
  `calendar`, `sticky`, `settings`, `list:<id>`), `?task=` opens the detail
  panel, `?q=` filters by title, `?month=` navigates the calendar. Sidebar
  rows and pagination are real links — shareable screens, working back button.
  View helpers live in `lib/views.ts`.
- **Data seam:** `lib/data.ts` is the only read path (`getWorkspace`,
  onboarding state); `lib/actions/` (tasks, lists, tags, subtasks,
  onboarding, settings) is the only write path. **Components never import a
  Supabase client** — they receive a `Workspace` and pure selectors from
  `lib/selectors.ts` compute counts, so the sidebar/list/panel can't disagree.
- **Server Actions** use `useActionState` shapes: `(previous, formData)` for
  form actions, `void`-returning for `<form action={...}>` toggles. Results
  follow the `ActionResult` type in `lib/actions/result.ts`.
- **Auth is defense-in-depth:** the proxy (`proxy.ts`, Next 16 middleware API)
  only refreshes sessions and redirects — it is NOT the security boundary.
  Every read/write re-checks via `requireUser()` (`lib/auth.ts`) AND is scoped
  by RLS owner-only policies (`(select auth.uid()) = user_id`) in
  `0002_rls.sql`.
- **Reviewer access:** `/login` has a "Continue as demo reviewer" button backed
  by server-only `DEMO_EMAIL` / `DEMO_PASSWORD` (no `NEXT_PUBLIC_` prefix).
  Auth, onboarding walkthrough, and RLS stay intact for everyone.
- **Design tokens** live in `@theme` in `app/globals.css` (`bg-card`,
  `text-muted`, `bg-accent`, swatches…). Add colours there, never as arbitrary
  hex in components. Headings Poppins, body Inter (via `next/font`).

## Conventions

- Server Components by default; `"use client"` only where interaction demands
  it (forms, walkthrough, drawer, editors).
- No `setState` inside effects (enforced by lint) — close editors in action
  callbacks, reconcile optimistic state via transition results.
- Domain types in `lib/types.ts` stay in step with the SQL schema.
- Dates are `dd-MM-yy` (`lib/format.ts`); Today includes overdue tasks and
  overdue dates render a danger chip. New tasks append via
  `max(position) + 1`, never `count`.
- Deleting a list cascades to its tasks — confirm in the UI first.

## Repo map

- `app/` — layout, URL-driven page, `loading` + `error`, `login/`, globals.
- `components/` — `AppShell`, `MobileSidebar`, `Sidebar` + rows, `TaskList`,
  `TaskRow`, `TaskDetailPanel`, `OnboardingWalkthrough`, `SettingsPanel`,
  `CalendarView`, `StickyWall`, primitives (`Button`, `Chip`, `Checkbox`…).
- `lib/` — `types`, `selectors`, `views`, `format`, `data`, `auth`,
  `auth-actions`, `actions/`, `db/` (workspace fetch, demo wipe), `supabase/`.
- `supabase/migrations/` — applied by pasting into the Supabase SQL editor
  **in numeric order**: `0001` schema → `0002` RLS → `0003` per-account seed →
  `0004` onboarding + `is_seeded` flags → `0005` restore-safe seeder.
- `docs/` — the mood board (the visual spec).

## Environment

`.env.local` (git-ignored) plus Vercel project env vars:

```text
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DEMO_EMAIL=...            # server-only: reviewer one-click sign-in
DEMO_PASSWORD=...         # server-only
```

Never put the secret/`service_role` key in a `NEXT_PUBLIC_*` variable.
Supabase dashboard: Email provider on, "Confirm email" off for dev, Site URL
+ redirect allow-list must include the Vercel domain or logins fail.

## Status and roadmap

Done: scaffold + mood-board shell (responsive: drawer below `lg`,
full-screen detail below `xl`), schema/RLS/seed, auth + demo sign-in,
Postgres reads, all mutations (tasks/subtasks/lists/tags), URL-driven views,
walkthrough with skip + demo wipe-or-keep choice, Settings (clear/restore
demo), search, overdue handling, loading skeleton, error boundary, Calendar,
Sticky Wall, drawer auto-close on navigation.

Outstanding (parked, in order): add-task auto-opens its detail panel ·
optimistic toggles + toast on failure · drag-to-reorder in list views ·
20-per-page pagination with server-side search/counts · calendar 3-chips/day
cap · scoped fetching so page weight stops growing with history.

## Verification checklist for the next agent

1. `npm run lint` clean, `npm run build` green.
2. Fresh dev server: `/login` 200 (demo button + tabs present), `/` → 307.
3. Sign in as demo: workspace renders, add/toggle/edit/delete persist across
   refresh, counts agree across sidebar/list/panel.
4. Walkthrough only on first login; skip finishes onboarding, final choice
   wipes (`is_seeded` rows only) or keeps demo.
5. Settings clear → restore round-trips without duplicates.
6. Commit on `main`, push only when asked — Vercel deploys on push.

# Tasks

A task manager built from the mood board in [`docs/project mood board.png`](docs/project%20mood%20board.png):
a three-pane layout with lists, tags, subtasks and due dates.

Stack: **Next.js 16** (App Router) · **TypeScript** · **Tailwind CSS v4** ·
**Supabase** (Postgres + Auth) · deployed on **Vercel**.

## Getting started

```bash
npm install
npm run dev                # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`.

`.env.local` must exist first (see "Environment" below) — without it every page
fails at the Supabase env check with a message naming the missing variable.

## Environment

`.env.local` (git-ignored) needs two values from your Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key is meant to be public — it ships to the browser, and Row
Level Security is what protects the data. **Never** put the
secret/`service_role` key in a `NEXT_PUBLIC_*` variable.

## Database

Migrations live in [`supabase/migrations`](supabase/migrations) and are applied
by pasting them into the Supabase SQL editor, in numeric order. See
[`supabase/README.md`](supabase/README.md) for the full setup, including the
dashboard settings (Email provider, redirect URLs) that are easy to forget.

| File | Purpose |
| --- | --- |
| `0001_schema.sql` | Tables, indexes, `updated_at` / `completed_at` triggers |
| `0002_rls.sql` | RLS enabled, one owner-only policy per table |
| `0003_seed_on_signup.sql` | Seeds the mood board's demo data for each new account |
| `0004_onboarding.sql` | `user_settings` (onboarding gate), `is_seeded` flags, hardened seeder |

RLS is the security boundary, not the key: every table is owned via `user_id`
and the policy on each is `(select auth.uid()) = user_id` for all operations.

## Layout

```
app/            layout, page (URL-driven shell), loading + error, login, globals.css
components/     AppShell, MobileSidebar, Sidebar + rows, TaskList, TaskRow,
                TaskDetailPanel, OnboardingWalkthrough, SettingsPanel, primitives
lib/
  types.ts      domain types - keep in step with the SQL schema
  selectors.ts  pure derived reads (view filters, sidebar counts, view titles)
  views.ts      URL <-> view helpers (normalizeView, viewHref, taskHref)
  format.ts     dd-MM-yy date formatting and due-date comparisons
  data.ts       the single seam between UI and data (plus onboarding state)
  actions/      Server Actions: tasks, lists, tags, onboarding, settings
  db/           query helpers: workspace fetch, demo wipe
  auth.ts       requireUser() - the real auth gate
proxy.ts        session refresh + login redirects (Next 16 middleware API)
supabase/       migrations + setup notes
docs/           the mood board
```

Two rules keep this maintainable:

- **Components never talk to the database.** They receive a `Workspace` and pure
  selectors compute the counts, so the sidebar, task list and detail panel can
  never disagree about the same task.
- **`lib/data.ts` and `lib/actions/` are the only data paths.** Reads come from
  the first, writes from the second; no component imports a Supabase client.

## Conventions

- Server Components by default; `"use client"` only where interaction demands it.
- Design tokens live in `@theme` in `app/globals.css` — add colours there, not as
  arbitrary hex values in components.
- Headings use Poppins, body text Inter (both via `next/font`).

## Deploying

1. Push the repo to GitHub.
2. Import it in Vercel; the root directory is the repo root (this app).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as
   project environment variables.
4. In Supabase → Authentication → URL Configuration, set the Site URL to the
   Vercel domain and add `https://<domain>/**` to the redirect allow-list,
   otherwise login redirects fail with "invalid redirect URL".

## Status

Done:

- Next.js scaffold, design tokens and the three-pane shell from the mood board,
  responsive: sidebar in a drawer below `lg`, detail pane full-screen below `xl`
- Supabase schema, RLS and the per-account demo seed (`supabase/migrations`)
- Auth: sign in / sign up / sign out, session refresh in `proxy.ts`, and a
  server-side `requireUser()` gate that does not trust the proxy
- Reads wired to Postgres, and mutations through Server Actions: create task,
  toggle a task or subtask, save changes (title, description, list, due date,
  tags), delete a task, create a list, create a tag
- URL-driven views: `?view=` picks the view, `?task=` opens the detail panel,
  `?q=` filters by title — shareable screens and a working back button
- First-run walkthrough ending in "Ready to start adding your own tasks?":
  yes wipes the demo workspace (`is_seeded` rows only), no keeps it
- Settings view: account, sign out, clear / restore the demo workspace
- Search, overdue highlighting (Today includes overdue tasks), a route loading
  skeleton, and an error boundary that surfaces real failure messages
- Calendar month grid with `?month=` link navigation, and the Sticky Wall
  notes view

Outstanding:

- Toggle failures are logged server-side rather than shown in the UI, so a failed
  checkbox silently reverts - the reason to reach for optimistic UI plus a toast
- Task reordering


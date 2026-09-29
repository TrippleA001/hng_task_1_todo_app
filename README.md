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

`.env.local` must exist first (see "Environment" below) — without it the app
still renders the demo shell, but nothing that talks to Supabase will work.

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

RLS is the security boundary, not the key: every table is owned via `user_id`
and the policy on each is `(select auth.uid()) = user_id` for all operations.

## Layout

```
app/            layout, page (the three-pane shell), globals.css (design tokens)
components/     AppShell, Sidebar*, TaskList, TaskRow, TaskDetailPanel, primitives
lib/
  types.ts      domain types - keep in step with the SQL schema
  selectors.ts  pure derived reads (view filters, sidebar counts, view titles)
  format.ts     dd-MM-yy date formatting and due-date comparisons
  data.ts       the single seam between UI and data
  mock-data.ts  demo workspace reproducing the mood board
supabase/       migrations + setup notes
docs/           the mood board
```

Two rules keep this maintainable:

- **Components never talk to the database.** They receive a `Workspace` and pure
  selectors compute the counts, so the sidebar, task list and detail panel can
  never disagree about the same task.
- **`lib/data.ts` is the only data seam.** Its current demo-data body gets
  replaced by Supabase queries without callers changing.

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

- Next.js scaffold, design tokens and the three-pane shell from the mood board
- Supabase schema, RLS and the per-account demo seed (`supabase/migrations`)
- Auth: sign in / sign up / sign out, session refresh in `proxy.ts`, and a
  server-side `requireUser()` gate that does not trust the proxy
- Reads wired to Postgres, and mutations through Server Actions: create task,
  toggle a task or subtask, save changes (title, description, list, due date,
  tags), delete a task

Outstanding:

- The sidebar is still fixed on Today; making views URL-driven (`/today`,
  `/upcoming`, `/list/<id>`) is the next step
- Calendar and Sticky Wall views, and Settings
- Creating lists and tags from the sidebar ("Add New List" / "Add Tag")
- Loading, empty and error states; optimistic toggles; task reordering; search
- Toggle failures are logged server-side rather than shown in the UI, so a failed
  checkbox silently reverts - the reason to reach for optimistic UI plus a toast


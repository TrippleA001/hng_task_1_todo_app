# Supabase setup

## 1. Apply the migrations

Paste each file into the Supabase dashboard's **SQL editor** and run it, in this
order — they depend on each other:

| Order | File | What it does |
| --- | --- | --- |
| 1 | `migrations/0001_schema.sql` | Tables, indexes, `updated_at` and `completed_at` triggers |
| 2 | `migrations/0002_rls.sql` | Enables RLS and adds one owner-only policy per table |
| 3 | `migrations/0003_seed_on_signup.sql` | Seeds the mood board's demo data for each new account |
| 4 | `migrations/0004_onboarding.sql` | `user_settings` (onboarding gate), `is_seeded` demo flags, hardened seeder |

All four are re-runnable (they use `create table if not exists`,
`create or replace`, and `drop ... if exists` before each trigger/policy), so
running one twice is harmless.

## 2. Check the dashboard settings

- **Authentication → Providers → Email:** enabled. For local development, turn
  **Confirm email** off, otherwise every signup has to click a link before it can
  log in. Turn it back on before going live.
- **Authentication → URL Configuration:**
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/**`
  - Add `https://<your-vercel-domain>/**` after the first deploy.

## 3. Environment

`.env.local` (git-ignored) holds:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The publishable key is designed to be public — it ships to the browser, and RLS
is what actually protects the data. The **secret/service_role key must never**
go into a `NEXT_PUBLIC_*` variable or any client component.

## Verifying RLS actually works

After signing in, the browser holds a real session. Two accounts should never
see each other's rows. The quickest check is to run this **as an authenticated
user** via the app's query layer rather than the SQL editor (the SQL editor runs
as `postgres` and bypasses RLS, which makes it useless for testing policies).

## Back-filling an existing account

Accounts created before `0003` ran have no data. Give one a workspace with:

```sql
select public.seed_demo_workspace_for_user('<user-uuid>');
```

Find the id under **Authentication → Users**.

## Decisions worth knowing

- **`tasks.list_id` is `not null` and `on delete cascade`.** The UI has no
  "listless task" state, so deleting a list deletes its tasks rather than
  orphaning them. If you would rather keep the tasks, change it to
  `on delete set null`, make `list_id` nullable, and update `Task.listId` in
  `lib/types.ts` to `string | null`.
- **Deletes cascade down the tree:** list → tasks → subtasks and task_tags.
  Deleting a task never leaves orphaned subtasks behind.
- **`task_tags.user_id` is denormalised** so the RLS policy stays a flat
  ownership check instead of a sub-query against `tasks`.

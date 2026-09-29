-- 0002_rls.sql
-- Row Level Security: the publishable key ships to the browser, so RLS is the
-- only thing standing between one user's tasks and another's. Run this straight
-- after 0001_schema.sql.
--
-- Every table gets a single FOR ALL policy with both USING and WITH CHECK, so a
-- row can only be read or written by the user that owns it. auth.uid() is
-- wrapped in a sub-select because Supabase's planner then evaluates it once per
-- statement instead of once per row.

alter table public.lists     enable row level security;
alter table public.tags      enable row level security;
alter table public.tasks     enable row level security;
alter table public.task_tags enable row level security;
alter table public.subtasks  enable row level security;

-- ------------------------------------------------------------------- lists

drop policy if exists "Users manage their own lists" on public.lists;
create policy "Users manage their own lists"
  on public.lists
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -------------------------------------------------------------------- tags

drop policy if exists "Users manage their own tags" on public.tags;
create policy "Users manage their own tags"
  on public.tags
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------- tasks

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks"
  on public.tasks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- --------------------------------------------------------------- task_tags

drop policy if exists "Users manage their own task tags" on public.task_tags;
create policy "Users manage their own task tags"
  on public.task_tags
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- subtasks

drop policy if exists "Users manage their own subtasks" on public.subtasks;
create policy "Users manage their own subtasks"
  on public.subtasks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

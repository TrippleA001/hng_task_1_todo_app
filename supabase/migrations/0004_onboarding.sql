-- 0004_onboarding.sql
-- First-run walkthrough + demo-data cleanup. Run after 0003_seed_on_signup.sql.
--
-- Two things are added:
--   * public.user_settings - one row per account holding `onboarded_at`. Null
--     (or no row at all) means "the walkthrough still needs to run", which is
--     exactly the gate the UI wants - no client-side flag that would differ
--     between devices or browsers.
--   * is_seeded on lists/tags/tasks - so "wipe the demo workspace" deletes
--     precisely the rows 0003 created and never a row the user wrote.

-- ------------------------------------------------------------ is_seeded flag

alter table public.lists add column if not exists is_seeded boolean not null default false;
alter table public.tags  add column if not exists is_seeded boolean not null default false;
alter table public.tasks add column if not exists is_seeded boolean not null default false;

-- Backfill the rows 0003 created before the flag existed. This matches the
-- exact demo content rather than "every existing row", so a task someone has
-- already written by hand survives the cleanup. Re-running is harmless: the
-- rows are already flagged.
update public.lists
   set is_seeded = true
 where name in ('Personal', 'Work', 'List 1');

update public.tags
   set is_seeded = true
 where name in ('Tag 1', 'Tag 2');

update public.tasks
   set is_seeded = true
 where title in (
   'Research content ideas',
   'Create a database of guest authors',
   'Print business card',
   'Renew driver''s license',
   'Consult accountant',
   'Prepare quarterly report',
   'Sync with design team',
   'Book dentist appointment',
   'Replace kitchen filter',
   'Update onboarding docs',
   'Order printer ink',
   'Renew SSL certificate'
 );

-- ------------------------------------------------------------- user_settings

create table if not exists public.user_settings (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings"
  on public.user_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- --------------------------------------------------- flag rows from the seed

-- 0003's seed function is left untouched; stamping the rows it just inserted
-- keeps this change in one place and keeps working if the seed grows later.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_demo_workspace_for_user(new.id);

  update public.lists set is_seeded = true where user_id = new.id;
  update public.tags  set is_seeded = true where user_id = new.id;
  update public.tasks set is_seeded = true where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed on auth.users;
create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------ harden the seeder

-- 0003's seeder is SECURITY DEFINER with no ownership check, so any caller who
-- could reach it would write rows into another account's workspace. Re-create
-- it with a guard: the signup trigger runs outside a user session
-- (auth.uid() is null) and passes, while a signed-in caller can only ever seed
-- their own workspace - which is the only path the app uses (Settings ->
-- "Restore demo tasks"). The signature is unchanged, so the trigger keeps
-- working.
create or replace function public.seed_demo_workspace_for_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  personal   uuid;
  work       uuid;
  list_one   uuid;
  tag_one    uuid;
  license    uuid;
  accountant uuid;
begin
  if auth.uid() is not null and target_user <> auth.uid() then
    raise exception 'You can only seed your own workspace';
  end if;

  -- Three lists, matching the mood board's swatches.
  insert into public.lists (user_id, name, color, position)
  values (target_user, 'Personal', 'red', 0) returning id into personal;

  insert into public.lists (user_id, name, color, position)
  values (target_user, 'Work', 'blue', 1) returning id into work;

  insert into public.lists (user_id, name, color, position)
  values (target_user, 'List 1', 'yellow', 2) returning id into list_one;

  insert into public.tags (user_id, name)
  values (target_user, 'Tag 1') returning id into tag_one;

  insert into public.tags (user_id, name) values (target_user, 'Tag 2');

  -- ---------------------------------------------------- tasks due today (5)
  insert into public.tasks (user_id, list_id, title, due_date, position)
  values
    (target_user, work, 'Research content ideas', current_date, 0),
    (target_user, work, 'Create a database of guest authors', current_date, 1),
    (target_user, personal, 'Print business card', current_date, 4);

  insert into public.tasks (user_id, list_id, title, due_date, position)
  values (target_user, personal, 'Renew driver''s license', current_date, 2)
  returning id into license;

  insert into public.tasks (user_id, list_id, title, due_date, position)
  values (target_user, list_one, 'Consult accountant', current_date, 3)
  returning id into accountant;

  -- The one subtask and one tag the mood board shows on this task.
  insert into public.subtasks (user_id, task_id, title, position)
  values (target_user, license, 'Subtask', 0);

  insert into public.task_tags (user_id, task_id, tag_id)
  values (target_user, license, tag_one);

  -- The three subtasks the mood board shows on this one.
  insert into public.subtasks (user_id, task_id, title, position)
  values
    (target_user, accountant, 'Gather receipts', 0),
    (target_user, accountant, 'List deductible expenses', 1),
    (target_user, accountant, 'Email accountant', 2);

  -- ----------------------------------------------------- upcoming tasks (7)
  insert into public.tasks (user_id, list_id, title, due_date, position)
  values
    (target_user, work, 'Prepare quarterly report', current_date + 3, 0),
    (target_user, work, 'Sync with design team', current_date + 4, 1),
    (target_user, personal, 'Book dentist appointment', current_date + 5, 0),
    (target_user, list_one, 'Replace kitchen filter', current_date + 6, 0),
    (target_user, work, 'Update onboarding docs', current_date + 8, 2),
    (target_user, list_one, 'Order printer ink', current_date + 10, 1),
    (target_user, work, 'Renew SSL certificate', current_date + 14, 3);
end;
$$;

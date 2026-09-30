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

-- 0001_schema.sql
-- Core tables for the task manager.
--
-- Apply with the Supabase SQL editor, in numeric order starting here.
-- Everything lives in the `public` schema and is owned by a user via user_id,
-- which 0002_rls.sql then locks down.

-- ---------------------------------------------------------------- updated_at

-- Keeps tasks.updated_at honest without trusting the client to send it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------- completion

-- Stamps completed_at when a task flips to done and clears it when it is
-- reopened, so "completed" ordering never depends on the client clock.
create or replace function public.sync_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.done and (old.done is distinct from new.done) then
    new.completed_at = now();
  elsif not new.done then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------------- lists

create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  color      text not null default 'blue'
             check (color in ('red', 'blue', 'yellow')),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists lists_user_position_idx
  on public.lists (user_id, position);

-- -------------------------------------------------------------------- tags

create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ------------------------------------------------------------------- tasks

-- list_id is required and cascades: the UI has no "listless task" state, so a
-- deleted list takes its tasks with it rather than orphaning them.
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  list_id      uuid not null references public.lists (id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  description  text not null default '',
  done         boolean not null default false,
  due_date     date,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tasks_user_due_date_idx
  on public.tasks (user_id, due_date);
create index if not exists tasks_user_list_idx
  on public.tasks (user_id, list_id);
create index if not exists tasks_user_done_idx
  on public.tasks (user_id, done);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_sync_completion on public.tasks;
create trigger tasks_sync_completion
  before update on public.tasks
  for each row execute function public.sync_task_completion();

-- --------------------------------------------------------------- task_tags

-- Join table for the tag chips. user_id is denormalised on purpose so the RLS
-- policy in 0002 is a simple ownership check; the composite primary key makes
-- tagging the same task twice a no-op error rather than a duplicate row.
create table if not exists public.task_tags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (task_id, tag_id)
);

create index if not exists task_tags_tag_idx on public.task_tags (tag_id);

-- ---------------------------------------------------------------- subtasks

create table if not exists public.subtasks (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null check (length(trim(title)) > 0),
  done       boolean not null default false,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists subtasks_task_position_idx
  on public.subtasks (task_id, position);

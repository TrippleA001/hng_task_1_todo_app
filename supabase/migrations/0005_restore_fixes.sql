-- 0005_restore_fixes.sql
-- Makes "Restore demo tasks" reliable. Run after 0004_onboarding.sql.
--
-- 0004's copy of the seeder had two problems that only surfaced on restore:
--
--   1. It did not stamp is_seeded on the rows it inserted. Restored demo data
--      therefore could not be cleared again, and the restore guard could not
--      see what was already present - a second restore duplicated everything.
--   2. It blindly inserted three lists and two tags. After a clear that kept a
--      seeded list (because the user had put their own tasks in it), restoring
--      produced duplicate lists with the same name.
--
-- The function below reuses an existing list/tag of the same name when the
-- workspace already has one and flags everything it creates as seeded, which
-- also makes a restore idempotent. Signature and ownership guard are unchanged,
-- so the signup trigger and the Settings action keep working. handle_new_user's
-- blanket stamp stays: at signup every row is the seeder's.

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

  -- Three lists, matching the mood board's swatches. An existing list with the
  -- same name wins over a new one (a demo list a clear kept because user tasks
  -- live in it, or a list the user made themselves) so a restore never
  -- duplicates names.
  select id into personal
    from public.lists
   where user_id = target_user and name = 'Personal'
   limit 1;
  if personal is null then
    insert into public.lists (user_id, name, color, position, is_seeded)
    values (target_user, 'Personal', 'red', 0)
    returning id into personal;
  end if;

  select id into work
    from public.lists
   where user_id = target_user and name = 'Work'
   limit 1;
  if work is null then
    insert into public.lists (user_id, name, color, position, is_seeded)
    values (target_user, 'Work', 'blue', 1)
    returning id into work;
  end if;

  select id into list_one
    from public.lists
   where user_id = target_user and name = 'List 1'
   limit 1;
  if list_one is null then
    insert into public.lists (user_id, name, color, position, is_seeded)
    values (target_user, 'List 1', 'yellow', 2)
    returning id into list_one;
  end if;

  select id into tag_one
    from public.tags
   where user_id = target_user and name = 'Tag 1'
   limit 1;
  if tag_one is null then
    insert into public.tags (user_id, name, is_seeded)
    values (target_user, 'Tag 1')
    returning id into tag_one;
  end if;

  if not exists (
    select 1 from public.tags where user_id = target_user and name = 'Tag 2'
  ) then
    insert into public.tags (user_id, name, is_seeded)
    values (target_user, 'Tag 2');
  end if;

  -- ---------------------------------------------------- tasks due today (5)
  insert into public.tasks (user_id, list_id, title, due_date, position, is_seeded)
  values
    (target_user, work, 'Research content ideas', current_date, 0, true),
    (target_user, work, 'Create a database of guest authors', current_date, 1, true),
    (target_user, personal, 'Print business card', current_date, 4, true);

  insert into public.tasks (user_id, list_id, title, due_date, position, is_seeded)
  values (target_user, personal, 'Renew driver''s license', current_date, 2, true)
  returning id into license;

  insert into public.tasks (user_id, list_id, title, due_date, position, is_seeded)
  values (target_user, list_one, 'Consult accountant', current_date, 3, true)
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
  insert into public.tasks (user_id, list_id, title, due_date, position, is_seeded)
  values
    (target_user, work, 'Prepare quarterly report', current_date + 3, 0, true),
    (target_user, work, 'Sync with design team', current_date + 4, 1, true),
    (target_user, personal, 'Book dentist appointment', current_date + 5, 0, true),
    (target_user, list_one, 'Replace kitchen filter', current_date + 6, 0, true),
    (target_user, work, 'Update onboarding docs', current_date + 8, 2, true),
    (target_user, list_one, 'Order printer ink', current_date + 10, 1, true),
    (target_user, work, 'Renew SSL certificate', current_date + 14, 3, true);
end;
$$;
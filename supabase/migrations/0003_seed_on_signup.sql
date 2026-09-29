-- 0003_seed_on_signup.sql
-- Gives every new account the demo workspace shown in the mood board, so the
-- app is never an empty shell on first sign-in. Run after 0002_rls.sql.
--
-- The work lives in seed_demo_workspace_for_user(uuid) rather than in the
-- trigger itself, so an existing account can be back-filled with:
--   select public.seed_demo_workspace_for_user('<user-uuid>');

create or replace function public.seed_demo_workspace_for_user(target_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  personal  uuid;
  work      uuid;
  list_one  uuid;
  tag_one   uuid;
  license   uuid;
  accountant uuid;
begin
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

-- ---------------------------------------------------------- signup trigger

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_demo_workspace_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed on auth.users;
create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.handle_new_user();

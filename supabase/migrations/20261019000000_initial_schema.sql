-- Delux production foundation.
-- Apply in the Supabase SQL Editor or with the Supabase CLI.
-- No service_role key belongs in the browser.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  avatar_url text,
  timezone text not null default 'America/Sao_Paulo',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_days text[] not null default array['seg','ter','qua','qui','sex'],
  daily_available_minutes integer not null default 30 check (daily_available_minutes between 5 and 1440),
  preferred_time text not null default 'morning' check (preferred_time in ('morning','afternoon','evening','flexible')),
  notification_preferences jsonb not null default '{"missions_reminders":true,"weekly_digest":true,"achievement_alerts":true,"daily_start_reminder":true}'::jsonb,
  assistant_response_style text not null default 'progressive' check (assistant_response_style in ('direct','detailed','progressive')),
  updated_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 240),
  description text not null default '',
  category text not null default 'personal_dev',
  desired_outcome text not null default '',
  current_state text not null default '',
  target_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'active' check (status in ('draft','active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists goals_user_status_idx on public.goals(user_id, status);

create table if not exists public.goal_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null unique references public.goals(id) on delete cascade,
  current_situation text not null default '',
  obstacles text[] not null default '{}',
  available_resources text[] not null default '{}',
  constraints text not null default '',
  answers jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  success_criteria text not null default '',
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists goal_steps_goal_position_idx on public.goal_steps(goal_id, position);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  goal_step_id uuid references public.goal_steps(id) on delete set null,
  title text not null,
  instructions text not null default '',
  estimated_minutes integer not null default 30 check (estimated_minutes between 1 and 1440),
  scheduled_date date,
  scheduled_time time,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','postponed','cancelled')),
  position integer not null default 0,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists missions_user_date_idx on public.missions(user_id, scheduled_date, status);
create index if not exists missions_goal_idx on public.missions(goal_id);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_events_user_created_idx on public.activity_events(user_id, created_at desc);

create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists assistant_messages_conversation_idx on public.assistant_messages(conversation_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system' check (type in ('reminder','milestone','routine','system')),
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

-- Create the public profile when Supabase Auth creates a user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  insert into public.preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable RLS on every user-owned table. Ownership is determined by the
-- authenticated JWT subject, never by a client-supplied user_id.
alter table public.profiles enable row level security;
drop policy if exists owner_select on public.profiles;
drop policy if exists owner_insert on public.profiles;
drop policy if exists owner_update on public.profiles;
drop policy if exists owner_delete on public.profiles;
create policy owner_select on public.profiles for select to authenticated using (auth.uid() = id);
create policy owner_insert on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy owner_update on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy owner_delete on public.profiles for delete to authenticated using (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array['preferences','goals','goal_diagnostics','goal_steps','missions','activity_events','assistant_conversations','assistant_messages','notifications']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_select on public.%I', t);
    execute format('drop policy if exists owner_insert on public.%I', t);
    execute format('drop policy if exists owner_update on public.%I', t);
    execute format('drop policy if exists owner_delete on public.%I', t);
    execute format('create policy owner_select on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy owner_update on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
  end loop;
end;
$$;

-- Child records must belong to a goal owned by the same authenticated user.
drop policy if exists owner_insert on public.goal_diagnostics;
drop policy if exists owner_update on public.goal_diagnostics;
create policy owner_insert on public.goal_diagnostics for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy owner_update on public.goal_diagnostics for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));

drop policy if exists owner_insert on public.goal_steps;
drop policy if exists owner_update on public.goal_steps;
create policy owner_insert on public.goal_steps for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy owner_update on public.goal_steps for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));

drop policy if exists owner_insert on public.missions;
drop policy if exists owner_update on public.missions;
create policy owner_insert on public.missions for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  and (goal_step_id is null or exists (select 1 from public.goal_steps s where s.id = goal_step_id and s.goal_id = missions.goal_id and s.user_id = auth.uid()))
);
create policy owner_update on public.missions for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
with check (
  auth.uid() = user_id
  and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  and (goal_step_id is null or exists (select 1 from public.goal_steps s where s.id = goal_step_id and s.goal_id = missions.goal_id and s.user_id = auth.uid()))
);

drop policy if exists owner_insert on public.activity_events;
drop policy if exists owner_update on public.activity_events;
create policy owner_insert on public.activity_events for insert to authenticated
with check (
  auth.uid() = user_id
  and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  and (mission_id is null or exists (select 1 from public.missions m where m.id = mission_id and m.user_id = auth.uid()))
);
create policy owner_update on public.activity_events for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (goal_id is null or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  and (mission_id is null or exists (select 1 from public.missions m where m.id = mission_id and m.user_id = auth.uid()))
);

-- Conversation messages can only be read/changed by their owner.
drop policy if exists owner_select on public.assistant_messages;
drop policy if exists owner_insert on public.assistant_messages;
drop policy if exists owner_update on public.assistant_messages;
drop policy if exists owner_delete on public.assistant_messages;
create policy owner_select on public.assistant_messages for select to authenticated
using (auth.uid() = user_id and exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy owner_insert on public.assistant_messages for insert to authenticated
with check (auth.uid() = user_id and exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy owner_update on public.assistant_messages for update to authenticated
using (auth.uid() = user_id and exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- updated_at maintenance
do $$
declare t text;
begin
  foreach t in array array['profiles','preferences','goals','goal_steps','missions','assistant_conversations']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

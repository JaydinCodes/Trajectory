-- Auth-owned state. This migration is additive because the earlier Supabase foundation is
-- already checked in; all date-only business values remain PostgreSQL DATE values.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  onboarding_season_id uuid references public.seasons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals
  add column if not exists metric_key text,
  add column if not exists tracking_mode text not null default 'manual' check (tracking_mode in ('manual', 'derived'));

alter table public.user_settings enable row level security;
create policy "own user settings" on public.user_settings
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_profile_and_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_and_settings();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute procedure public.set_updated_at();

-- RLS alone on a child table does not prove that the supplied parent belongs to the
-- caller. These triggers close cross-user reference attacks even if a caller knows a UUID.
create or replace function public.assert_goal_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from public.seasons where id = new.season_id and user_id = new.user_id)
     or not exists (select 1 from public.life_areas where id = new.area_id and user_id = new.user_id) then
    raise exception 'Goal parent records must belong to the same user' using errcode = '42501';
  end if;
  if new.carried_from_goal_id is not null and not exists (
    select 1 from public.goals where id = new.carried_from_goal_id and user_id = new.user_id
  ) then
    raise exception 'Goal lineage must belong to the same user' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists goals_ownership on public.goals;
create trigger goals_ownership before insert or update on public.goals
  for each row execute procedure public.assert_goal_ownership();

create or replace function public.assert_goal_child_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from public.goals where id = new.goal_id and user_id = new.user_id) then
    raise exception 'Goal must belong to the same user' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists goal_updates_ownership on public.goal_updates;
create trigger goal_updates_ownership before insert or update on public.goal_updates
  for each row execute procedure public.assert_goal_child_ownership();
drop trigger if exists goal_evidence_ownership on public.goal_evidence;
create trigger goal_evidence_ownership before insert or update on public.goal_evidence
  for each row execute procedure public.assert_goal_child_ownership();

-- This is intentionally a narrow transactional RPC: TypeScript retains trajectory calculations.
create or replace function public.complete_onboarding(input jsonb)
returns table (season_id uuid, already_completed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid := auth.uid();
  created_season uuid;
  area_item jsonb;
  goal_item jsonb;
  area_uuid uuid;
  area_name text;
begin
  if owner is null then raise exception 'Authentication is required' using errcode = '42501'; end if;
  if coalesce((select onboarding_completed from public.user_settings where user_id = owner), false) then
    return query select onboarding_season_id, true from public.user_settings where user_id = owner;
    return;
  end if;
  if exists (select 1 from public.seasons where user_id = owner) then
    raise exception 'Existing seasons cannot be replaced by onboarding';
  end if;

  insert into public.seasons (user_id, name, theme, statement, starts_on, ends_on, status, activated_at)
  values (owner, input ->> 'name', input ->> 'theme', nullif(input ->> 'intention', ''),
    (input ->> 'startDate')::date, (input ->> 'endDate')::date, 'active', now())
  returning id into created_season;

  for area_item in select value from jsonb_array_elements(coalesce(input -> 'areaPlans', '[]'::jsonb)) loop
    area_name := btrim(area_item ->> 'area');
    insert into public.life_areas (user_id, name, slug, color, weight)
    values (owner, area_name, lower(regexp_replace(area_name, '[^a-zA-Z0-9]+', '-', 'g')), '#B74E32', coalesce((area_item ->> 'priority')::numeric, 1))
    on conflict (user_id, slug) do update set name = excluded.name
    returning id into area_uuid;
    insert into public.season_area_plans (season_id, area, outcome, priority)
    values (created_season, area_name, coalesce(area_item ->> 'outcome', ''), coalesce((area_item ->> 'priority')::numeric, 1));
  end loop;

  for goal_item in select value from jsonb_array_elements(coalesce(input -> 'goals', '[]'::jsonb)) loop
    select id into area_uuid from public.life_areas
      where user_id = owner and name = goal_item ->> 'area' limit 1;
    if area_uuid is null then raise exception 'Goal area must be part of the season'; end if;
    insert into public.goals (user_id, season_id, area_id, title, goal_type, baseline, baseline_value, target, current_value, weight, deadline, status, metric_key, tracking_mode)
    values (owner, created_season, area_uuid, goal_item ->> 'title', (goal_item ->> 'goalType')::public.goal_type,
      coalesce((goal_item ->> 'baselineValue')::numeric, 0), coalesce((goal_item ->> 'baselineValue')::numeric, 0),
      (goal_item ->> 'target')::numeric, coalesce((goal_item ->> 'baselineValue')::numeric, 0),
      case goal_item ->> 'importance' when 'low' then .75 when 'high' then 1.5 when 'critical' then 2 else 1 end,
      coalesce((goal_item ->> 'deadline')::date, (input ->> 'endDate')::date), 'active', nullif(goal_item ->> 'metricKey', ''), coalesce(goal_item ->> 'trackingMode', 'manual'));
  end loop;

  insert into public.user_settings (user_id, onboarding_completed, onboarding_completed_at, onboarding_season_id)
  values (owner, true, now(), created_season)
  on conflict (user_id) do update set onboarding_completed = true, onboarding_completed_at = excluded.onboarding_completed_at, onboarding_season_id = excluded.onboarding_season_id;
  return query select created_season, false;
end;
$$;

revoke all on function public.complete_onboarding(jsonb) from public, anon;
grant execute on function public.complete_onboarding(jsonb) to authenticated;

create index if not exists user_settings_onboarding_idx on public.user_settings(user_id, onboarding_completed);
create index if not exists goals_user_deadline_idx on public.goals(user_id, deadline);
create index if not exists goal_evidence_user_goal_idx on public.goal_evidence(user_id, goal_id);

-- Make the intended API surface explicit. RLS remains the authorization boundary.
revoke all on public.profiles, public.life_areas, public.seasons, public.goals, public.goal_updates,
  public.goal_evidence, public.daily_entries, public.deep_work_entries, public.journal_entries,
  public.milestones, public.weekly_reviews, public.season_reviews, public.season_area_plans,
  public.season_planning_lessons, public.life_directions, public.direction_versions, public.horizons,
  public.horizon_outcomes, public.user_settings from anon;
grant select, insert, update, delete on public.profiles, public.life_areas, public.seasons, public.goals,
  public.goal_updates, public.goal_evidence, public.daily_entries, public.deep_work_entries,
  public.journal_entries, public.milestones, public.weekly_reviews, public.season_reviews,
  public.season_area_plans, public.season_planning_lessons, public.life_directions,
  public.direction_versions, public.horizons, public.horizon_outcomes, public.user_settings to authenticated;

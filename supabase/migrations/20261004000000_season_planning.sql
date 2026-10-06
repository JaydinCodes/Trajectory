-- Season Planning lifecycle and immutable carry-forward links.
alter table public.seasons
  add column if not exists status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  add column if not exists intention text,
  add column if not exists activated_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists previous_season_id uuid references public.seasons(id) on delete set null;

alter table public.goals
  add column if not exists baseline_value numeric not null default 0 check (baseline_value >= 0),
  add column if not exists carried_from_goal_id uuid references public.goals(id) on delete set null;

create table if not exists public.season_area_plans (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  area text not null,
  outcome text not null default '',
  priority numeric not null default 1 check (priority > 0),
  created_at timestamptz not null default now(),
  unique (season_id, area)
);

create table if not exists public.season_planning_lessons (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  kind text not null check (kind in ('carry_forward', 'leave_behind', 'lesson')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.season_area_plans enable row level security;
alter table public.season_planning_lessons enable row level security;
create policy "own season area plans" on public.season_area_plans
  using (exists (select 1 from public.seasons s where s.id = season_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.seasons s where s.id = season_id and s.user_id = auth.uid()));
create policy "own season planning lessons" on public.season_planning_lessons
  using (exists (select 1 from public.seasons s where s.id = season_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.seasons s where s.id = season_id and s.user_id = auth.uid()));

-- Existing data previously had an implicit lifecycle. Preserve the current period as active;
-- reviewed historical seasons become completed, leaving other historical records as drafts.
update public.seasons s set status = 'completed', completed_at = coalesce(s.completed_at, r.completed_at)
from public.season_reviews r where r.season_id = s.id and r.completed_at is not null;
update public.seasons set status = 'active', activated_at = coalesce(activated_at, now())
where status = 'draft' and starts_on <= current_date and ends_on >= current_date;

create index if not exists seasons_status_dates_idx on public.seasons(status, starts_on, ends_on);
create index if not exists goals_carried_from_idx on public.goals(carried_from_goal_id);

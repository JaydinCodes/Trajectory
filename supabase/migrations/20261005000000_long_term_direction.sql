-- Long-term direction is deliberately separate from season goals. Existing goals remain standalone.
create table if not exists public.life_directions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.life_areas(id) on delete cascade,
  statement text not null check (char_length(statement) <= 500),
  why text check (char_length(why) <= 1000),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, area_id)
);

create table if not exists public.direction_versions (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.life_directions(id) on delete cascade,
  statement text not null check (char_length(statement) <= 500),
  why text check (char_length(why) <= 1000),
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table if not exists public.horizons (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.life_directions(id) on delete cascade,
  name text not null,
  horizon_type text not null check (horizon_type in ('quarter', 'year', 'custom')),
  start_date date,
  end_date date,
  statement text not null check (char_length(statement) <= 500),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.horizon_outcomes (
  id uuid primary key default gen_random_uuid(),
  horizon_id uuid not null references public.horizons(id) on delete cascade,
  statement text not null check (char_length(statement) <= 500),
  position integer not null default 0 check (position >= 0)
);

alter table public.goals
  add column if not exists direction_id uuid references public.life_directions(id) on delete set null,
  add column if not exists horizon_id uuid references public.horizons(id) on delete set null;

alter table public.life_directions enable row level security;
alter table public.direction_versions enable row level security;
alter table public.horizons enable row level security;
alter table public.horizon_outcomes enable row level security;
create policy "own life directions" on public.life_directions using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own direction versions" on public.direction_versions using (exists (select 1 from public.life_directions d where d.id = direction_id and d.user_id = auth.uid())) with check (exists (select 1 from public.life_directions d where d.id = direction_id and d.user_id = auth.uid()));
create policy "own horizons" on public.horizons using (exists (select 1 from public.life_directions d where d.id = direction_id and d.user_id = auth.uid())) with check (exists (select 1 from public.life_directions d where d.id = direction_id and d.user_id = auth.uid()));
create policy "own horizon outcomes" on public.horizon_outcomes using (exists (select 1 from public.horizons h join public.life_directions d on d.id = h.direction_id where h.id = horizon_id and d.user_id = auth.uid())) with check (exists (select 1 from public.horizons h join public.life_directions d on d.id = h.direction_id where h.id = horizon_id and d.user_id = auth.uid()));

create index if not exists direction_versions_resolution_idx on public.direction_versions(direction_id, effective_from, effective_to);
create index if not exists horizons_direction_dates_idx on public.horizons(direction_id, start_date, end_date);
create index if not exists goals_direction_idx on public.goals(direction_id);
create index if not exists goals_horizon_idx on public.goals(horizon_id);

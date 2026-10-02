-- Generated review analysis remains reproducible from evidence; this stores only user-authored reflection.
alter table public.goal_updates add column if not exists status text not null default 'active';
alter table public.goal_updates add column if not exists effective_date date;
update public.goal_updates set effective_date = (recorded_at at time zone 'Africa/Johannesburg')::date where effective_date is null;
alter table public.goal_updates alter column effective_date set not null;
create table if not exists public.weekly_reviews (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,season_id uuid not null references public.seasons(id) on delete cascade,week_start date not null,week_end date not null,proud_of text not null default '',got_in_way text not null default '',lesson text not null default '',next_primary_focus text not null default '',next_secondary_focus text not null default '',completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check (week_end = week_start + 6),unique (user_id, season_id, week_start));
alter table public.weekly_reviews enable row level security;
create policy "own weekly reviews" on public.weekly_reviews using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists goal_updates_goal_effective_idx on public.goal_updates(goal_id, effective_date desc, created_at desc);
create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews(user_id, week_start desc);

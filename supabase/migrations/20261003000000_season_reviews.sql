-- User-authored retrospective notes only. Generated analysis is recalculated from dated evidence.
create table if not exists public.season_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  proud_of text not null default '',
  changed_most text not null default '',
  obstacles text not null default '',
  lesson text not null default '',
  carry_forward text not null default '',
  leave_behind text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, season_id)
);

alter table public.season_reviews enable row level security;
create policy "own season reviews" on public.season_reviews using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists season_reviews_user_season_idx on public.season_reviews(user_id, season_id);

-- Remaining user-owned source records from the SQLite product. IDs are UUIDs in Postgres;
-- repositories map them at the persistence boundary rather than leaking SQLite assumptions.

alter table public.milestones
  add column if not exists area text,
  add column if not exists note text;

alter table public.goal_evidence
  add column if not exists note text;

create table public.entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, detail text not null, amount double precision, entry_date date not null,
  area text, project text, metric_key text, created_at timestamptz not null default now()
);
create table public.journal (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null, content text not null, entry_date date not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week date not null, accomplishment text, slipped text, priority text, created_at timestamptz not null default now()
);
create table public.financial_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')), category text not null, amount numeric(15,2) not null,
  entry_date date not null, note text, area text, project text, metric_key text, created_at timestamptz not null default now()
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null, monthly_target numeric(15,2) not null check (monthly_target >= 0), updated_at timestamptz not null default now(), unique (user_id, category)
);
create table public.bible_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  book text not null, chapters text, minutes integer check (minutes is null or minutes >= 0), entry_date date not null, note text, created_at timestamptz not null default now()
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  workout_type text not null, duration integer check (duration is null or duration >= 0), body_weight numeric(7,2), notes text, entry_date date not null, created_at timestamptz not null default now()
);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(), workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise text not null, sets integer check (sets is null or sets >= 0), reps integer check (reps is null or reps >= 0), weight numeric(7,2), rpe numeric(3,1)
);
create table public.coding_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  problems integer not null check (problems > 0), category text not null, platform text, entry_date date not null, note text, created_at timestamptz not null default now()
);
create table public.daily_pulse (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null, mood smallint check (mood between 1 and 10), energy smallint check (energy between 1 and 10), stress smallint check (stress between 1 and 10), updated_at timestamptz not null default now(), unique(user_id, entry_date)
);
create table public.tags (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, unique(user_id, name)
);
create table public.journal_tags (
  journal_id uuid not null references public.journal(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade, primary key(journal_id, tag_id)
);
create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, lessons text, intentions text, created_at timestamptz not null default now(), unique(user_id, month)
);
create table public.season_snapshots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, bible_days integer not null default 0, gym_sessions integer not null default 0,
  coding_problems integer not null default 0, deep_work_minutes integer not null default 0,
  created_at timestamptz not null default now(), unique(user_id, month)
);

alter table public.entries enable row level security;
alter table public.journal enable row level security;
alter table public.reviews enable row level security;
alter table public.financial_entries enable row level security;
alter table public.budgets enable row level security;
alter table public.bible_entries enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.coding_entries enable row level security;
alter table public.daily_pulse enable row level security;
alter table public.tags enable row level security;
alter table public.journal_tags enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.season_snapshots enable row level security;

create policy "own entries" on public.entries using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own journal" on public.journal using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own reviews" on public.reviews using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own financial entries" on public.financial_entries using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own budgets" on public.budgets using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own bible entries" on public.bible_entries using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own workouts" on public.workouts using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own coding entries" on public.coding_entries using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own daily pulse" on public.daily_pulse using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own tags" on public.tags using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own monthly reviews" on public.monthly_reviews using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own snapshots" on public.season_snapshots using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own workout exercises" on public.workout_exercises
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid())));
create policy "own journal tags" on public.journal_tags
  using (exists (select 1 from public.journal j where j.id = journal_id and j.user_id = (select auth.uid())) and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = (select auth.uid())))
  with check (exists (select 1 from public.journal j where j.id = journal_id and j.user_id = (select auth.uid())) and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = (select auth.uid())));

create index entries_user_date_idx on public.entries(user_id, entry_date desc);
create index entries_user_metric_date_idx on public.entries(user_id, metric_key, entry_date desc);
create index financial_entries_user_metric_date_idx on public.financial_entries(user_id, metric_key, entry_date desc);
create index bible_entries_user_date_idx on public.bible_entries(user_id, entry_date desc);
create index workouts_user_date_idx on public.workouts(user_id, entry_date desc);
create index coding_entries_user_date_idx on public.coding_entries(user_id, entry_date desc);
create index journal_entries_legacy_user_date_idx on public.journal(user_id, entry_date desc);
create index milestones_user_date_idx on public.milestones(user_id, achieved_at desc);

revoke all on public.entries, public.journal, public.reviews, public.financial_entries, public.budgets,
  public.bible_entries, public.workouts, public.workout_exercises, public.coding_entries, public.daily_pulse,
  public.tags, public.journal_tags, public.monthly_reviews, public.season_snapshots from anon;
grant select, insert, update, delete on public.entries, public.journal, public.reviews, public.financial_entries,
  public.budgets, public.bible_entries, public.workouts, public.workout_exercises, public.coding_entries,
  public.daily_pulse, public.tags, public.journal_tags, public.monthly_reviews, public.season_snapshots to authenticated;

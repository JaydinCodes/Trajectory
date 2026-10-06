-- Import bookkeeping is private operational metadata. It makes a re-run idempotent without
-- relying on source IDs being reused as Postgres IDs.
create table public.legacy_import_map (
  user_id uuid not null references auth.users(id) on delete cascade,
  source_table text not null,
  legacy_id text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, source_table, legacy_id)
);

alter table public.legacy_import_map enable row level security;
create policy "own import map" on public.legacy_import_map
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.legacy_import_map from anon, authenticated;

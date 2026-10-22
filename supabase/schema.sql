-- Run once in Supabase SQL Editor. Replace the UUID in the final INSERT.
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon;
grant select on public.portfolio_admins to authenticated;
drop policy if exists "Admin sees own membership" on public.portfolio_admins;
create policy "Admin sees own membership" on public.portfolio_admins
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.portfolio_state (
  id integer primary key check (id = 1),
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.portfolio_state enable row level security;
grant select on public.portfolio_state to anon, authenticated;
grant insert, update, delete on public.portfolio_state to authenticated;
drop policy if exists "Everyone reads portfolio" on public.portfolio_state;
create policy "Everyone reads portfolio" on public.portfolio_state
  for select to anon, authenticated using (true);
drop policy if exists "Only owner inserts" on public.portfolio_state;
create policy "Only owner inserts" on public.portfolio_state
  for insert to authenticated with check (
    exists (select 1 from public.portfolio_admins where user_id = auth.uid())
  );
drop policy if exists "Only owner updates" on public.portfolio_state;
create policy "Only owner updates" on public.portfolio_state
  for update to authenticated using (
    exists (select 1 from public.portfolio_admins where user_id = auth.uid())
  ) with check (
    exists (select 1 from public.portfolio_admins where user_id = auth.uid())
  );
drop policy if exists "Only owner deletes" on public.portfolio_state;
create policy "Only owner deletes" on public.portfolio_state
  for delete to authenticated using (
    exists (select 1 from public.portfolio_admins where user_id = auth.uid())
  );

-- After creating your own Auth user, run the following separately
-- with YOUR Auth User UUID, NOT an email or API key:
-- insert into public.portfolio_admins (user_id)
-- values ('YOUR-USER-UUID-HERE') on conflict do nothing;

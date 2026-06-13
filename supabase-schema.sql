-- ============================================================
-- WildWeekend — Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- One row per trip. All crew data lives in the jsonb "data" column.
create table if not exists public.trips (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

-- OPEN policies so the app works immediately (friends-only app).
-- Anyone with your site URL can read/write the trip row.
drop policy if exists "trips read" on public.trips;
drop policy if exists "trips write" on public.trips;
drop policy if exists "trips update" on public.trips;

create policy "trips read"   on public.trips for select using (true);
create policy "trips write"  on public.trips for insert with check (true);
create policy "trips update" on public.trips for update using (true);

-- ── OPTIONAL: once Google sign-in works, lock writes to signed-in users ──
-- drop policy "trips write"  on public.trips;
-- drop policy "trips update" on public.trips;
-- create policy "trips write"  on public.trips for insert with check (auth.role() = 'authenticated');
-- create policy "trips update" on public.trips for update using (auth.role() = 'authenticated');

-- Realtime: broadcast row changes to all connected devices
alter publication supabase_realtime add table public.trips;

-- Seed the shared trip row
insert into public.trips (id, data) values ('camping-june-2026', '{}'::jsonb)
on conflict (id) do nothing;

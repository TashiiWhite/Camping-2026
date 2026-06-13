-- ============================================================
-- Camping 2026 — v8 migration: lock writes + admin features
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to run once. It is idempotent (drops/recreates policies).
-- ============================================================

-- ---------- 1) LOCK WRITES TO SIGNED-IN USERS ----------
-- Reading stays open (so the app loads for everyone), but only
-- authenticated (signed-in) users can insert or update the trip.
alter table public.trips enable row level security;

drop policy if exists "trips read"   on public.trips;
drop policy if exists "trips write"  on public.trips;
drop policy if exists "trips update" on public.trips;

create policy "trips read"   on public.trips for select using (true);
create policy "trips write"  on public.trips for insert with check (auth.role() = 'authenticated');
create policy "trips update" on public.trips for update using (auth.role() = 'authenticated');

-- ---------- 2) ADMIN CONFIG TABLE ----------
-- Single-row table holding admin-controlled, app-wide settings:
--   - departure banner (text/link/on-off) shown to everyone
--   - whether new sign-ups are allowed
--   - leaders: array of emails granted full-site access (no admin panel)
-- Readable by everyone (so the banner shows for all), but only the
-- owner email can write to it.
create table if not exists public.admin_config (
  id text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;

drop policy if exists "admin_config read"  on public.admin_config;
drop policy if exists "admin_config write" on public.admin_config;
drop policy if exists "admin_config update" on public.admin_config;

-- Everyone can read the config (needed to display the banner to all users)
create policy "admin_config read" on public.admin_config for select using (true);

-- Only the owner email may insert/update the config
create policy "admin_config write" on public.admin_config
  for insert with check ( (auth.jwt() ->> 'email') = 'tashiiwhite@gmail.com' );
create policy "admin_config update" on public.admin_config
  for update using ( (auth.jwt() ->> 'email') = 'tashiiwhite@gmail.com' );

-- Realtime for the banner so it appears/updates live for everyone
alter publication supabase_realtime add table public.admin_config;

-- Seed the config row
insert into public.admin_config (id, data) values ('global', '{}'::jsonb)
on conflict (id) do nothing;

-- ---------- 3) (OPTIONAL) DISABLE PUBLIC SIGN-UPS ----------
-- The "allow new sign-ups on/off" toggle in the admin page is enforced
-- in-app, but to truly stop new accounts at the platform level go to:
--   Supabase Dashboard -> Authentication -> Sign In / Providers
--   -> turn OFF "Allow new users to sign up"
-- (There is no SQL for this; it is a project auth setting.)

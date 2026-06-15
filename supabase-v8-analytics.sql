-- ============================================================
-- Camping 2026 — v8 analytics (admin dashboard data center)
-- Run this in the Supabase SQL editor once.
--
-- Tracks, per signed-in email (and anonymous visitors):
--   • first_seen / last_seen
--   • total visits (sessions)
--   • total seconds spent on the site
--   • role last seen as (visitor/camper/leader/admin)
-- Plus a lightweight daily rollup for month / all-time visit totals.
-- ============================================================

create table if not exists site_visitors (
  id           text primary key,         -- email if signed in, else 'anon:'+client_id
  email        text,                     -- null for anonymous
  is_anon      boolean default false,
  role         text,                     -- last-seen role
  display_name text,
  first_seen   timestamptz default now(),
  last_seen    timestamptz default now(),
  visits       integer default 1,        -- session count
  seconds      bigint  default 0,        -- cumulative seconds on site
  updated_at   timestamptz default now()
);

-- Per-day visit counter (one row per calendar day) for fast month/all-time sums.
create table if not exists site_daily (
  day          date primary key,
  visits       integer default 0,        -- total sessions that day
  uniques      integer default 0,        -- distinct visitor ids that day
  updated_at   timestamptz default now()
);

alter table site_visitors enable row level security;
alter table site_daily    enable row level security;

-- Anyone (anon key) can read + upsert their own analytics rows.
-- (This app has no server; the client writes its own counters. Acceptable for a
--  private friends' trip. Tighten later with an edge function if desired.)
drop policy if exists "analytics read"  on site_visitors;
drop policy if exists "analytics write" on site_visitors;
create policy "analytics read"  on site_visitors for select using (true);
create policy "analytics write" on site_visitors for all    using (true) with check (true);

drop policy if exists "daily read"  on site_daily;
drop policy if exists "daily write" on site_daily;
create policy "daily read"  on site_daily for select using (true);
create policy "daily write" on site_daily for all    using (true) with check (true);

-- Optional: enable realtime so the admin dashboard counters update live.
-- In Supabase: Database → Replication → add site_visitors (and site_daily) to the publication.

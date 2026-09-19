-- First-party funnel events from lib/track.ts via /api/track.
-- Run once in the Supabase SQL editor (or psql). Safe to re-run.
--
-- No IP address, cookie or device identifier is stored — only the event,
-- the page, the quote it relates to, and campaign params already in the URL.

create table if not exists public.site_events (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  event         text not null,
  path          text,
  referrer_host text,
  quote_code    text,
  tier          text,
  amount        integer,
  lender        text,
  placement     text,
  item          text,
  format        text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text
);

-- Added after the table shipped: `item` carries the catalogue line on a
-- `cart_add` (e.g. "deye::SUN-5K-SG 1-phase"). Databases created before this
-- column existed need the alter; new ones already have it from the block above.
-- PostgREST rejects an INSERT whose payload names a column it cannot see, so a
-- missing `item` here does not drop one field — it drops the whole event.
alter table public.site_events add column if not exists item text;

create index if not exists site_events_created_at_idx on public.site_events (created_at desc);
create index if not exists site_events_event_idx on public.site_events (event);
create index if not exists site_events_quote_code_idx on public.site_events (quote_code);

alter table public.site_events enable row level security;

-- Quote requests from the calculator's "Get this system built" form.
-- Run once in the Supabase SQL editor. The API route inserts with the
-- service-role key, so RLS can stay on with no public policies.

create table if not exists public.quote_requests (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  quote_code  text not null,
  name        text not null,
  phone       text not null,
  email       text,
  location    text not null,
  note        text,
  tier        text not null,
  total_best  integer not null,
  total_low   integer not null,
  total_high  integer not null,
  quote_url   text not null,
  summary     text not null,
  status      text not null default 'new'   -- new | contacted | quoted | won | lost
);

create index if not exists quote_requests_created_at_idx on public.quote_requests (created_at desc);
create index if not exists quote_requests_quote_code_idx on public.quote_requests (quote_code);

alter table public.quote_requests enable row level security;

-- ── Admin leads dashboard (/admin/leads) ──────────────────────────────
-- The dashboard filters by status and does a free-text ilike across
-- quote_code / name / phone / location, always ordered by created_at desc.

-- Status filter chips and the "by status" summary counts.
create index if not exists quote_requests_status_idx
  on public.quote_requests (status);

-- Status + newest-first, which is the shape of every filtered page view.
create index if not exists quote_requests_status_created_at_idx
  on public.quote_requests (status, created_at desc);

-- Case-insensitive prefix/suffix search on the free-text fields. pg_trgm
-- makes `ilike '%term%'` indexable; without it Postgres seq-scans, which is
-- fine at today's row counts but not at 100k leads.
create extension if not exists pg_trgm;

create index if not exists quote_requests_search_trgm_idx
  on public.quote_requests
  using gin (quote_code gin_trgm_ops, name gin_trgm_ops, phone gin_trgm_ops, location gin_trgm_ops);
